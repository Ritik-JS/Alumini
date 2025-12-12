"""
Notifications API Routes
Handles notification management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from middleware.auth_middleware import get_current_user
from database.models import (
    UserResponse,
    NotificationListResponse,
    UnreadCountResponse,
    MarkReadResponse,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate
)
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

notification_service = NotificationService()


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    unread_only: bool = Query(False, description="Show only unread notifications"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's notifications with pagination
    
    - **page**: Page number (default: 1)
    - **limit**: Number of notifications per page (default: 20, max: 100)
    - **unread_only**: Filter to show only unread notifications
    
    Returns paginated list of notifications with total count and unread count
    """
    try:
        result = await notification_service.get_user_notifications(
            user_id=current_user['id'],
            page=page,
            limit=limit,
            unread_only=unread_only
        )
        return result
        
    except Exception as e:
        logger.error(f"Error getting notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve notifications")


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """
    Get count of unread notifications for current user
    
    Returns the number of unread notifications
    """
    try:
        count = await notification_service.get_unread_count(current_user['id'])
        return UnreadCountResponse(unread_count=count)
        
    except Exception as e:
        logger.error(f"Error getting unread count: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get unread count")


@router.put("/{notification_id}/read", response_model=MarkReadResponse)
async def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a specific notification as read
    
    - **notification_id**: ID of the notification to mark as read
    
    Returns success status and message
    """
    try:
        success = await notification_service.mark_as_read(
            notification_id=notification_id,
            user_id=current_user['id']
        )
        
        if success:
            return MarkReadResponse(
                success=True,
                message="Notification marked as read"
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Notification not found or you don't have permission to modify it"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")


@router.put("/read-all", response_model=MarkReadResponse)
async def mark_all_notifications_as_read(
    current_user: dict = Depends(get_current_user)
):
    """
    Mark all notifications as read for current user
    
    Returns success status and message
    """
    try:
        success = await notification_service.mark_all_as_read(current_user['id'])
        
        if success:
            return MarkReadResponse(
                success=True,
                message="All notifications marked as read"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to mark all notifications as read")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark all notifications as read")


@router.delete("/{notification_id}", response_model=MarkReadResponse)
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific notification
    
    - **notification_id**: ID of the notification to delete
    
    Returns success status and message
    """
    try:
        success = await notification_service.delete_notification(
            notification_id=notification_id,
            user_id=current_user['id']
        )
        
        if success:
            return MarkReadResponse(
                success=True,
                message="Notification deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Notification not found or you don't have permission to delete it"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")


@router.get("/preferences", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's notification preferences
    
    Returns user's notification settings including:
    - Email/push notification toggles
    - Notification type preferences
    - Notification frequency
    - Quiet hours settings
    """
    try:
        preferences = await notification_service.get_user_preferences(current_user['id'])
        
        if preferences:
            return preferences
        
        # Return default preferences if none exist
        return NotificationPreferencesResponse(
            id="",
            user_id=current_user['id'],
            email_notifications=True,
            push_notifications=True,
            notification_types={
                "profile": True,
                "mentorship": True,
                "job": True,
                "event": True,
                "forum": True,
                "system": True,
                "verification": True
            },
            notification_frequency="instant",
            quiet_hours_start=None,
            quiet_hours_end=None,
            created_at=None,
            updated_at=None
        )
        
    except Exception as e:
        logger.error(f"Error getting notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve notification preferences")


@router.put("/preferences", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    preferences: NotificationPreferencesUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user's notification preferences
    
    Request body should include:
    - **email_notifications**: Enable/disable email notifications
    - **push_notifications**: Enable/disable push notifications
    - **notification_types**: Dictionary of notification type preferences
    - **notification_frequency**: instant, daily, or weekly
    - **quiet_hours_start**: Start time for quiet hours (HH:MM format)
    - **quiet_hours_end**: End time for quiet hours (HH:MM format)
    
    Returns updated notification preferences
    """
    try:
        updated_preferences = await notification_service.update_user_preferences(
            user_id=current_user['id'],
            preferences=preferences
        )
        
        if updated_preferences:
            return updated_preferences
        else:
            raise HTTPException(status_code=500, detail="Failed to update notification preferences")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update notification preferences")
