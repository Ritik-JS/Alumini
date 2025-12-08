"""
Knowledge Capsules Wrapper Routes
Provides /api/knowledge/* endpoints that map to /api/capsules/*
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from database.models import (
    KnowledgeCapsuleCreate,
    KnowledgeCapsuleUpdate,
    KnowledgeCapsuleResponse,
    KnowledgeCapsuleListResponse,
    CapsuleBookmarkResponse,
    CapsuleLikeResponse,
    CapsuleCategory
)
from middleware.auth_middleware import get_current_user, require_roles
from services.capsule_service import CapsuleService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Capsules"])


@router.post("/capsules", response_model=KnowledgeCapsuleResponse)
async def create_capsule(
    capsule_data: KnowledgeCapsuleCreate,
    current_user: dict = Depends(require_roles(["alumni", "admin"]))
):
    """
    Create a new knowledge capsule (Alumni only)
    Wrapper for POST /api/capsules/create
    """
    try:
        capsule = await CapsuleService.create_capsule(
            author_id=current_user['id'],
            title=capsule_data.title,
            content=capsule_data.content,
            category=capsule_data.category.value,
            tags=capsule_data.tags,
            duration_minutes=capsule_data.duration_minutes,
            featured_image=capsule_data.featured_image
        )
        
        return capsule
        
    except Exception as e:
        logger.error(f"Error creating capsule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create capsule: {str(e)}")


@router.get("/capsules", response_model=KnowledgeCapsuleListResponse)
async def list_capsules(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[CapsuleCategory] = None,
    tags: Optional[str] = Query(None, description="Comma-separated list of tags"),
    featured_only: bool = False,
    author_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    List knowledge capsules with filters
    Wrapper for GET /api/capsules
    """
    try:
        tags_list = tags.split(',') if tags else None
        user_id = current_user['id'] if current_user else None
        
        result = await CapsuleService.list_capsules(
            page=page,
            limit=limit,
            category=category.value if category else None,
            tags=tags_list,
            featured_only=featured_only,
            author_id=author_id,
            search=search,
            user_id=user_id
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error listing capsules: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list capsules: {str(e)}")


@router.get("/bookmarks", response_model=KnowledgeCapsuleListResponse)
async def get_my_bookmarks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's bookmarked capsules
    Wrapper for GET /api/capsules/my-bookmarks
    """
    try:
        result = await CapsuleService.get_user_bookmarks(
            user_id=current_user['id'],
            page=page,
            limit=limit
        )
        return result
        
    except Exception as e:
        logger.error(f"Error getting bookmarks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get bookmarks: {str(e)}")


@router.get("/capsules/{capsule_id}", response_model=KnowledgeCapsuleResponse)
async def get_capsule(
    capsule_id: str,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get a specific knowledge capsule by ID
    Wrapper for GET /api/capsules/:id
    """
    try:
        user_id = current_user['id'] if current_user else None
        capsule = await CapsuleService.get_capsule_by_id(capsule_id, user_id)
        
        if not capsule:
            raise HTTPException(status_code=404, detail="Capsule not found")
        
        return capsule
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting capsule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get capsule: {str(e)}")


@router.put("/capsules/{capsule_id}", response_model=KnowledgeCapsuleResponse)
async def update_capsule(
    capsule_id: str,
    capsule_data: KnowledgeCapsuleUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a knowledge capsule (Author only)
    Wrapper for PUT /api/capsules/:id
    """
    try:
        # Prepare update data
        update_data = capsule_data.model_dump(exclude_unset=True)
        
        # Convert category enum to string if present
        if 'category' in update_data and update_data['category']:
            update_data['category'] = update_data['category'].value
        
        capsule = await CapsuleService.update_capsule(
            capsule_id=capsule_id,
            author_id=current_user['id'],
            update_data=update_data
        )
        
        if not capsule:
            raise HTTPException(
                status_code=404,
                detail="Capsule not found or you don't have permission to update it"
            )
        
        return capsule
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating capsule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update capsule: {str(e)}")


@router.delete("/capsules/{capsule_id}")
async def delete_capsule(
    capsule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a knowledge capsule (Author or Admin only)
    Wrapper for DELETE /api/capsules/:id
    """
    try:
        is_admin = current_user.get('role') == 'admin'
        
        success = await CapsuleService.delete_capsule(
            capsule_id=capsule_id,
            user_id=current_user['id'],
            is_admin=is_admin
        )
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Capsule not found or you don't have permission to delete it"
            )
        
        return {"message": "Capsule deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting capsule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete capsule: {str(e)}")


@router.post("/capsules/{capsule_id}/like", response_model=CapsuleLikeResponse)
async def toggle_like_capsule(
    capsule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Like or unlike a knowledge capsule
    Wrapper for POST /api/capsules/:id/like
    """
    try:
        result = await CapsuleService.toggle_like(
            capsule_id=capsule_id,
            user_id=current_user['id']
        )
        return result
        
    except Exception as e:
        logger.error(f"Error toggling like: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle like: {str(e)}")


@router.post("/capsules/{capsule_id}/bookmark", response_model=CapsuleBookmarkResponse)
async def toggle_bookmark_capsule(
    capsule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Bookmark or unbookmark a knowledge capsule
    Wrapper for POST /api/capsules/:id/bookmark
    """
    try:
        result = await CapsuleService.toggle_bookmark(
            capsule_id=capsule_id,
            user_id=current_user['id']
        )
        return result
        
    except Exception as e:
        logger.error(f"Error toggling bookmark: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle bookmark: {str(e)}")
