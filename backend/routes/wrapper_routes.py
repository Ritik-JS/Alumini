"""
Wrapper Routes - Frontend-friendly aliases for existing endpoints
Provides backward compatibility for frontend routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
import logging

from database.connection import get_db_pool
from database.models import BadgeResponse, UserBadgeResponse, LeaderboardResponse
from middleware.auth_middleware import get_current_user

router = APIRouter(tags=["Wrapper Routes"])
logger = logging.getLogger(__name__)


@router.get(
    "/api/badges",
    response_model=List[BadgeResponse],
    summary="Get all badges (wrapper)"
)
async def get_badges_wrapper(
    current_user: dict = Depends(get_current_user)
):
    """
    Wrapper route for GET /api/engagement/badges
    Frontend-friendly alias
    """
    try:
        from services.engagement_service import engagement_service
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            badges = await engagement_service.get_all_badges(conn)
        
        return badges
        
    except Exception as e:
        logger.error(f"Error getting badges: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get badges"
        )


@router.get(
    "/api/badges/user/{user_id}",
    response_model=List[UserBadgeResponse],
    summary="Get user badges (wrapper)"
)
async def get_user_badges_wrapper(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Wrapper route for GET /api/engagement/my-badges
    Frontend-friendly alias
    """
    try:
        from services.engagement_service import engagement_service
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            user_badges = await engagement_service.get_user_badges(conn, user_id)
        
        return user_badges
        
    except Exception as e:
        logger.error(f"Error getting user badges: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user badges"
        )


@router.get(
    "/api/leaderboard",
    response_model=LeaderboardResponse,
    summary="Get leaderboard (wrapper)"
)
async def get_leaderboard_wrapper(
    limit: int = Query(50, ge=1, le=100, description="Number of top users to retrieve"),
    current_user: dict = Depends(get_current_user)
):
    """
    Wrapper route for GET /api/engagement/leaderboard
    Frontend-friendly alias
    """
    try:
        from services.engagement_service import engagement_service
        
        user_id = current_user['id']
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            leaderboard = await engagement_service.get_leaderboard(
                conn,
                limit=limit,
                current_user_id=user_id
            )
        
        return leaderboard
        
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get leaderboard"
        )
