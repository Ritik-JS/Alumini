"""Authentication service"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple
import logging
import aiomysql

from database.models import (
    UserCreate, UserLogin, UserInDB, TokenResponse, UserResponse,
    EmailVerificationRequest, ForgotPasswordRequest, ResetPasswordRequest
)
from services.user_service import UserService
from services.email_service import email_service
from utils.security import (
    verify_password, create_access_token, generate_otp, generate_reset_token
)

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication operations"""
    
    @staticmethod
    async def register_user(conn: aiomysql.Connection, user_data: UserCreate) -> Tuple[UserInDB, str]:
        """Register a new user and send verification email"""
        # Check if email already exists
        if await UserService.check_email_exists(conn, user_data.email):
            raise ValueError("Email already registered")
        
        # Create user
        user = await UserService.create_user(conn, user_data)
        
        # Generate OTP
        otp_code = generate_otp()
        verification_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(minutes=15)
        
        # Store OTP in database
        async with conn.cursor() as cursor:
            query = """
                INSERT INTO email_verifications (id, user_id, otp_code, expires_at, is_used)
                VALUES (%s, %s, %s, %s, %s)
            """
            await cursor.execute(query, (verification_id, user.id, otp_code, expires_at, False))
            await conn.commit()
        
        # Send verification email
        await email_service.send_verification_email(user.email, otp_code)
        
        return user, otp_code
    
    @staticmethod
    async def verify_email(conn: aiomysql.Connection, verification_data: EmailVerificationRequest) -> bool:
        """Verify user email with OTP"""
        # Get user
        user = await UserService.get_user_by_email(conn, verification_data.email)
        if not user:
            raise ValueError("User not found")
        
        if user.is_verified:
            raise ValueError("Email already verified")
        
        # Check OTP
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = """
                SELECT * FROM email_verifications 
                WHERE user_id = %s AND otp_code = %s AND is_used = FALSE 
                AND expires_at > %s
                ORDER BY created_at DESC
                LIMIT 1
            """
            await cursor.execute(query, (user.id, verification_data.otp_code, datetime.utcnow()))
            verification = await cursor.fetchone()
            
            if not verification:
                raise ValueError("Invalid or expired OTP")
            
            # Mark OTP as used
            update_query = "UPDATE email_verifications SET is_used = TRUE WHERE id = %s"
            await cursor.execute(update_query, (verification['id'],))
            await conn.commit()
        
        # Update user verification status
        await UserService.update_user_verification(conn, user.id, True)
        
        # Send welcome email
        await email_service.send_welcome_email(user.email, user.email.split('@')[0])
        
        return True
    
    @staticmethod
    async def login_user(conn: aiomysql.Connection, login_data: UserLogin) -> TokenResponse:
        """Authenticate user and generate JWT token"""
        # Get user by email
        user = await UserService.get_user_by_email(conn, login_data.email)
        
        if not user:
            raise ValueError("Invalid email or password")
        
        # Verify password
        if not verify_password(login_data.password, user.password_hash):
            raise ValueError("Invalid email or password")
        
        # Check if user is active
        if not user.is_active:
            raise ValueError("Account is deactivated")
        
        # Check if email is verified
        if not user.is_verified:
            raise ValueError("Email not verified. Please check your email for verification code.")
        
        # Update last login
        await UserService.update_last_login(conn, user.id)
        
        # Create access token
        token_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role
        }
        access_token = create_access_token(token_data)
        
        # Prepare user response
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            is_verified=user.is_verified,
            is_active=user.is_active,
            last_login=user.last_login,
            created_at=user.created_at
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    
    @staticmethod
    async def forgot_password(conn: aiomysql.Connection, request_data: ForgotPasswordRequest) -> bool:
        """Initiate password reset process"""
        # Check if user exists
        user = await UserService.get_user_by_email(conn, request_data.email)
        if not user:
            # Don't reveal if email exists or not (security)
            return True
        
        # Generate reset token
        reset_token = generate_reset_token()
        reset_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        # Store reset token
        async with conn.cursor() as cursor:
            query = """
                INSERT INTO password_resets (id, user_id, reset_token, expires_at, is_used)
                VALUES (%s, %s, %s, %s, %s)
            """
            await cursor.execute(query, (reset_id, user.id, reset_token, expires_at, False))
            await conn.commit()
        
        # Send reset email
        await email_service.send_password_reset_email(user.email, reset_token)
        
        return True
    
    @staticmethod
    async def reset_password(conn: aiomysql.Connection, reset_data: ResetPasswordRequest) -> bool:
        """Reset user password with token"""
        # Verify reset token
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = """
                SELECT pr.*, u.id as user_id, u.email
                FROM password_resets pr
                JOIN users u ON pr.user_id = u.id
                WHERE pr.reset_token = %s AND pr.is_used = FALSE AND pr.expires_at > %s
                LIMIT 1
            """
            await cursor.execute(query, (reset_data.reset_token, datetime.utcnow()))
            reset_record = await cursor.fetchone()
            
            if not reset_record:
                raise ValueError("Invalid or expired reset token")
            
            # Mark token as used
            update_query = "UPDATE password_resets SET is_used = TRUE WHERE id = %s"
            await cursor.execute(update_query, (reset_record['id'],))
            await conn.commit()
        
        # Update password
        await UserService.update_password(conn, reset_record['user_id'], reset_data.new_password)
        
        return True
    
    @staticmethod
    async def get_current_user(conn: aiomysql.Connection, user_id: str) -> UserResponse:
        """Get current user information"""
        user = await UserService.get_user_by_id(conn, user_id)
        
        if not user:
            raise ValueError("User not found")
        
        return UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            is_verified=user.is_verified,
            is_active=user.is_active,
            last_login=user.last_login,
            created_at=user.created_at
        )
