"""Mentorship management routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

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
from middleware.auth_middleware import get_current_user, require_role
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["mentorship"])


# ============================================================================
# MENTOR MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/mentors/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_as_mentor(
    profile_data: MentorProfileCreate,
    current_user: UserResponse = Depends(require_role(["alumni"]))
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
        mentor_profile = await MentorshipService.register_as_mentor(current_user.id, profile_data)
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
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update mentor profile and availability
    
    - **is_available**: Availability status
    - **expertise_areas**: List of expertise areas
    - **max_mentees**: Maximum number of mentees
    - **mentorship_approach**: Description of mentorship approach
    """
    try:
        mentor_profile = await MentorshipService.update_mentor_profile(current_user.id, profile_data)
        
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
        except:
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
    current_user: UserResponse = Depends(get_current_user)
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
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Send mentorship request (Student or Alumni)
    
    - **mentor_id**: ID of the mentor (required)
    - **request_message**: Message to mentor (required, 20-1000 chars)
    - **goals**: Your mentorship goals (optional, max 2000 chars)
    - **preferred_topics**: List of preferred discussion topics (optional)
    """
    try:
        request = await MentorshipService.create_mentorship_request(current_user.id, request_data)
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


@router.post("/mentorship/{request_id}/accept", response_model=dict)
async def accept_mentorship_request(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Accept mentorship request (Mentor only)
    
    Only the mentor who received the request can accept it
    """
    try:
        request = await MentorshipService.accept_mentorship_request(request_id, current_user.id)
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


@router.post("/mentorship/{request_id}/reject", response_model=dict)
async def reject_mentorship_request(
    request_id: str,
    rejection_data: RejectMentorshipRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Reject mentorship request (Mentor only)
    
    - **rejection_reason**: Reason for rejection (required, 10-500 chars)
    
    Only the mentor who received the request can reject it
    """
    try:
        request = await MentorshipService.reject_mentorship_request(request_id, current_user.id, rejection_data)
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


@router.get("/mentorship/requests/received", response_model=dict)
async def get_received_requests(
    status: Optional[str] = Query(None, description="Filter by status: pending, accepted, rejected"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get mentorship requests received by current user as mentor
    
    - **status**: Filter by status (optional)
    """
    try:
        requests = await MentorshipService.get_received_requests(current_user.id, status)
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


@router.get("/mentorship/requests/sent", response_model=dict)
async def get_sent_requests(
    status: Optional[str] = Query(None, description="Filter by status: pending, accepted, rejected"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get mentorship requests sent by current user as student
    
    - **status**: Filter by status (optional)
    """
    try:
        requests = await MentorshipService.get_sent_requests(current_user.id, status)
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
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get active mentorships for current user
    
    Returns all accepted mentorships where user is either mentor or student
    """
    try:
        mentorships = await MentorshipService.get_active_mentorships(current_user.id)
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


# ============================================================================
# SESSION MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/mentorship/{mentorship_id}/schedule", response_model=dict, status_code=status.HTTP_201_CREATED)
async def schedule_session(
    mentorship_id: str,
    session_data: MentorshipSessionCreate,
    current_user: UserResponse = Depends(get_current_user)
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
        session = await MentorshipService.schedule_session(mentorship_id, current_user.id, session_data)
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


@router.get("/mentorship/sessions", response_model=dict)
async def get_sessions(
    status: Optional[str] = Query(None, description="Filter by status: scheduled, completed, cancelled, missed"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get all sessions for current user
    
    - **status**: Filter by status (optional)
    
    Returns sessions where user is either mentor or student
    """
    try:
        sessions = await MentorshipService.get_sessions(current_user.id, status)
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


@router.put("/mentorship/sessions/{session_id}", response_model=dict)
async def update_session(
    session_id: str,
    session_data: MentorshipSessionUpdate,
    current_user: UserResponse = Depends(get_current_user)
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
        session = await MentorshipService.update_session(session_id, current_user.id, session_data)
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
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Mark session as completed
    
    Both mentor and student can mark sessions as completed
    """
    try:
        session = await MentorshipService.complete_session(session_id, current_user.id)
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


@router.post("/mentorship/sessions/{session_id}/feedback", response_model=dict)
async def submit_session_feedback(
    session_id: str,
    feedback_data: MentorshipSessionFeedback,
    current_user: UserResponse = Depends(get_current_user)
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
        session = await MentorshipService.submit_session_feedback(session_id, current_user.id, feedback_data)
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
