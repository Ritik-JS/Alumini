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
        
        # Query with JOINs to get complete user and profile data
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
                mr.updated_at,
                
                -- Student user info
                su.email as student_email,
                su.role as student_role,
                
                -- Student profile info
                sp.name as student_name,
                sp.photo_url as student_photo_url,
                sp.current_company as student_company,
                sp.current_role as student_role_title,
                
                -- Mentor user info
                mu.email as mentor_email,
                mu.role as mentor_role,
                
                -- Mentor profile info
                mp.name as mentor_name,
                mp.photo_url as mentor_photo_url,
                mp.current_company as mentor_company,
                mp.current_role as mentor_role_title
                
            FROM mentorship_requests mr
            
            -- Join student data
            LEFT JOIN users su ON mr.student_id = su.id
            LEFT JOIN alumni_profiles sp ON mr.student_id = sp.user_id
            
            -- Join mentor data
            LEFT JOIN users mu ON mr.mentor_id = mu.id
            LEFT JOIN alumni_profiles mp ON mr.mentor_id = mp.user_id
            
            ORDER BY mr.requested_at DESC
        """)
        
        requests = cursor.fetchall()
        
        # Parse JSON and format dates, create nested structure
        import json
        for req in requests:
            # Parse preferred topics
            if req.get('preferred_topics'):
                try:
                    req['preferred_topics'] = json.loads(req['preferred_topics']) if isinstance(req['preferred_topics'], str) else req['preferred_topics']
                except:
                    req['preferred_topics'] = []
            
            # Format dates
            if req.get('requested_at'):
                req['requested_at'] = req['requested_at'].isoformat()
            if req.get('accepted_at'):
                req['accepted_at'] = req['accepted_at'].isoformat()
            if req.get('rejected_at'):
                req['rejected_at'] = req['rejected_at'].isoformat()
            if req.get('updated_at'):
                req['updated_at'] = req['updated_at'].isoformat()
            
            # Create nested student object
            req['student'] = {
                'email': req.pop('student_email'),
                'role': req.pop('student_role')
            }
            
            req['studentProfile'] = {
                'name': req.pop('student_name'),
                'photo_url': req.pop('student_photo_url'),
                'current_company': req.pop('student_company'),
                'current_role': req.pop('student_role_title')
            }
            
            # Create nested mentor object
            req['mentor'] = {
                'email': req.pop('mentor_email'),
                'role': req.pop('mentor_role')
            }
            
            req['mentorProfile'] = {
                'name': req.pop('mentor_name'),
                'photo_url': req.pop('mentor_photo_url'),
                'current_company': req.pop('mentor_company'),
                'current_role': req.pop('mentor_role_title')
            }
            
            # Get sessions for this mentorship
            cursor.execute("""
                SELECT id, scheduled_date, duration, status, agenda, rating
                FROM mentorship_sessions
                WHERE mentorship_request_id = %s
                ORDER BY scheduled_date DESC
            """, (req['id'],))
            
            sessions = cursor.fetchall()
            for session in sessions:
                session['scheduled_date'] = session['scheduled_date'].isoformat()
            
            req['sessions'] = sessions
        
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