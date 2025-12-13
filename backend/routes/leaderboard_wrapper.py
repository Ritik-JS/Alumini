"""
Leaderboard Wrapper Routes
Maps frontend expected endpoints to actual backend engagement endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import logging
import json

from middleware.auth_middleware import get_current_user
from database.connection import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard Wrapper"])


@router.get("/user/{user_id}")
async def get_user_leaderboard_score(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get engagement score for a specific user
    Wrapper for frontend that calls /api/leaderboard/user/{userId}
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get user's engagement score
                await cursor.execute("""
                    SELECT 
                        es.user_id,
                        es.total_score,
                        es.contributions,
                        es.rank_position,
                        es.level,
                        es.last_calculated,
                        ap.name,
                        ap.photo_url,
                        u.role
                    FROM engagement_scores es
                    JOIN users u ON es.user_id = u.id
                    LEFT JOIN alumni_profiles ap ON es.user_id = ap.user_id
                    WHERE es.user_id = %s
                """, (user_id,))
                
                result = await cursor.fetchone()
                
                if not result:
                    # User doesn't have engagement score yet, calculate it
                    await cursor.execute("CALL update_engagement_score(%s)", (user_id,))
                    
                    # Fetch again after calculation
                    await cursor.execute("""
                        SELECT 
                            es.user_id,
                            es.total_score,
                            es.contributions,
                            es.rank_position,
                            es.level,
                            es.last_calculated,
                            ap.name,
                            ap.photo_url,
                            u.role
                        FROM engagement_scores es
                        JOIN users u ON es.user_id = u.id
                        LEFT JOIN alumni_profiles ap ON es.user_id = ap.user_id
                        WHERE es.user_id = %s
                    """, (user_id,))
                    
                    result = await cursor.fetchone()
                    
                    if not result:
                        return {
                            "success": False,
                            "message": "Unable to calculate engagement score",
                            "data": None
                        }
                
                # Parse contributions JSON
                contributions = json.loads(result[2]) if result[2] else {}
                
                # Calculate this week and this month points
                await cursor.execute("""
                    SELECT 
                        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN points_earned ELSE 0 END) as this_week,
                        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN points_earned ELSE 0 END) as this_month
                    FROM contribution_history
                    WHERE user_id = %s
                """, (user_id,))
                
                points_result = await cursor.fetchone()
                this_week_points = points_result[0] or 0
                this_month_points = points_result[1] or 0
                
                # Format response
                score_data = {
                    "user_id": result[0],
                    "total_score": result[1] or 0,
                    "score_breakdown": contributions,
                    "rank_position": result[3] or 0,
                    "level": result[4] or "Beginner",
                    "last_calculated": result[5].isoformat() if result[5] else None,
                    "name": result[6] or "Unknown",
                    "photo_url": result[7],
                    "role": result[8],
                    "this_week_points": this_week_points,
                    "this_month_points": this_month_points
                }
                
                return {
                    "success": True,
                    "data": score_data
                }
    
    except Exception as e:
        logger.error(f"Error getting user leaderboard score: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get user score: {str(e)}"
        )
