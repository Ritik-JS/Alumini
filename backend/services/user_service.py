"""User service for database operations"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
import logging
import aiomysql

from database.models import UserCreate, UserInDB, UserRole
from utils.security import hash_password

logger = logging.getLogger(__name__)


class UserService:
    """Service for user-related database operations"""
    
    @staticmethod
    async def create_user(conn: aiomysql.Connection, user_data: UserCreate) -> UserInDB:
        """Create a new user"""
        user_id = str(uuid.uuid4())
        password_hash = hash_password(user_data.password)
        
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = """
                INSERT INTO users (id, email, password_hash, role, is_verified, is_active)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            await cursor.execute(query, (
                user_id,
                user_data.email,
                password_hash,
                user_data.role.value,
                False,  # Not verified initially
                True    # Active by default
            ))
            # No need for explicit commit with autocommit=True, but keeping for safety
            if not conn.get_autocommit():
                await conn.commit()
            
            # Fetch the created user
            return await UserService.get_user_by_id(conn, user_id)
    
    @staticmethod
    async def get_user_by_email(conn: aiomysql.Connection, email: str) -> Optional[UserInDB]:
        """Get user by email"""
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = "SELECT * FROM users WHERE email = %s"
            await cursor.execute(query, (email,))
            result = await cursor.fetchone()
            
            if result:
                return UserInDB(**result)
            return None
    
    @staticmethod
    async def get_user_by_id(conn: aiomysql.Connection, user_id: str) -> Optional[UserInDB]:
        """Get user by ID"""
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = "SELECT * FROM users WHERE id = %s"
            await cursor.execute(query, (user_id,))
            result = await cursor.fetchone()
            
            if result:
                return UserInDB(**result)
            return None
    
    @staticmethod
    async def update_user_verification(conn: aiomysql.Connection, user_id: str, is_verified: bool) -> bool:
        """Update user verification status"""
        async with conn.cursor() as cursor:
            query = "UPDATE users SET is_verified = %s WHERE id = %s"
            await cursor.execute(query, (is_verified, user_id))
            # No need for explicit commit with autocommit=True, but keeping for safety
            if not conn.get_autocommit():
                await conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    async def update_last_login(conn: aiomysql.Connection, user_id: str) -> bool:
        """Update user's last login timestamp"""
        async with conn.cursor() as cursor:
            query = "UPDATE users SET last_login = %s WHERE id = %s"
            await cursor.execute(query, (datetime.utcnow(), user_id))
            # No need for explicit commit with autocommit=True, but keeping for safety
            if not conn.get_autocommit():
                await conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    async def update_password(conn: aiomysql.Connection, user_id: str, new_password: str) -> bool:
        """Update user password"""
        password_hash = hash_password(new_password)
        async with conn.cursor() as cursor:
            query = "UPDATE users SET password_hash = %s WHERE id = %s"
            await cursor.execute(query, (password_hash, user_id))
            # No need for explicit commit with autocommit=True, but keeping for safety
            if not conn.get_autocommit():
                await conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    async def check_email_exists(conn: aiomysql.Connection, email: str) -> bool:
        """Check if email already exists"""
        async with conn.cursor() as cursor:
            query = "SELECT COUNT(*) as count FROM users WHERE email = %s"
            await cursor.execute(query, (email,))
            result = await cursor.fetchone()
            return result[0] > 0
