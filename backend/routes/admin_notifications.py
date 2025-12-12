from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging
from database.connection import get_sync_db_connection
from middleware.auth_middleware import require_admin, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/notifications", tags=["admin-notifications"])

@router.get("", dependencies=[Depends(require_admin)])
async def get_all_notifications(
    type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get all notifications"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        query = """
            SELECT 
                n.*,
                u.email,
                u.role
            FROM notifications n
            LEFT JOIN users u ON n.user_id = u.id
            WHERE 1=1
        """
        
        params = []
        
        if type and type != 'all':
            query += " AND n.type = %s"
            params.append(type)
        
        query += " ORDER BY n.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        notifications = cursor.fetchall()
        
        # Format dates
        for notif in notifications:
            notif['created_at'] = notif['created_at'].isoformat() if notif.get('created_at') else None
            if notif.get('read_at'):
                notif['read_at'] = notif['read_at'].isoformat()
            # Add user object for frontend
            notif['user'] = {"email": notif.get('email'), "role": notif.get('role')}
        
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
async def create_notification(
    notification_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create and send a notification"""
    try:
        user_id = notification_data.get('user_id', 'broadcast')
        notif_type = notification_data.get('type', 'system')
        title = notification_data.get('title')
        message = notification_data.get('message')
        link = notification_data.get('link')
        priority = notification_data.get('priority', 'medium')
        
        if not title or not message:
            raise HTTPException(status_code=400, detail="title and message are required")
        
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # If broadcast, send to all users
        if user_id == 'broadcast':
            cursor.execute("SELECT id FROM users WHERE is_active = TRUE")
            users = cursor.fetchall()
            
            for user in users:
                cursor.execute("""
                    INSERT INTO notifications (user_id, type, title, message, link, priority)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (user['id'], notif_type, title, message, link, priority))
        else:
            cursor.execute("""
                INSERT INTO notifications (user_id, type, title, message, link, priority)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, notif_type, title, message, link, priority))
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'notification', 'notification', NULL, %s)
        """, (current_user['id'], f'Created notification: {title}'))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Notification created successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{notification_id}", dependencies=[Depends(require_admin)])
async def update_notification(
    notification_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update a notification"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        update_fields = []
        params = []
        
        if 'type' in update_data:
            update_fields.append("type = %s")
            params.append(update_data['type'])
        
        if 'title' in update_data:
            update_fields.append("title = %s")
            params.append(update_data['title'])
        
        if 'message' in update_data:
            update_fields.append("message = %s")
            params.append(update_data['message'])
        
        if 'link' in update_data:
            update_fields.append("link = %s")
            params.append(update_data['link'])
        
        if 'priority' in update_data:
            update_fields.append("priority = %s")
            params.append(update_data['priority'])
        
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
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        connection = get_sync_db_connection()
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
async def resend_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Resend a notification"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Get original notification
        cursor.execute("""
            SELECT user_id, type, title, message, link, priority
            FROM notifications
            WHERE id = %s
        """, (notification_id,))
        
        notif = cursor.fetchone()
        
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Create new notification with same content
        cursor.execute("""
            INSERT INTO notifications (user_id, type, title, message, link, priority)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (notif['user_id'], notif['type'], notif['title'], notif['message'], notif['link'], notif['priority']))
        
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