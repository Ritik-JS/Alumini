"""
Recommendation Routes - Content-based recommendations
Phase 8: Smart Algorithms
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
import logging

from database.connection import get_db_pool
from database.models import (
    EventRecommendation,
    PostRecommendation,
    AlumniRecommendation
)
from middleware.auth_middleware import get_current_user
from services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])
logger = logging.getLogger(__name__)


@router.get(
    "/events",
    response_model=List[EventRecommendation],
    summary="Get event recommendations"
)
async def get_event_recommendations(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of recommendations"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get personalized event recommendations based on user interests and past attendance.
    
    Uses content-based filtering to match events with user preferences:
    - Previous event types attended
    - Skills and interests from profile
    - Engagement with similar events
    
    Returns events with relevance scores and recommendation reasons.
    """
    try:
        user_id = current_user['id']
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            recommendations = await recommendation_service.recommend_events(
                conn,
                user_id=user_id,
                limit=limit
            )
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error getting event recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get event recommendations"
        )


@router.get(
    "/posts",
    response_model=List[PostRecommendation],
    summary="Get forum post recommendations"
)
async def get_post_recommendations(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of recommendations"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get personalized forum post recommendations based on user interests and engagement.
    
    Uses content-based filtering to match posts with user preferences:
    - Tags matching user interests and skills
    - Posts with high engagement (likes, comments)
    - Recent and trending discussions
    
    Excludes posts the user has already liked.
    Returns posts with relevance scores and recommendation reasons.
    """
    try:
        user_id = current_user['id']
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            recommendations = await recommendation_service.recommend_posts(
                conn,
                user_id=user_id,
                limit=limit
            )
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error getting post recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get post recommendations"
        )


@router.get(
    "/alumni",
    response_model=List[AlumniRecommendation],
    summary="Get alumni recommendations"
)
async def get_alumni_recommendations(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of recommendations"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get personalized alumni recommendations to connect with.
    
    Uses collaborative filtering to find similar alumni based on:
    - Shared skills and expertise
    - Same or related industries
    - Similar locations
    - Batch year proximity
    
    Returns alumni with relevance scores and recommendation reasons.
    """
    try:
        user_id = current_user['id']
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            recommendations = await recommendation_service.recommend_alumni(
                conn,
                user_id=user_id,
                limit=limit
            )
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error getting alumni recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get alumni recommendations"
        )
