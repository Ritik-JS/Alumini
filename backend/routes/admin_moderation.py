"""
Admin Content Moderation Routes
Handles flagged content review and moderation actions
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging
from database.connection import get_sync_db_connection
from middleware.auth_middleware import require_admin, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/moderation", tags=["admin-moderation"])


@router.get("/flagged", dependencies=[Depends(require_admin)])
async def get_flagged_content(
    type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get all flagged content across the platform"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Get all flagged content from content_flags table with content details
        cursor.execute("""
            SELECT 
                cf.id as flag_id,
                cf.content_id as id,
                cf.content_type,
                cf.reason,
                cf.status,
                cf.flagged_by,
                cf.created_at as timestamp,
                cf.reviewed_at,
                u.email as reported_by_email,
                COALESCE(fp.title, j.title, e.title, 'No Title') as title,
                COALESCE(fp.content, j.description, e.description, 'No Content') as content,
                COALESCE(u2.email, u3.email, u4.email, 'Unknown') as author
            FROM content_flags cf
            LEFT JOIN users u ON cf.flagged_by = u.id
            LEFT JOIN forum_posts fp ON cf.content_type = 'post' AND cf.content_id = fp.id
            LEFT JOIN jobs j ON cf.content_type = 'job' AND cf.content_id = j.id
            LEFT JOIN events e ON cf.content_type = 'event' AND cf.content_id = e.id
            LEFT JOIN users u2 ON fp.author_id = u2.id
            LEFT JOIN users u3 ON j.posted_by = u3.id
            LEFT JOIN users u4 ON e.created_by = u4.id
            WHERE cf.status = 'pending'
            ORDER BY cf.created_at DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        
        flagged_items = cursor.fetchall()
        
        # Categorize by type for frontend
        categorized_data = {
            'posts': [],
            'jobs': [],
            'comments': []
        }
        
        for item in flagged_items:
            # Format dates
            if item.get('timestamp'):
                item['timestamp'] = item['timestamp'].isoformat()
            if item.get('reviewed_at'):
                item['reviewed_at'] = item['reviewed_at'].isoformat()
            
            # Set reportedBy field
            item['reportedBy'] = item.get('reported_by_email', 'Unknown')
            
            # Map content_type to frontend categories
            if item['content_type'] == 'post':
                item['type'] = 'forum_post'
                categorized_data['posts'].append(item)
            elif item['content_type'] == 'job':
                item['type'] = 'job_posting'
                categorized_data['jobs'].append(item)
            elif item['content_type'] == 'comment':
                item['type'] = 'comment'
                categorized_data['comments'].append(item)
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": categorized_data
        }
    
    except Exception as e:
        logger.error(f"Error fetching flagged content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approve", dependencies=[Depends(require_admin)])
async def approve_content(
    approve_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Approve flagged content and remove flag"""
    try:
        content_id = approve_data.get('content_id')
        content_type = approve_data.get('content_type')
        
        if not content_id or not content_type:
            raise HTTPException(status_code=400, detail="content_id and content_type are required")
        
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Update based on content type
        if content_type == 'posts':
            cursor.execute("""
                UPDATE forum_posts 
                SET is_flagged = FALSE, updated_at = NOW()
                WHERE id = %s
            """, (content_id,))
        elif content_type == 'jobs':
            cursor.execute("""
                UPDATE jobs 
                SET is_flagged = FALSE, updated_at = NOW()
                WHERE id = %s
            """, (content_id,))
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'content_moderation', %s, %s, 'Approved flagged content')
        """, (current_user['id'], content_type, content_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Content approved successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove", dependencies=[Depends(require_admin)])
async def remove_content(
    remove_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Remove flagged content from platform"""
    try:
        content_id = remove_data.get('content_id')
        content_type = remove_data.get('content_type')
        
        if not content_id or not content_type:
            raise HTTPException(status_code=400, detail="content_id and content_type are required")
        
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Delete or mark as deleted based on content type
        if content_type == 'posts':
            cursor.execute("""
                UPDATE forum_posts 
                SET is_deleted = TRUE, updated_at = NOW()
                WHERE id = %s
            """, (content_id,))
        elif content_type == 'jobs':
            cursor.execute("""
                UPDATE jobs 
                SET status = 'removed', updated_at = NOW()
                WHERE id = %s
            """, (content_id,))
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'content_moderation', %s, %s, 'Removed flagged content')
        """, (current_user['id'], content_type, content_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Content removed successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/warn", dependencies=[Depends(require_admin)])
async def warn_author(
    warn_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send warning to content author"""
    try:
        content_id = warn_data.get('content_id')
        content_type = warn_data.get('content_type')
        reason = warn_data.get('reason', 'Policy violation')
        
        if not content_id or not content_type:
            raise HTTPException(status_code=400, detail="content_id and content_type are required")
        
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Get author id based on content type
        author_id = None
        if content_type == 'posts':
            cursor.execute("SELECT author_id FROM forum_posts WHERE id = %s", (content_id,))
            result = cursor.fetchone()
            author_id = result['author_id'] if result else None
        elif content_type == 'jobs':
            cursor.execute("SELECT posted_by FROM jobs WHERE id = %s", (content_id,))
            result = cursor.fetchone()
            author_id = result['posted_by'] if result else None
        
        if author_id:
            # Create warning notification
            cursor.execute("""
                INSERT INTO notifications (user_id, type, title, message, link, priority)
                VALUES (%s, 'system', 'Content Warning', %s, NULL, 'high')
            """, (author_id, f"Your content has been flagged for: {reason}"))
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'content_moderation', %s, %s, %s)
        """, (current_user['id'], content_type, content_id, f'Warned author: {reason}'))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Warning sent to author"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending warning: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
