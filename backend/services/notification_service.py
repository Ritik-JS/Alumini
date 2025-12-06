"""
Notification Service
Handles notification creation, delivery, and preference management
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

from database.connection import get_db_pool
from database.models import (
    NotificationCreate,
    NotificationResponse,
    NotificationListResponse,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    NotificationType,
    NotificationPriority,
    NotificationFrequency,
    EmailQueueCreate
)
from services.email_service import EmailService

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing notifications"""
    
    def __init__(self):
        self.email_service = EmailService()
    
    async def create_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        link: Optional[str] = None,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[NotificationResponse]:
        """
        Create a new notification
        
        Args:
            user_id: User ID to send notification to
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            link: Optional link to related content
            priority: Notification priority
            metadata: Optional additional data
        
        Returns:
            Created notification or None if failed
        """
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    # Check if user has enabled this notification type
                    preferences = await self.get_user_preferences(user_id)
                    if preferences:
                        notification_types = preferences.notification_types
                        if not notification_types.get(notification_type.value, True):
                            logger.info(f"Notification type {notification_type} disabled for user {user_id}")
                            return None
                    
                    # Insert notification
                    query = """
                        INSERT INTO notifications 
                        (user_id, type, title, message, link, priority, metadata)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """
                    metadata_json = json.dumps(metadata) if metadata else None
                    
                    await cursor.execute(
                        query,
                        (user_id, notification_type.value, title, message, link, 
                         priority.value, metadata_json)
                    )
                    
                    notification_id = cursor.lastrowid
                    
                    # Fetch created notification
                    await cursor.execute(
                        "SELECT * FROM notifications WHERE id = %s",
                        (notification_id,)
                    )
                    row = await cursor.fetchone()
                    
                    if row:
                        # Send email notification if enabled
                        if preferences and preferences.email_notifications:
                            await self._send_email_notification(
                                user_id, notification_type, title, message, link
                            )
                        
                        return self._row_to_notification(row)
                    
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            return None
    
    async def get_user_notifications(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
        unread_only: bool = False
    ) -> NotificationListResponse:
        """
        Get user's notifications with pagination
        
        Args:
            user_id: User ID
            page: Page number (1-indexed)
            limit: Number of notifications per page
            unread_only: Whether to show only unread notifications
        
        Returns:
            Paginated list of notifications
        """
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    # Build query
                    where_clause = "WHERE user_id = %s"
                    params = [user_id]
                    
                    if unread_only:
                        where_clause += " AND is_read = FALSE"
                    
                    # Get total count
                    count_query = f"SELECT COUNT(*) as total FROM notifications {where_clause}"
                    await cursor.execute(count_query, params)
                    total_row = await cursor.fetchone()
                    total = total_row[0] if total_row else 0
                    
                    # Get unread count
                    await cursor.execute(
                        "SELECT COUNT(*) as unread FROM notifications WHERE user_id = %s AND is_read = FALSE",
                        (user_id,)
                    )
                    unread_row = await cursor.fetchone()
                    unread_count = unread_row[0] if unread_row else 0
                    
                    # Get paginated notifications
                    offset = (page - 1) * limit
                    query = f"""
                        SELECT * FROM notifications 
                        {where_clause}
                        ORDER BY created_at DESC
                        LIMIT %s OFFSET %s
                    """
                    params.extend([limit, offset])
                    
                    await cursor.execute(query, params)
                    rows = await cursor.fetchall()
                    
                    notifications = [self._row_to_notification(row) for row in rows]
                    
                    return NotificationListResponse(
                        notifications=notifications,
                        total=total,
                        page=page,
                        limit=limit,
                        unread_count=unread_count
                    )
                    
        except Exception as e:
            logger.error(f"Error getting notifications: {str(e)}")
            return NotificationListResponse(
                notifications=[],
                total=0,
                page=page,
                limit=limit,
                unread_count=0
            )
    
    async def get_unread_count(self, user_id: str) -> int:
        """
        Get count of unread notifications for user
        
        Args:
            user_id: User ID
        
        Returns:
            Count of unread notifications
        """
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(
                        "SELECT COUNT(*) as count FROM notifications WHERE user_id = %s AND is_read = FALSE",
                        (user_id,)
                    )
                    row = await cursor.fetchone()
                    return row[0] if row else 0
                    
        except Exception as e:
            logger.error(f"Error getting unread count: {str(e)}")
            return 0
    
    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """
        Mark notification as read
        
        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    query = """
                        UPDATE notifications 
                        SET is_read = TRUE, read_at = NOW()
                        WHERE id = %s AND user_id = %s
                    """
                    await cursor.execute(query, (notification_id, user_id))
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            return False
    
    async def mark_all_as_read(self, user_id: str) -> bool:
        """
        Mark all notifications as read for user
        
        Args:
            user_id: User ID
        
        Returns:
            True if successful, False otherwise
        """
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    query = """
                        UPDATE notifications 
                        SET is_read = TRUE, read_at = NOW()
                        WHERE user_id = %s AND is_read = FALSE
                    """
                    await cursor.execute(query, (user_id,))
                    return True
                    
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {str(e)}")
            return False
    
    async def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """
        Delete notification
        
        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    query = "DELETE FROM notifications WHERE id = %s AND user_id = %s"
                    await cursor.execute(query, (notification_id, user_id))
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error deleting notification: {str(e)}")
            return False
    
    async def get_user_preferences(self, user_id: str) -> Optional[NotificationPreferencesResponse]:
        """
        Get user's notification preferences
        
        Args:
            user_id: User ID
        
        Returns:
            User's notification preferences or None if not found
        """
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(
                        "SELECT * FROM notification_preferences WHERE user_id = %s",
                        (user_id,)
                    )
                    row = await cursor.fetchone()
                    
                    if row:
                        return self._row_to_preferences(row)
                    
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting notification preferences: {str(e)}")
            return None
    
    async def update_user_preferences(
        self,
        user_id: str,
        preferences: NotificationPreferencesUpdate
    ) -> Optional[NotificationPreferencesResponse]:
        """
        Update user's notification preferences
        
        Args:
            user_id: User ID
            preferences: Updated preferences
        
        Returns:
            Updated preferences or None if failed
        """
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    # Check if preferences exist
                    await cursor.execute(
                        "SELECT id FROM notification_preferences WHERE user_id = %s",
                        (user_id,)
                    )
                    existing = await cursor.fetchone()
                    
                    notification_types_json = json.dumps(preferences.notification_types)
                    
                    if existing:
                        # Update existing preferences
                        query = """
                            UPDATE notification_preferences 
                            SET 
                                email_notifications = %s,
                                push_notifications = %s,
                                notification_types = %s,
                                notification_frequency = %s,
                                quiet_hours_start = %s,
                                quiet_hours_end = %s,
                                updated_at = NOW()
                            WHERE user_id = %s
                        """
                        await cursor.execute(
                            query,
                            (
                                preferences.email_notifications,
                                preferences.push_notifications,
                                notification_types_json,
                                preferences.notification_frequency.value,
                                preferences.quiet_hours_start,
                                preferences.quiet_hours_end,
                                user_id
                            )
                        )
                    else:
                        # Insert new preferences
                        query = """
                            INSERT INTO notification_preferences 
                            (user_id, email_notifications, push_notifications, 
                             notification_types, notification_frequency, 
                             quiet_hours_start, quiet_hours_end)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """
                        await cursor.execute(
                            query,
                            (
                                user_id,
                                preferences.email_notifications,
                                preferences.push_notifications,
                                notification_types_json,
                                preferences.notification_frequency.value,
                                preferences.quiet_hours_start,
                                preferences.quiet_hours_end
                            )
                        )
                    
                    # Fetch updated preferences
                    return await self.get_user_preferences(user_id)
                    
        except Exception as e:
            logger.error(f"Error updating notification preferences: {str(e)}")
            return None
    
    async def _send_email_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        link: Optional[str] = None
    ):
        """
        Send email notification
        
        Args:
            user_id: User ID
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            link: Optional link
        """
        try:
            # Get user email
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(
                        "SELECT email FROM users WHERE id = %s",
                        (user_id,)
                    )
                    row = await cursor.fetchone()
                    
                    if row:
                        user_email = row[0]
                        
                        # Create email body
                        email_body = f"""
                        <html>
                            <body>
                                <h2>{title}</h2>
                                <p>{message}</p>
                                {f'<p><a href="{link}">View Details</a></p>' if link else ''}
                                <hr>
                                <p><small>This is an automated notification from AlumUnity.</small></p>
                            </body>
                        </html>
                        """
                        
                        # Send email via email service
                        await self.email_service.send_email(
                            to_email=user_email,
                            subject=f"AlumUnity: {title}",
                            body=email_body
                        )
                        
        except Exception as e:
            logger.error(f"Error sending email notification: {str(e)}")
    
    def _row_to_notification(self, row) -> NotificationResponse:
        """Convert database row to NotificationResponse"""
        metadata = json.loads(row[8]) if row[8] else None
        
        return NotificationResponse(
            id=row[0],
            user_id=row[1],
            type=NotificationType(row[2]),
            title=row[3],
            message=row[4],
            link=row[5],
            is_read=bool(row[6]),
            priority=NotificationPriority(row[7]),
            metadata=metadata,
            read_at=row[9],
            created_at=row[10]
        )
    
    def _row_to_preferences(self, row) -> NotificationPreferencesResponse:
        """Convert database row to NotificationPreferencesResponse"""
        # Column order: id, user_id, email_notifications, push_notifications, 
        # notification_types, notification_frequency, quiet_hours_start, 
        # quiet_hours_end, created_at, updated_at
        notification_types = json.loads(row[4]) if row[4] else {}
        
        return NotificationPreferencesResponse(
            id=row[0],
            user_id=row[1],
            email_notifications=bool(row[2]),
            push_notifications=bool(row[3]),
            notification_types=notification_types,
            notification_frequency=NotificationFrequency(row[5]),
            quiet_hours_start=str(row[6]) if row[6] else None,
            quiet_hours_end=str(row[7]) if row[7] else None,
            created_at=row[8],
            updated_at=row[9]
        )


