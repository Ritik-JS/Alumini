"""Admin user management routes"""
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional

from database.models import (
    UserResponse, UserListParams, UserDetailResponse,
    UserUpdateRequest, UserSuspendRequest
)
from services.admin_service import AdminService
from middleware.auth_middleware import get_current_user, require_admin

router = APIRouter(prefix="/api/admin/users", tags=["Admin - User Management"])


@router.get("")
async def list_all_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    is_verified: Optional[bool] = Query(None, description="Filter by verification status"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by email or name"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """
    Get all users with filters and pagination
    
    **Admin only**
    
    Supports filtering by:
    - Role (student, alumni, recruiter, admin)
    - Verification status
    - Active status
    - Search term (email, name)
    """
    try:
        result = await AdminService.get_all_users(
            role=role,
            is_verified=is_verified,
            is_active=is_active,
            search=search,
            page=page,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
async def get_user_detail(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Get detailed information for a specific user
    
    **Admin only**
    
    Returns user account details and profile information
    """
    try:
        user = await AdminService.get_user_detail(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    updates: UserUpdateRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Update user information
    
    **Admin only**
    
    Can update:
    - Role
    - Active status
    - Verification status
    """
    try:
        updates_dict = updates.dict(exclude_unset=True)
        result = await AdminService.update_user(
            user_id=user_id,
            admin_id=current_user['id'],
            updates=updates_dict
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Delete user account (soft delete - deactivates account)
    
    **Admin only**
    """
    try:
        result = await AdminService.delete_user(
            user_id=user_id,
            admin_id=current_user['id']
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    request: UserSuspendRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Suspend a user account
    
    **Admin only**
    
    Requires a reason for suspension
    """
    try:
        result = await AdminService.suspend_user(
            user_id=user_id,
            admin_id=current_user['id'],
            reason=request.reason
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Activate a suspended user account
    
    **Admin only**
    """
    try:
        result = await AdminService.activate_user(
            user_id=user_id,
            admin_id=current_user['id']
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
