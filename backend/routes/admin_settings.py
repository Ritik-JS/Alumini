"""Admin system settings routes"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from database.models import (
    UserResponse, SystemConfigResponse, SystemConfigUpdate,
    SystemConfigListResponse
)
from services.admin_service import AdminService
from middleware.auth_middleware import require_admin

router = APIRouter(prefix="/api/admin/settings", tags=["Admin - System Settings"])


@router.get("", response_model=SystemConfigListResponse)
async def get_system_settings(
    current_user: dict = Depends(require_admin)
):
    """
    Get all system configuration settings
    
    **Admin only**
    
    Returns all system settings including:
    - Platform name
    - Feature toggles
    - Limits and thresholds
    - Email settings
    """
    try:
        configs = await AdminService.get_system_settings()
        return {
            "configs": configs,
            "total": len(configs)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("")
async def update_system_setting(
    update: SystemConfigUpdate,
    current_user: dict = Depends(require_admin)
):
    """
    Update a system configuration setting
    
    **Admin only**
    
    Creates new setting if it doesn't exist
    """
    try:
        result = await AdminService.update_system_setting(
            config_key=update.config_key,
            config_value=update.config_value,
            admin_id=current_user['id'],
            description=update.description
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
