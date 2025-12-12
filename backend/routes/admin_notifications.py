from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from ..database.connection import get_db_connection
from ..middleware.auth_middleware import require_admin, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/notifications", tags=["admin-notifications"])

class NotificationCreate(BaseModel):
    user_id: str  # 'broadcast' for all users
    type: str
    title: str
    message: str
    link: Optional[str] = None
    priority: str = "medium"

@router.get("", dependencies=[Depends(require_admin)])
async def get_all_notifications(
    notification_type: Optional[str] = None,
    limit: int = 100
):
    """Get all system notifications"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT 
                n.*,
                u.email as user_email
            FROM notifications n
            LEFT JOIN users u ON n.user_id = u.id
            WHERE 1=1
        """
        
        params = []
        
        if notification_type:
            query += " AND n.type = %s"
            params.append(notification_type)
        
        query += " ORDER BY n.created_at DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, params)
        notifications = cursor.fetchall()
        
        # Format dates and parse metadata
        import json
        for notif in notifications:
            notif['created_at'] = notif['created_at'].isoformat()
            if notif.get('read_at'):
                notif['read_at'] = notif['read_at'].isoformat()
            if notif.get('metadata'):
                try:
                    notif['metadata'] = json.loads(notif['metadata']) if isinstance(notif['metadata'], str) else notif['metadata']
                except:
                    notif['metadata'] = {}
            
            # Add user object for frontend
            if notif.get('user_email'):
                notif['user'] = {"email": notif['user_email']}
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": notifications
        }
    
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", dependencies=[Depends(require_admin)])
async def create_notification(notif_data: NotificationCreate, current_user: dict = Depends(get_current_user)):
    """Create and send a notification"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        if notif_data.user_id == 'broadcast':
            # Send to all active users
            cursor.execute("SELECT id FROM users WHERE is_active = TRUE")
            users = cursor.fetchall()
            
            for user_row in users:
                cursor.execute("""
                    INSERT INTO notifications (user_id, type, title, message, link, priority)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    user_row[0],
                    notif_data.type,
                    notif_data.title,
                    notif_data.message,
                    notif_data.link,
                    notif_data.priority
                ))
        else:
            # Send to specific user
            cursor.execute("""
                INSERT INTO notifications (user_id, type, title, message, link, priority)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                notif_data.user_id,
                notif_data.type,
                notif_data.title,
                notif_data.message,
                notif_data.link,
                notif_data.priority
            ))
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, description)
            VALUES (%s, 'system_config', 'notification', %s)
        """, (current_user['id'], f"Sent notification: {notif_data.title}"))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Notification sent successfully"
        }
    
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{notification_id}", dependencies=[Depends(require_admin)])
async def update_notification(notification_id: str, update_data: dict):
    """Update a notification"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        update_fields = []
        params = []
        
        if 'title' in update_data:
            update_fields.append("title = %s")
            params.append(update_data['title'])
        
        if 'message' in update_data:
            update_fields.append("message = %s")
            params.append(update_data['message'])
        
        if 'link' in update_data:
            update_fields.append("link = %s")
            params.append(update_data['link'])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        params.append(notification_id)
        query = f"UPDATE notifications SET {', '.join(update_fields)} WHERE id = %s"
        
        cursor.execute(query, params)
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Notification updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{notification_id}", dependencies=[Depends(require_admin)])
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a notification"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("DELETE FROM notifications WHERE id = %s", (notification_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Notification deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{notification_id}/resend", dependencies=[Depends(require_admin)])
async def resend_notification(notification_id: str):
    """Resend a notification"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get original notification
        cursor.execute("SELECT * FROM notifications WHERE id = %s", (notification_id,))
        original = cursor.fetchone()
        
        if not original:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Create new notification with same content
        cursor.execute("""
            INSERT INTO notifications (user_id, type, title, message, link, priority)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            original['user_id'],
            original['type'],
            original['title'],
            original['message'],
            original['link'],
            original['priority']
        ))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Notification resent successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))