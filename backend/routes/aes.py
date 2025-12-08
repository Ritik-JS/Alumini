"""
Alumni Engagement Score (AES) Routes
Provides endpoints for engagement scoring, leaderboards, and badges
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from middleware.auth_middleware import get_current_user
from database.connection import get_db_pool
from services.engagement_service import EngagementService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/aes", tags=["AES"])

engagement_service = EngagementService()


@router.get("/rankings")
async def get_aes_rankings(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get Alumni Engagement Score (AES) leaderboard
    Shows top contributors with their scores and ranks
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            leaderboard = await engagement_service.get_leaderboard(
                conn,
                limit=limit,
                current_user_id=current_user['id']
            )
            
            return {
                "success": True,
                "data": {
                    "rankings": leaderboard['entries'],
                    "total_users": leaderboard['total_users'],
                    "current_user_rank": leaderboard['user_rank']
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting AES rankings: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch AES rankings: {str(e)}"
        )


@router.get("/user/{user_id}")
async def get_user_aes(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed AES information for a specific user
    Includes total score, rank, level, and contribution breakdown
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Get user score
            score_data = await engagement_service.get_user_score(conn, user_id)
            
            if not score_data:
                raise HTTPException(
                    status_code=404,
                    detail="User engagement score not found"
                )
            
            # Get contribution history
            contribution_history = await engagement_service.get_contribution_history(
                conn,
                user_id,
                limit=20
            )
            
            # Get user badges
            user_badges = await engagement_service.get_user_badges(conn, user_id)
            
            return {
                "success": True,
                "data": {
                    "user_id": score_data['user_id'],
                    "name": score_data.get('name'),
                    "photo_url": score_data.get('photo_url'),
                    "role": score_data.get('role'),
                    "total_score": score_data['total_score'],
                    "rank_position": score_data['rank_position'],
                    "level": score_data['level'],
                    "contributions_breakdown": score_data['contributions'],
                    "recent_contributions": contribution_history[:10],
                    "badges_earned": user_badges,
                    "last_calculated": score_data['last_calculated']
                }
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user AES: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user AES details: {str(e)}"
        )


@router.get("/badges")
async def get_all_badges(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all available achievement badges in the system
    Shows badge requirements, rarity, and points
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            badges = await engagement_service.get_all_badges(conn)
            
            # Check which badges current user has earned
            user_badges = await engagement_service.get_user_badges(
                conn,
                current_user['id']
            )
            user_badge_ids = [b['badge_id'] for b in user_badges]
            
            # Mark earned badges
            for badge in badges:
                badge['earned'] = badge['id'] in user_badge_ids
            
            return {
                "success": True,
                "data": {
                    "badges": badges,
                    "total_badges": len(badges),
                    "earned_count": len(user_badge_ids)
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting badges: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch badges: {str(e)}"
        )


@router.get("/my-score")
async def get_my_aes_score(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's AES score and details
    Convenience endpoint for authenticated user
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            score_data = await engagement_service.get_user_score(
                conn,
                current_user['id']
            )
            
            if not score_data:
                # Calculate initial score if not exists
                score_data = await engagement_service.calculate_engagement_score(
                    conn,
                    current_user['id']
                )
            
            # Get contribution history
            contribution_history = await engagement_service.get_contribution_history(
                conn,
                current_user['id'],
                limit=10
            )
            
            # Get user badges
            user_badges = await engagement_service.get_user_badges(
                conn,
                current_user['id']
            )
            
            return {
                "success": True,
                "data": {
                    "total_score": score_data['total_score'],
                    "rank_position": score_data['rank_position'],
                    "level": score_data['level'],
                    "contributions_breakdown": score_data.get('contributions', {}),
                    "recent_contributions": contribution_history,
                    "badges_earned": user_badges,
                    "last_calculated": score_data.get('last_calculated')
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting my AES score: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch your AES score: {str(e)}"
        )


@router.post("/calculate")
async def recalculate_aes_score(
    current_user: dict = Depends(get_current_user)
):
    """
    Trigger recalculation of current user's engagement score
    Uses stored procedure to update all metrics
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            score_data = await engagement_service.calculate_engagement_score(
                conn,
                current_user['id']
            )
            
            return {
                "success": True,
                "data": score_data,
                "message": "Engagement score recalculated successfully"
            }
    
    except Exception as e:
        logger.error(f"Error recalculating AES score: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to recalculate engagement score: {str(e)}"
        )
