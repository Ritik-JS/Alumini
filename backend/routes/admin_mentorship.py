from fastapi import APIRouter, HTTPException, Depends
import logging
from database.connection import get_sync_db_connection
from middleware.auth_middleware import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/mentorship", tags=["admin-mentorship"])

@router.get("/requests", dependencies=[Depends(require_admin)])
async def get_all_mentorship_requests():
    """Get all mentorship requests with user details"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Simple query - just get mentorship requests
        cursor.execute("""
            SELECT 
                mr.id,
                mr.student_id,
                mr.mentor_id,
                mr.status,
                mr.request_message,
                mr.goals,
                mr.preferred_topics,
                mr.requested_at,
                mr.accepted_at,
                mr.rejected_at,
                mr.updated_at
            FROM mentorship_requests mr
            ORDER BY mr.requested_at DESC
        """)
        
        requests = cursor.fetchall()
        
        # Parse JSON and format dates
        import json
        for req in requests:
            if req.get('preferred_topics'):
                try:
                    req['preferred_topics'] = json.loads(req['preferred_topics']) if isinstance(req['preferred_topics'], str) else req['preferred_topics']
                except:
                    req['preferred_topics'] = []
            
            if req.get('requested_at'):
                req['requested_at'] = req['requested_at'].isoformat()
            if req.get('accepted_at'):
                req['accepted_at'] = req['accepted_at'].isoformat()
            if req.get('rejected_at'):
                req['rejected_at'] = req['rejected_at'].isoformat()
            if req.get('updated_at'):
                req['updated_at'] = req['updated_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": requests
        }
    
    except Exception as e:
        logger.error(f"Error fetching mentorship requests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions", dependencies=[Depends(require_admin)])
async def get_all_sessions():
    """Get all mentorship sessions"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT 
                ms.*,
                mr.student_id,
                mr.mentor_id
            FROM mentorship_sessions ms
            JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
            ORDER BY ms.scheduled_date DESC
        """)
        
        sessions = cursor.fetchall()
        
        # Format dates
        for session in sessions:
            session['scheduled_date'] = session['scheduled_date'].isoformat()
            session['created_at'] = session['created_at'].isoformat()
            session['updated_at'] = session['updated_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": sessions
        }
    
    except Exception as e:
        logger.error(f"Error fetching mentorship sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mentors", dependencies=[Depends(require_admin)])
async def get_mentors():
    """Get all mentors with their stats"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT 
                mp.*,
                u.email,
                ap.name,
                ap.photo_url,
                ap.current_company,
                ap.current_role
            FROM mentor_profiles mp
            JOIN users u ON mp.user_id = u.id
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            ORDER BY mp.rating DESC
        """)
        
        mentors = cursor.fetchall()
        
        # Parse JSON fields
        import json
        for mentor in mentors:
            if mentor.get('expertise_areas'):
                try:
                    mentor['expertise_areas'] = json.loads(mentor['expertise_areas']) if isinstance(mentor['expertise_areas'], str) else mentor['expertise_areas']
                except:
                    mentor['expertise_areas'] = []
            
            mentor['created_at'] = mentor['created_at'].isoformat()
            mentor['updated_at'] = mentor['updated_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": mentors
        }
    
    except Exception as e:
        logger.error(f"Error fetching mentors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))