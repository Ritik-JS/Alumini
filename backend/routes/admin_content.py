"""Admin content moderation routes"""
from fastapi import APIRouter, Depends, Query, HTTPException, Path
from typing import Optional

from database.models import (
    UserResponse, ContentFlagResponse, ContentModerateRequest,
    FlaggedContentListParams
)
from services.admin_service import AdminService
from middleware.auth_middleware import require_admin

router = APIRouter(prefix="/admin/content", tags=["Admin - Content Moderation"])


@router.get("/flagged")
async def get_flagged_content(
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get all flagged content for moderation
    
    **Admin only**
    
    Returns flagged posts, comments, jobs, events, and profiles
    """
    try:
        result = await AdminService.get_flagged_content(
            content_type=content_type,
            status=status,
            page=page,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/moderate")
async def moderate_content(
    request: ContentModerateRequest,
    current_user: UserResponse = Depends(require_admin)
):
    """
    Moderate flagged content (approve or remove)
    
    **Admin only**
    
    Actions:
    - approve: Approve the content and dismiss flag
    - remove: Remove/delete the content
    """
    try:
        if request.action not in ['approve', 'remove']:
            raise HTTPException(status_code=400, detail="Action must be 'approve' or 'remove'")
        
        result = await AdminService.moderate_content(
            flag_id=request.flag_id,
            admin_id=current_user.id,
            action=request.action,
            admin_notes=request.admin_notes
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{content_type}/{content_id}")
async def remove_content_directly(
    content_type: str = Path(..., description="Type of content (post, comment, job, event)"),
    content_id: str = Path(..., description="ID of the content to remove"),
    reason: str = Query(..., description="Reason for removal"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Remove content directly without flag
    
    **Admin only**
    
    Supported content types:
    - post
    - comment
    - job
    - event
    """
    try:
        result = await AdminService.remove_content(
            content_type=content_type,
            content_id=content_id,
            admin_id=current_user.id,
            reason=reason
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
