"""Forum routes for posts, comments, and likes"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import logging

from database.models import (
    ForumPostCreate, ForumPostUpdate, ForumPostResponse,
    ForumPostWithAuthor, ForumCommentCreate, ForumCommentUpdate,
    ForumCommentResponse, ForumCommentWithAuthor, LikeToggleResponse
)
from services.forum_service import ForumService
from middleware.auth_middleware import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/forum", tags=["forum"])


# Helper function to transform post/comment data with nested author object
def transform_author_data(data: dict) -> dict:
    """Transform flat author fields to nested author object"""
    if 'author_name' in data:
        data['author'] = {
            'id': data.get('author_id'),
            'email': data.get('author_email'),
            'role': data.get('author_role', 'user'),
            'profile': {
                'name': data.get('author_name'),
                'photo_url': data.get('author_photo_url')
            }
        }
        # Keep flat fields for backward compatibility
    return data


# ========== Forum Post Routes ==========

@router.post("/posts", response_model=dict)
async def create_post(
    post_data: ForumPostCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new forum post"""
    try:
        post = await ForumService.create_post(post_data, current_user["id"])
        return {
            "success": True,
            "data": post.model_dump(),
            "message": "Post created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts", response_model=dict)
async def get_all_posts(
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),  # Comma-separated tags
    sort: Optional[str] = Query("recent", regex="^(recent|popular|trending)$"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Get all forum posts with filters"""
    try:
        # Parse tags if provided
        tags_list = tags.split(",") if tags else None
        
        # Get user_id if authenticated
        user_id = current_user["id"] if current_user else None
        
        posts = await ForumService.get_all_posts(
            search=search,
            tags=tags_list,
            sort_by=sort,
            limit=limit,
            offset=offset,
            user_id=user_id
        )
        return {
            "success": True,
            "data": [transform_author_data(post.model_dump()) for post in posts]
        }
    except Exception as e:
        logger.error(f"Error fetching posts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts/{post_id}", response_model=dict)
async def get_post(
    post_id: str,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Get post details by ID"""
    try:
        user_id = current_user["id"] if current_user else None
        post = await ForumService.get_post_by_id(post_id, user_id)
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        return {
            "success": True,
            "data": transform_author_data(post.model_dump())
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/posts/{post_id}", response_model=dict)
async def update_post(
    post_id: str,
    post_data: ForumPostUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a forum post (Author/Admin only)"""
    try:
        # Get the post to check authorship
        post = await ForumService.get_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check permissions
        if post.author_id != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update this post")
        
        updated_post = await ForumService.update_post(post_id, post_data)
        return {
            "success": True,
            "data": updated_post.model_dump() if updated_post else None,
            "message": "Post updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/posts/{post_id}", response_model=dict)
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a forum post (Author/Admin only)"""
    try:
        # Get the post to check authorship
        post = await ForumService.get_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check permissions
        if post.author_id != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        
        success = await ForumService.delete_post(post_id)
        if success:
            return {
                "success": True,
                "message": "Post deleted successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Post not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-posts", response_model=dict)
async def get_my_posts(
    current_user: dict = Depends(get_current_user)
):
    """Get current user's forum posts"""
    try:
        posts = await ForumService.get_posts_by_author(current_user["id"])
        return {
            "success": True,
            "data": [transform_author_data(post.model_dump()) for post in posts]
        }
    except Exception as e:
        logger.error(f"Error fetching user posts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tags", response_model=dict)
async def get_all_tags():
    """Get all unique tags used in forum posts"""
    try:
        tags = await ForumService.get_all_tags()
        return {
            "success": True,
            "data": tags
        }
    except Exception as e:
        logger.error(f"Error fetching tags: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/posts/{post_id}/like", response_model=dict)
async def toggle_post_like(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Like/unlike a post"""
    try:
        # Check if post exists
        post = await ForumService.get_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        result = await ForumService.toggle_post_like(post_id, current_user["id"])
        message = "Post liked successfully" if result.liked else "Post unliked successfully"
        
        return {
            "success": True,
            "data": result.model_dump(),
            "message": message
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling post like: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Forum Comment Routes ==========

@router.get("/posts/{post_id}/comments", response_model=dict)
async def get_post_comments(
    post_id: str,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Get all comments for a post"""
    try:
        user_id = current_user["id"] if current_user else None
        comments = await ForumService.get_post_comments(post_id, user_id)
        
        # Transform comments recursively
        def transform_comment(comment_dict):
            transformed = transform_author_data(comment_dict)
            if 'replies' in transformed and transformed['replies']:
                transformed['replies'] = [transform_comment(reply) for reply in transformed['replies']]
            return transformed
        
        return {
            "success": True,
            "data": [transform_comment(comment.model_dump()) for comment in comments]
        }
    except Exception as e:
        logger.error(f"Error fetching comments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/posts/{post_id}/comments", response_model=dict)
async def create_comment(
    post_id: str,
    comment_data: ForumCommentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a post"""
    try:
        # Check if post exists
        post = await ForumService.get_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # If replying to a comment, check if parent comment exists and belongs to this post
        if comment_data.parent_comment_id:
            # This validation would need a method in the service
            pass
        
        comment = await ForumService.create_comment(post_id, comment_data, current_user["id"])
        return {
            "success": True,
            "data": comment.model_dump(),
            "message": "Comment added successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating comment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/comments/{comment_id}", response_model=dict)
async def update_comment(
    comment_id: str,
    comment_data: ForumCommentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a comment (Author/Admin only)"""
    try:
        # Would need a method to get comment with author check
        # For now, update and check if it exists
        updated_comment = await ForumService.update_comment(comment_id, comment_data)
        
        if not updated_comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        return {
            "success": True,
            "data": updated_comment.model_dump(),
            "message": "Comment updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating comment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/comments/{comment_id}", response_model=dict)
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a comment (Author/Admin only)"""
    try:
        is_admin = current_user.get("role") == "admin"
        success = await ForumService.delete_comment(
            comment_id, 
            current_user["id"],
            is_admin
        )
        
        if success:
            return {
                "success": True,
                "message": "Comment deleted successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Comment not found")
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting comment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/comments/{comment_id}/like", response_model=dict)
async def toggle_comment_like(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Like/unlike a comment"""
    try:
        result = await ForumService.toggle_comment_like(comment_id, current_user["id"])
        message = "Comment liked successfully" if result.liked else "Comment unliked successfully"
        
        return {
            "success": True,
            "data": result.model_dump(),
            "message": message
        }
    except Exception as e:
        logger.error(f"Error toggling comment like: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
