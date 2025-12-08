"""Authentication middleware for JWT validation and role-based access control"""
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
import aiomysql
from functools import wraps

from database.connection import get_db_pool
from database.models import UserRole, UserInDB
from utils.security import decode_access_token
from services.user_service import UserService

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Dependency to get current authenticated user from JWT token"""
    token = credentials.credentials
    
    # Decode token
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract user info from token
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify user exists and is active
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        user = await UserService.get_user_by_id(conn, user_id)
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated"
            )
    
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_verified": user.is_verified
    }


def require_roles(allowed_roles: List[UserRole]):
    """Dependency to check if user has required role"""
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        
        if user_role not in [role.value for role in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
            )
        
        return current_user
    
    return role_checker


def require_verified_email(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency to check if user's email is verified"""
    if not current_user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required to access this resource"
        )
    return current_user


# Backward compatibility alias
def require_role(allowed_roles: List[str]):
    """
    Backward compatibility function for require_role.
    Converts string roles to UserRole enums.
    """
    role_mapping = {
        "admin": UserRole.ADMIN,
        "alumni": UserRole.ALUMNI,
        "student": UserRole.STUDENT,
        "recruiter": UserRole.RECRUITER
    }
    
    enum_roles = [role_mapping.get(role.lower(), role) for role in allowed_roles]
    return require_roles(enum_roles)


# Convenience dependencies for specific roles
require_admin = require_roles([UserRole.ADMIN])
require_alumni = require_roles([UserRole.ALUMNI, UserRole.ADMIN])
require_recruiter = require_roles([UserRole.RECRUITER, UserRole.ADMIN])
require_student_or_alumni = require_roles([UserRole.STUDENT, UserRole.ALUMNI, UserRole.ADMIN])
