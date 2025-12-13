"""Mentorship management routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from typing import Optional
import aiomysql

from database.models import (
    MentorProfileCreate,
    MentorProfileUpdate,
    MentorProfileResponse,
    MentorSearchParams,
    MentorshipRequestCreate,
    MentorshipRequestResponse,
    AcceptMentorshipRequest,
    RejectMentorshipRequest,
    MentorshipSessionCreate,
    MentorshipSessionUpdate,
    MentorshipSessionFeedback,
    MentorshipSessionResponse,
    UserResponse
)
from services.mentorship_service import MentorshipService
from middleware.auth_middleware import get_current_user, require_role, require_admin
from database.connection import get_db_pool
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["mentorship"])


# ============================================================================
# MENTOR MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/mentors/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_as_mentor(
    profile_data: MentorProfileCreate,
    current_user: dict = Depends(require_role(["alumni"]))
):
    """
    Register as mentor (Alumni only)
    
    Requirements:
    - User must be alumni
    - Alumni profile must be at least 70% complete
    
    - **expertise_areas**: List of expertise areas (required, min 1)
    - **max_mentees**: Maximum number of mentees (default: 5, max: 20)
    - **mentorship_approach**: Description of mentorship approach
    """
    try:
        mentor_profile = await MentorshipService.register_as_mentor(current_user['id'], profile_data)
        return {
            "success": True,
            "message": "Successfully registered as mentor",
            "data": mentor_profile
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error registering mentor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register as mentor"
        )


@router.put("/mentors/availability", response_model=dict)
async def update_mentor_availability(
    profile_data: MentorProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update mentor profile and availability
    
    - **is_available**: Availability status
    - **expertise_areas**: List of expertise areas
    - **max_mentees**: Maximum number of mentees
    - **mentorship_approach**: Description of mentorship approach
    """
    try:
        mentor_profile = await MentorshipService.update_mentor_profile(current_user['id'], profile_data)
        
        if not mentor_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mentor profile not found. Please register as mentor first."
            )
        
        return {
            "success": True,
            "message": "Mentor profile updated successfully",
            "data": mentor_profile
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating mentor profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update mentor profile"
        )


