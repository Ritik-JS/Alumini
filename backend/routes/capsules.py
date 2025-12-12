"""
Knowledge Capsules Routes
API endpoints for knowledge capsules system
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

router = APIRouter(prefix="/api/capsules", tags=["Knowledge Capsules"])


@router.post("/create", response_model=KnowledgeCapsuleResponse)
async def create_capsule(
    capsule_data: KnowledgeCapsuleCreate,
    current_user: dict = Depends(require_roles(["alumni", "admin"]))
):
    """
    Create a new knowledge capsule (Alumni only)
    
    - **title**: Capsule title (5-255 characters)
    - **content**: Capsule content (minimum 50 characters)
    - **category**: Category (technical, career, entrepreneurship, life_lessons, industry_insights, other)
    - **tags**: List of tags (max 10)
    - **duration_minutes**: Estimated reading time (optional, 1-120 minutes)
    - **featured_image**: URL to featured image (optional)
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


@router.get("", response_model=KnowledgeCapsuleListResponse)
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
    
    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 20, max: 100)
    - **category**: Filter by category
    - **tags**: Filter by tags (comma-separated)
    - **featured_only**: Show only featured capsules
    - **author_id**: Filter by author
    - **search**: Search in title and content
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


@router.get("/trending", response_model=list[KnowledgeCapsuleResponse])
async def get_trending_capsules(
    limit: int = Query(10, ge=1, le=50),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get trending capsules based on views, likes, and bookmarks
    
    - **limit**: Number of capsules to return (default: 10, max: 50)
    """
    try:
        user_id = current_user['id'] if current_user else None
        capsules = await CapsuleService.get_trending_capsules(limit=limit, user_id=user_id)
        return capsules
        
    except Exception as e:
        logger.error(f"Error getting trending capsules: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get trending capsules: {str(e)}")


@router.get("/my-bookmarks", response_model=KnowledgeCapsuleListResponse)
async def get_my_bookmarks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's bookmarked capsules
    
    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 20, max: 100)
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


@router.get("/{capsule_id}", response_model=KnowledgeCapsuleResponse)
async def get_capsule(
    capsule_id: str,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get a specific knowledge capsule by ID
    
    - **capsule_id**: UUID of the capsule
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


@router.put("/{capsule_id}", response_model=KnowledgeCapsuleResponse)
async def update_capsule(
    capsule_id: str,
    capsule_data: KnowledgeCapsuleUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a knowledge capsule (Author only)
    
    - **capsule_id**: UUID of the capsule
    - Only the author can update their capsule
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


@router.delete("/{capsule_id}")
async def delete_capsule(
    capsule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a knowledge capsule (Author or Admin only)
    
    - **capsule_id**: UUID of the capsule
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


@router.post("/{capsule_id}/like", response_model=CapsuleLikeResponse)
async def toggle_like_capsule(
    capsule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Like or unlike a knowledge capsule
    
    - **capsule_id**: UUID of the capsule
    - Toggles like status (if liked, unlikes; if not liked, likes)
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


@router.post("/{capsule_id}/bookmark", response_model=CapsuleBookmarkResponse)
async def toggle_bookmark_capsule(
    capsule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Bookmark or unbookmark a knowledge capsule
    
    - **capsule_id**: UUID of the capsule
    - Toggles bookmark status (if bookmarked, unbookmarks; if not bookmarked, bookmarks)
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


@router.get("/categories")
async def get_categories(
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get all unique categories from knowledge capsules
    
    Returns list of categories with capsule counts
    """
    try:
        from database.connection import get_db_pool
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get all unique categories with counts
                await cursor.execute("""
                    SELECT category, COUNT(*) as count
                    FROM knowledge_capsules
                    WHERE category IS NOT NULL AND category != ''
                    GROUP BY category
                    ORDER BY count DESC
                """)
                results = await cursor.fetchall()
                
                categories = [
                    {
                        "name": row[0],
                        "count": row[1]
                    }
                    for row in results
                ]
                
                return {
                    "success": True,
                    "data": categories,
                    "total": len(categories)
                }
    
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")
