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
        
        # Get flagged forum posts
        cursor.execute("""
            SELECT 
                fp.id,
                fp.title,
                fp.content,
                fp.created_at as timestamp,
                u.email as author,
                'forum_post' as type,
                'Spam' as reason,
                'System' as reportedBy
            FROM forum_posts fp
            JOIN users u ON fp.author_id = u.id
            WHERE fp.is_flagged = TRUE
            ORDER BY fp.created_at DESC
            LIMIT 50
        """)
        flagged_posts = cursor.fetchall()
        
        # Format posts
        for post in flagged_posts:
            post['timestamp'] = post['timestamp'].isoformat() if post.get('timestamp') else None
        
        # Get flagged jobs
        cursor.execute("""
            SELECT 
                j.id,
                j.title,
                j.description as content,
                j.created_at as timestamp,
                u.email as author,
                'job_posting' as type,
                'Suspicious/Scam' as reason,
                'System' as reportedBy
            FROM jobs j
            JOIN users u ON j.posted_by = u.id
            WHERE j.is_flagged = TRUE
            ORDER BY j.created_at DESC
            LIMIT 50
        """)
        flagged_jobs = cursor.fetchall()
        
        # Format jobs
        for job in flagged_jobs:
            job['timestamp'] = job['timestamp'].isoformat() if job.get('timestamp') else None
        
        # Get flagged comments (if exists)
        flagged_comments = []
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": {
                "posts": flagged_posts,
                "jobs": flagged_jobs,
                "comments": flagged_comments
            }
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