# Notification trigger helper functions

async def notify_profile_verification(user_id: str, approved: bool, reason: Optional[str] = None):
    """Send notification for profile verification result"""
    service = NotificationService()
    
    if approved:
        await service.create_notification(
            user_id=user_id,
            notification_type=NotificationType.VERIFICATION,
            title="Profile Verified",
            message="Your profile has been verified by an administrator.",
            link="/profile",
            priority=NotificationPriority.HIGH
        )
    else:
        await service.create_notification(
            user_id=user_id,
            notification_type=NotificationType.VERIFICATION,
            title="Profile Verification Rejected",
            message=f"Your profile verification was rejected. Reason: {reason or 'Not specified'}",
            link="/profile",
            priority=NotificationPriority.HIGH
        )


async def notify_mentorship_request(mentor_id: str, student_name: str, request_id: str):
    """Send notification for new mentorship request"""
    service = NotificationService()
    
    await service.create_notification(
        user_id=mentor_id,
        notification_type=NotificationType.MENTORSHIP,
        title="New Mentorship Request",
        message=f"{student_name} has requested mentorship from you.",
        link=f"/mentorship/requests/{request_id}",
        priority=NotificationPriority.MEDIUM
    )


async def notify_mentorship_response(student_id: str, mentor_name: str, accepted: bool):
    """Send notification for mentorship request response"""
    service = NotificationService()
    
    if accepted:
        await service.create_notification(
            user_id=student_id,
            notification_type=NotificationType.MENTORSHIP,
            title="Mentorship Request Accepted",
            message=f"{mentor_name} has accepted your mentorship request!",
            link="/mentorship/active",
            priority=NotificationPriority.HIGH
        )
    else:
        await service.create_notification(
            user_id=student_id,
            notification_type=NotificationType.MENTORSHIP,
            title="Mentorship Request Declined",
            message=f"{mentor_name} has declined your mentorship request.",
            link="/mentorship/requests",
            priority=NotificationPriority.MEDIUM
        )


