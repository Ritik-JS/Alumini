"""Authentication routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
import logging

from database.connection import get_db_pool
from database.models import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    EmailVerificationRequest, ForgotPasswordRequest, ResetPasswordRequest
)
from services.auth_service import AuthService
from middleware.auth_middleware import get_current_user
from middleware.rate_limit import strict_rate_limit, moderate_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    _rate_limit: None = Depends(strict_rate_limit)
):
    """
    Register a new user
    
    - Creates user account
    - Sends email verification OTP
    - Rate limited to 5 requests per minute
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            user, otp_code = await AuthService.register_user(conn, user_data)
            
            return {
                "success": True,
                "message": "User registered successfully. Please check your email for verification code.",
                "user_id": user.id,
                "email": user.email
            }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again later."
        )


@router.post("/verify-email", response_model=Dict)
async def verify_email(
    verification_data: EmailVerificationRequest,
    _rate_limit: None = Depends(moderate_rate_limit)
):
    """
    Verify user email with OTP
    
    - Validates OTP code
    - Activates user account
    - Sends welcome email
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            success = await AuthService.verify_email(conn, verification_data)
            
            if success:
                return {
                    "success": True,
                    "message": "Email verified successfully. You can now login."
                }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again."
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    _rate_limit: None = Depends(strict_rate_limit)
):
    """
    Login user and get JWT token
    
    - Validates credentials
    - Returns JWT access token
    - Updates last login timestamp
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            token_response = await AuthService.login_user(conn, login_data)
            return token_response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again later."
        )


@router.post("/forgot-password", response_model=Dict)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    _rate_limit: None = Depends(strict_rate_limit)
):
    """
    Request password reset
    
    - Generates reset token
    - Sends reset email with link
    - Token valid for 1 hour
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await AuthService.forgot_password(conn, request_data)
            
            return {
                "success": True,
                "message": "If the email exists, a password reset link has been sent."
            }
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        # Always return success to avoid email enumeration
        return {
            "success": True,
            "message": "If the email exists, a password reset link has been sent."
        }


@router.post("/reset-password", response_model=Dict)
async def reset_password(
    reset_data: ResetPasswordRequest,
    _rate_limit: None = Depends(moderate_rate_limit)
):
    """
    Reset user password with token
    
    - Validates reset token
    - Updates password
    - Invalidates token after use
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            success = await AuthService.reset_password(conn, reset_data)
            
            if success:
                return {
                    "success": True,
                    "message": "Password reset successfully. You can now login with your new password."
                }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again."
        )



@router.post("/change-password", response_model=Dict)
async def change_password(
    password_data: Dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Change user password (requires authentication)
    
    - Requires current password verification
    - Updates to new password
    - Requires valid JWT token
    """
    try:
        import bcrypt
        
        current_password = password_data.get('current_password')
        new_password = password_data.get('new_password')
        
        if not current_password or not new_password:
            raise ValueError("Current password and new password are required")
        
        if len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get current password hash
                await cursor.execute("""
                    SELECT password_hash FROM users WHERE id = %s
                """, (current_user['id'],))
                
                result = await cursor.fetchone()
                if not result:
                    raise ValueError("User not found")
                
                stored_hash = result[0]
                
                # Verify current password
                if not bcrypt.checkpw(current_password.encode('utf-8'), stored_hash.encode('utf-8')):
                    raise ValueError("Current password is incorrect")
                
                # Hash new password
                new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
                
                # Update password
                await cursor.execute("""
                    UPDATE users SET password_hash = %s WHERE id = %s
                """, (new_hash.decode('utf-8'), current_user['id']))
                
                await conn.commit()
                
                return {
                    "success": True,
                    "message": "Password changed successfully"
                }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password. Please try again."
        )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user information
    
    - Requires valid JWT token
    - Returns user profile data
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            user_response = await AuthService.get_current_user(conn, current_user["id"])
            return user_response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user information."
        )


@router.post("/logout", response_model=Dict)
async def logout(
    current_user: dict = Depends(get_current_user)
):
    """
    Logout user
    
    - Invalidates client-side token
    - In stateless JWT, client must discard token
    - Optional: Add token to blacklist in production
    """
    return {
        "success": True,
        "message": "Logged out successfully. Please discard your access token."
    }


@router.post("/resend-verification", response_model=Dict)
async def resend_verification(
    request_data: ForgotPasswordRequest,
    _rate_limit: None = Depends(strict_rate_limit)
):
    """
    Resend email verification OTP
    
    - Generates new OTP
    - Sends verification email
    - Rate limited
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            from services.user_service import UserService
            from services.email_service import email_service
            from utils.security import generate_otp
            import uuid
            from datetime import datetime, timedelta
            
            # Get user
            user = await UserService.get_user_by_email(conn, request_data.email)
            if not user:
                raise ValueError("User not found")
            
            if user.is_verified:
                raise ValueError("Email already verified")
            
            # Generate new OTP
            otp_code = generate_otp()
            verification_id = str(uuid.uuid4())
            expires_at = datetime.utcnow() + timedelta(minutes=15)
            
            # Store OTP
            async with conn.cursor() as cursor:
                query = """
                    INSERT INTO email_verifications (id, user_id, otp_code, expires_at, is_used)
                    VALUES (%s, %s, %s, %s, %s)
                """
                await cursor.execute(query, (verification_id, user.id, otp_code, expires_at, False))
                await conn.commit()
            
            # Send email
            await email_service.send_verification_email(user.email, otp_code)
            
            return {
                "success": True,
                "message": "Verification code resent successfully."
            }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resend verification code."
        )
