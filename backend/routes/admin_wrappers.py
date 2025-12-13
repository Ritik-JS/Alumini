"""
Admin endpoint wrappers for frontend compatibility
Maps missing admin routes to existing backend endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import require_admin
from database.connection import get_sync_db_connection
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin-wrappers"])


@router.get("/stats", dependencies=[Depends(require_admin)])
async def get_admin_stats():
    """
    Get admin dashboard statistics
    Wrapper for /admin/analytics/dashboard
    """
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Total users by role
        cursor.execute("""
            SELECT 
                COUNT(*) as totalUsers,
                SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as activeUsers,
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as totalStudents,
                SUM(CASE WHEN role = 'alumni' THEN 1 ELSE 0 END) as totalAlumni,
                SUM(CASE WHEN role = 'recruiter' THEN 1 ELSE 0 END) as totalRecruiters
            FROM users
        """)
        user_stats = cursor.fetchone()
        
        # Verified alumni
        cursor.execute("SELECT COUNT(*) as verifiedAlumni FROM alumni_profiles WHERE is_verified = TRUE")
        verified_stats = cursor.fetchone()
        
        # Jobs stats
        cursor.execute("""
            SELECT 
                COUNT(*) as totalJobs,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeJobs
            FROM jobs
        """)
        job_stats = cursor.fetchone()
        
        # Events stats
        cursor.execute("""
            SELECT 
                COUNT(*) as totalEvents,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedEvents
            FROM events
        """)
        event_stats = cursor.fetchone()
        
        # Forum posts
        cursor.execute("SELECT COUNT(*) as totalPosts FROM forum_posts WHERE is_deleted = FALSE")
        forum_stats = cursor.fetchone()
        
        # Mentorship requests
        cursor.execute("SELECT COUNT(*) as totalMentorshipRequests FROM mentorship_requests")
        mentorship_stats = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": {
                **user_stats,
                **verified_stats,
                **job_stats,
                **event_stats,
                "forumPosts": forum_stats['totalPosts'],
                "mentorshipRequests": mentorship_stats['totalMentorshipRequests']
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/content", dependencies=[Depends(require_admin)])
async def get_admin_content():
    """
    Get all content managed by admin
    Returns forum posts, jobs, events, etc.
    """
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Get forum posts
        cursor.execute("""
            SELECT 
                'forum_post' as content_type,
                id,
                title,
                content,
                author_id,
                created_at,
                is_deleted
            FROM forum_posts
            ORDER BY created_at DESC
            LIMIT 50
        """)
        forum_posts = cursor.fetchall()
        
        # Get jobs
        cursor.execute("""
            SELECT 
                'job' as content_type,
                id,
                title,
                description as content,
                posted_by as author_id,
                created_at,
                status
            FROM jobs
            ORDER BY created_at DESC
            LIMIT 50
        """)
        jobs = cursor.fetchall()
        
        # Get events
        cursor.execute("""
            SELECT 
                'event' as content_type,
                id,
                title,
                description as content,
                created_by as author_id,
                created_at,
                status
            FROM events
            ORDER BY created_at DESC
            LIMIT 50
        """)
        events = cursor.fetchall()
        
        # Format dates
        all_content = forum_posts + jobs + events
        for item in all_content:
            if item.get('created_at'):
                item['created_at'] = item['created_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": all_content
        }
    
    except Exception as e:
        logger.error(f"Error fetching admin content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