@router.get("/mentors", response_model=dict)
async def list_mentors(
    expertise: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    available_only: bool = True,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    List available mentors with filters
    
    - **expertise**: Filter by expertise area
    - **min_rating**: Minimum rating (0-5)
    - **available_only**: Show only available mentors (default: true)
    - **page**: Page number (default: 1)
    - **limit**: Results per page (default: 20, max: 100)
    """
    try:
        search_params = MentorSearchParams(
            expertise=expertise,
            min_rating=min_rating,
            available_only=available_only,
            page=page,
            limit=limit
        )
        
        result = await MentorshipService.search_mentors(search_params)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Error listing mentors: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list mentors"
        )


@router.get("/mentors/{mentor_id}", response_model=dict)
async def get_mentor_profile(mentor_id: str):
    """
    Get mentor profile and statistics
    
    Public endpoint - anyone can view mentor profiles
    """
    try:
        mentor = await MentorshipService.get_mentor_with_details(mentor_id)
        
        if not mentor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mentor not found"
            )
        
        # Get statistics
        try:
            statistics = await MentorshipService.get_mentor_statistics(mentor['user_id'])
        except Exception:
            statistics = None
        
        return {
            "success": True,
            "data": {
                "profile": mentor,
                "statistics": statistics
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching mentor profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch mentor profile"
        )


@router.put("/mentors/profile", response_model=dict)
async def update_mentor_profile(
    profile_data: MentorProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update mentor profile (same as update availability)
    
    Alias endpoint for updating mentor profile
    """
    return await update_mentor_availability(profile_data, current_user)


# ============================================================================
# MENTORSHIP REQUEST ENDPOINTS
# ============================================================================

@router.post("/mentorship/request", response_model=dict, status_code=status.HTTP_201_CREATED)
async def send_mentorship_request(
    request_data: MentorshipRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Send mentorship request (Student or Alumni)
    
    - **mentor_id**: ID of the mentor (required)
    - **request_message**: Message to mentor (required, 20-1000 chars)
    - **goals**: Your mentorship goals (optional, max 2000 chars)
    - **preferred_topics**: List of preferred discussion topics (optional)
    """
    try:
        request = await MentorshipService.create_mentorship_request(current_user['id'], request_data)
        return {
            "success": True,
            "message": "Mentorship request sent successfully",
            "data": request
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating mentorship request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send mentorship request"
        )


# Compatibility: frontend expects plural '/mentorship/requests' (POST)
@router.post("/mentorship/requests", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_mentorship_request_alias(
    request_data: MentorshipRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    return await send_mentorship_request(request_data, current_user)


@router.post("/mentorship/{request_id}/accept", response_model=dict)
async def accept_mentorship_request(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Accept mentorship request (Mentor only)
    
    Only the mentor who received the request can accept it
    """
    try:
        request = await MentorshipService.accept_mentorship_request(request_id, current_user['id'])
        return {
            "success": True,
            "message": "Mentorship request accepted successfully",
            "data": request
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error accepting mentorship request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to accept mentorship request"
        )


# Compatibility: frontend uses PUT on '/mentorship/requests/{requestId}/accept'
@router.put("/mentorship/requests/{request_id}/accept", response_model=dict)
async def accept_mentorship_request_alias(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await accept_mentorship_request(request_id, current_user)


@router.post("/mentorship/{request_id}/reject", response_model=dict)
async def reject_mentorship_request(
    request_id: str,
    rejection_data: RejectMentorshipRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Reject mentorship request (Mentor only)
    
    - **rejection_reason**: Reason for rejection (required, 10-500 chars)
    
    Only the mentor who received the request can reject it
    """
    try:
        request = await MentorshipService.reject_mentorship_request(request_id, current_user['id'], rejection_data)
        return {
            "success": True,
            "message": "Mentorship request rejected",
            "data": request
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error rejecting mentorship request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reject mentorship request"
        )


# Compatibility: frontend uses PUT on '/mentorship/requests/{requestId}/reject'
@router.put("/mentorship/requests/{request_id}/reject", response_model=dict)
async def reject_mentorship_request_alias(
    request_id: str,
    rejection_data: RejectMentorshipRequest,
    current_user: dict = Depends(get_current_user)
):
    return await reject_mentorship_request(request_id, rejection_data, current_user)


@router.get("/mentorship/requests/received", response_model=dict)
async def get_received_requests(
    status: Optional[str] = Query(None, description="Filter by status: pending, accepted, rejected"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get mentorship requests received by current user as mentor
    
    - **status**: Filter by status (optional)
    """
    try:
        requests = await MentorshipService.get_received_requests(current_user['id'], status)
        return {
            "success": True,
            "data": requests,
            "total": len(requests)
        }
    except Exception as e:
        logger.error(f"Error fetching received requests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch received requests"
        )


# Compatibility: frontend expects '/mentorship/received-requests'
@router.get("/mentorship/received-requests", response_model=dict)
async def get_received_requests_alias(
    status: Optional[str] = Query(None, description="Filter by status: pending, accepted, rejected"),
    current_user: dict = Depends(get_current_user)
):
    return await get_received_requests(status, current_user)


@router.get("/mentorship/requests/sent", response_model=dict)
async def get_sent_requests(
    status: Optional[str] = Query(None, description="Filter by status: pending, accepted, rejected"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get mentorship requests sent by current user as student
    
    - **status**: Filter by status (optional)
    """
    try:
        requests = await MentorshipService.get_sent_requests(current_user['id'], status)
        return {
            "success": True,
            "data": requests,
            "total": len(requests)
        }
    except Exception as e:
        logger.error(f"Error fetching sent requests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch sent requests"
        )


@router.get("/mentorship/active", response_model=dict)
async def get_active_mentorships(
    current_user: dict = Depends(get_current_user)
):
    """
    Get active mentorships for current user
    
    Returns all accepted mentorships where user is either mentor or student
    """
    try:
        mentorships = await MentorshipService.get_active_mentorships(current_user['id'])
        return {
            "success": True,
            "data": mentorships,
            "total": len(mentorships)
        }
    except Exception as e:
        logger.error(f"Error fetching active mentorships: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch active mentorships"
        )


@router.get("/mentorship/my-requests", response_model=dict)
async def get_my_mentorship_requests(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all mentorship requests for current user (both sent and received)
    
    Returns both:
    - Requests sent by user as student
    - Requests received by user as mentor
    """
    try:
        # Get sent requests
        sent_requests = await MentorshipService.get_sent_requests(current_user['id'], None)
        
        # Get received requests
        received_requests = await MentorshipService.get_received_requests(current_user['id'], None)
        
        return {
            "success": True,
            "data": {
                "sent": sent_requests,
                "received": received_requests
            },
            "total": {
                "sent": len(sent_requests),
                "received": len(received_requests)
            }
        }
    except Exception as e:
        logger.error(f"Error fetching my mentorship requests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch mentorship requests"
        )


# ============================================================================
# SESSION MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/mentorship/{mentorship_id}/schedule", response_model=dict, status_code=status.HTTP_201_CREATED)
async def schedule_session(
    mentorship_id: str,
    session_data: MentorshipSessionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Schedule a mentorship session
    
    - **scheduled_date**: Date and time of session (ISO 8601 format)
    - **duration**: Duration in minutes (15-300, default: 60)
    - **meeting_link**: Video call link (optional)
    - **agenda**: Session agenda (optional, max 2000 chars)
    
    Both mentor and student can schedule sessions
    """
    try:
        session = await MentorshipService.schedule_session(mentorship_id, current_user['id'], session_data)
        return {
            "success": True,
            "message": "Session scheduled successfully",
            "data": session
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error scheduling session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to schedule session"
        )


# Compatibility: frontend posts to '/mentorship/sessions' with mentorship_id in body
@router.post("/mentorship/sessions", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_session_alias(
    session_payload: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    mentorship_id = (
        session_payload.get('mentorship_id')
        or session_payload.get('mentorshipId')
        or session_payload.get('mentorship_request_id')
        or session_payload.get('mentorshipRequestId')
    )
    if not mentorship_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="mentorship_id is required in payload")

    # Build Pydantic model if possible
    try:
        session_obj = MentorshipSessionCreate(**session_payload)
    except Exception:
        # Fallback: pass payload directly if model construction fails
        session_obj = session_payload

    return await schedule_session(mentorship_id, session_obj, current_user)


@router.get("/mentorship/sessions", response_model=dict)
async def get_sessions(
    status: Optional[str] = Query(None, description="Filter by status: scheduled, completed, cancelled, missed"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all sessions for current user
    
    - **status**: Filter by status (optional)
    
    Returns sessions where user is either mentor or student
    """
    try:
        sessions = await MentorshipService.get_sessions(current_user['id'], status)
        return {
            "success": True,
            "data": sessions,
            "total": len(sessions)
        }
    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch sessions"
        )


@router.get("/mentorship/sessions/{session_id}", response_model=dict)
async def get_session_details(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get details for a specific mentorship session
    
    - **session_id**: UUID of the session
    
    Both mentor and student can view session details
    """
    try:
        session = await MentorshipService.get_session_with_details(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Check access: user must be either mentor or student in this session
        if current_user['id'] not in [session.get('mentor_id'), session.get('student_id')]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this session"
            )
        
        return {
            "success": True,
            "data": session
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch session"
        )


@router.put("/mentorship/sessions/{session_id}", response_model=dict)
async def update_session(
    session_id: str,
    session_data: MentorshipSessionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update mentorship session
    
    - **scheduled_date**: New date and time (optional)
    - **duration**: New duration in minutes (optional)
    - **status**: New status (optional)
    - **meeting_link**: Video call link (optional)
    - **agenda**: Session agenda (optional)
    - **notes**: Session notes (optional, max 5000 chars)
    
    Both mentor and student can update sessions
    """
    try:
        session = await MentorshipService.update_session(session_id, current_user['id'], session_data)
        return {
            "success": True,
            "message": "Session updated successfully",
            "data": session
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update session"
        )


@router.post("/mentorship/sessions/{session_id}/complete", response_model=dict)
async def complete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark session as completed
    
    Both mentor and student can mark sessions as completed
    """
    try:
        session = await MentorshipService.complete_session(session_id, current_user['id'])
        return {
            "success": True,
            "message": "Session marked as completed",
            "data": session
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error completing session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete session"
        )


# Compatibility: frontend uses PUT for completing sessions
@router.put("/mentorship/sessions/{session_id}/complete", response_model=dict)
async def complete_session_alias(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await complete_session(session_id, current_user)


@router.post("/mentorship/sessions/{session_id}/feedback", response_model=dict)
async def submit_session_feedback(
    session_id: str,
    feedback_data: MentorshipSessionFeedback,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit feedback for completed session (Student only)
    
    - **feedback**: Feedback text (required, 10-2000 chars)
    - **rating**: Session rating (required, 1-5)
    - **notes**: Additional notes (optional, max 5000 chars)
    
    Only students can submit feedback. Session must be completed first.
    Feedback automatically updates mentor's rating.
    """
    try:
        session = await MentorshipService.submit_session_feedback(session_id, current_user['id'], feedback_data)
        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "data": session
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback"
        )


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/admin/mentorship/requests", response_model=dict)
async def admin_get_all_mentorship_requests(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 100,
    current_user: dict = Depends(require_admin)
):
    """
    Get all mentorship requests (Admin only)
    
    Returns all mentorship requests with student and mentor details
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build query
                query = """
                    SELECT 
                        mr.*,
                        us.email as student_email,
                        um.email as mentor_email,
                        aps.name as student_name,
                        aps.photo_url as student_photo,
                        apm.name as mentor_name,
                        apm.photo_url as mentor_photo
                    FROM mentorship_requests mr
                    LEFT JOIN users us ON mr.student_id = us.id
                    LEFT JOIN users um ON mr.mentor_id = um.id
                    LEFT JOIN alumni_profiles aps ON mr.student_id = aps.user_id
                    LEFT JOIN alumni_profiles apm ON mr.mentor_id = apm.user_id
                """
                
                params = []
                if status:
                    query += " WHERE mr.status = %s"
                    params.append(status)
                
                query += " ORDER BY mr.requested_at DESC LIMIT %s OFFSET %s"
                params.extend([limit, (page - 1) * limit])
                
                await cursor.execute(query, params)
                requests = await cursor.fetchall()
                
                # Get sessions for each mentorship
                for req in requests:
                    await cursor.execute(
                        "SELECT * FROM mentorship_sessions WHERE mentorship_request_id = %s ORDER BY scheduled_date DESC",
                        (req['id'],)
                    )
                    req['sessions'] = await cursor.fetchall()
                    
                    # Format the response
                    req['student'] = {'email': req['student_email']}
                    req['mentor'] = {'email': req['mentor_email']}
                    req['studentProfile'] = {
                        'name': req['student_name'],
                        'photo_url': req['student_photo']
                    }
                    req['mentorProfile'] = {
                        'name': req['mentor_name'],
                        'photo_url': req['mentor_photo']
                    }
                
                return {
                    "success": True,
                    "data": requests,
                    "total": len(requests)
                }
                
    except Exception as e:
        logger.error(f"Error fetching all mentorship requests: {e}")
        from fastapi import status as http_status
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch mentorship requests"
        )


@router.get("/admin/mentorship/sessions", response_model=dict)
async def admin_get_all_sessions(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 100,
    current_user: dict = Depends(require_admin)
):
    """
    Get all mentorship sessions (Admin only)
    
    Returns all sessions with mentorship details
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = """
                    SELECT 
                        ms.*,
                        mr.student_id,
                        mr.mentor_id
                    FROM mentorship_sessions ms
                    LEFT JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                """
                
                params = []
                if status:
                    query += " WHERE ms.status = %s"
                    params.append(status)
                
                query += " ORDER BY ms.scheduled_date DESC LIMIT %s OFFSET %s"
                params.extend([limit, (page - 1) * limit])
                
                await cursor.execute(query, params)
                sessions = await cursor.fetchall()
                
                return {
                    "success": True,
                    "data": sessions,
                    "total": len(sessions)
                }
                
    except Exception as e:
        logger.error(f"Error fetching all sessions: {e}")
        from fastapi import status as http_status
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch sessions"
        )


@router.get("/admin/mentors", response_model=dict)
async def admin_get_all_mentors(
    page: int = 1,
    limit: int = 100,
    current_user: dict = Depends(require_admin)
):
    """
    Get all mentor profiles (Admin only)
    
    Returns all registered mentors with statistics
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get all mentors with profile information
                query = """
                    SELECT 
                        mp.*,
                        p.name,
                        p.photo_url,
                        p.current_role,
                        u.email,
                        (SELECT COUNT(*) FROM mentorship_requests 
                         WHERE mentor_id = mp.user_id AND status = 'accepted') as current_mentees_count,
                        (SELECT COUNT(*) FROM mentorship_sessions ms
                         JOIN mentorship_requests mr ON ms.mentorship_id = mr.id
                         WHERE mr.mentor_id = mp.user_id AND ms.status = 'completed') as total_sessions
                    FROM mentor_profiles mp
                    LEFT JOIN profiles p ON mp.user_id = p.user_id
                    LEFT JOIN users u ON mp.user_id = u.id
                    ORDER BY mp.created_at DESC
                    LIMIT %s OFFSET %s
                """
                
                await cursor.execute(query, [limit, (page - 1) * limit])
                mentors = await cursor.fetchall()
                
                # Get total count
                await cursor.execute("SELECT COUNT(*) as total FROM mentor_profiles")
                count_result = await cursor.fetchone()
                total = count_result['total'] if count_result else 0
                
                return {
                    "success": True,
                    "data": mentors,
                    "total": total
                }
                
    except Exception as e:
        logger.error(f"Error fetching all mentors: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch mentors"
        )

