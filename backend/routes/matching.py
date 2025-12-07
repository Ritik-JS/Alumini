"""
Matching Routes - Smart matching endpoints for mentors, jobs, and alumni
Phase 8: Smart Algorithms
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import logging

from database.connection import get_db_pool
from database.models import (
    MentorSuggestionRequest, MentorSuggestion,
    JobRecommendationRequest, JobRecommendation,
    AlumniConnectionRequest, AlumniConnectionSuggestion
)
from middleware.auth_middleware import get_current_user
from services.matching_service import matching_service

router = APIRouter(prefix="/api/matching", tags=["Matching"])
logger = logging.getLogger(__name__)


@router.post(
    "/mentor-suggestions",
    response_model=List[MentorSuggestion],
    summary="Get mentor suggestions based on skills and interests"
)
async def get_mentor_suggestions(
    request: MentorSuggestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Get mentor suggestions based on user skills and interests.
    Uses Jaccard similarity for matching.
    
    - **user_skills**: List of user's skills
    - **interest_areas**: Areas of interest for mentorship
    - **preferred_industries**: Preferred industries (optional)
    - **min_rating**: Minimum mentor rating (optional)
    - **limit**: Maximum number of suggestions (default: 10)
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            suggestions = await matching_service.match_mentors(
                conn,
                user_skills=request.user_skills,
                interest_areas=request.interest_areas,
                preferred_industries=request.preferred_industries,
                min_rating=request.min_rating,
                limit=request.limit
            )
        
        return suggestions
        
    except Exception as e:
        logger.error(f"Error getting mentor suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get mentor suggestions"
        )


@router.post(
    "/job-recommendations",
    response_model=List[JobRecommendation],
    summary="Get job recommendations based on skills and preferences"
)
async def get_job_recommendations(
    request: JobRecommendationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Get job recommendations based on user skills and preferences.
    Uses Jaccard similarity for matching skills.
    
    - **user_id**: User ID (optional, will use current user's profile if not provided)
    - **user_skills**: List of user's skills (optional if user_id provided)
    - **preferred_locations**: Preferred job locations (optional)
    - **preferred_job_types**: Preferred job types (optional)
    - **min_experience**: Minimum years of experience (optional)
    - **limit**: Maximum number of recommendations (default: 10)
    """
    try:
        # Use current user's ID if not provided
        user_id = request.user_id or current_user['id']
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            recommendations = await matching_service.recommend_jobs(
                conn,
                user_id=user_id,
                user_skills=request.user_skills,
                preferred_locations=request.preferred_locations,
                preferred_job_types=request.preferred_job_types,
                min_experience=request.min_experience,
                limit=request.limit
            )
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error getting job recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get job recommendations"
        )


@router.post(
    "/alumni-connections",
    response_model=List[AlumniConnectionSuggestion],
    summary="Get alumni connection suggestions"
)
async def get_alumni_connection_suggestions(
    request: AlumniConnectionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Get alumni connection suggestions based on similar skills, companies, and backgrounds.
    Uses Jaccard similarity for matching.
    
    - **user_id**: User ID (required)
    - **limit**: Maximum number of suggestions (default: 10)
    """
    try:
        # Verify user has access to their own data or is admin
        if request.user_id != current_user['id'] and current_user['role'] != 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this data"
            )
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            suggestions = await matching_service.suggest_alumni_connections(
                conn,
                user_id=request.user_id,
                limit=request.limit
            )
        
        return suggestions
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting alumni connection suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get alumni connection suggestions"
        )