async def notify_job_application_status(applicant_id: str, job_title: str, status: str):
    """Send notification for job application status update"""
    service = NotificationService()
    
    status_messages = {
        "reviewed": "Your application has been reviewed.",
        "shortlisted": "Congratulations! You've been shortlisted.",
        "rejected": "Unfortunately, your application was not selected.",
        "accepted": "Congratulations! Your application has been accepted!"
    }
    
    priority = NotificationPriority.HIGH if status in ["shortlisted", "accepted"] else NotificationPriority.MEDIUM
    
    await service.create_notification(
        user_id=applicant_id,
        notification_type=NotificationType.JOB,
        title=f"Application Update: {job_title}",
        message=status_messages.get(status, f"Your application status: {status}"),
        link="/applications",
        priority=priority
    )


async def notify_event_reminder(user_id: str, event_title: str, event_id: str, event_date: datetime):
    """Send notification for event reminder"""
    service = NotificationService()
    
    await service.create_notification(
        user_id=user_id,
        notification_type=NotificationType.EVENT,
        title=f"Event Reminder: {event_title}",
        message=f"Your event '{event_title}' is happening soon on {event_date.strftime('%B %d, %Y at %I:%M %p')}",
        link=f"/events/{event_id}",
        priority=NotificationPriority.MEDIUM
    )


async def notify_forum_reply(user_id: str, commenter_name: str, post_title: str, post_id: str):
    """Send notification for forum post reply"""
    service = NotificationService()
    
    await service.create_notification(
        user_id=user_id,
        notification_type=NotificationType.FORUM,
        title="New Reply to Your Post",
        message=f"{commenter_name} replied to your post '{post_title}'",
        link=f"/forum/posts/{post_id}",
        priority=NotificationPriority.LOW
    )
