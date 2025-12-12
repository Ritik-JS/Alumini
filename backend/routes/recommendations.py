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


@router.get(
    "/skills/{user_id}",
    summary="Get skill recommendations for user"
)
async def get_skill_recommendations(
    user_id: str,
    limit: int = Query(10, ge=1, le=50, description="Maximum number of recommendations"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get personalized skill recommendations for a user.
    
    Based on:
    - Current skills and career trajectory
    - Industry trends
    - Skills of similar alumni
    - Job market demand
    
    Returns skills the user should learn to advance their career.
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get user's current skills
                await cursor.execute("""
                    SELECT skills, industry, current_role
                    FROM alumni_profiles
                    WHERE user_id = %s
                """, (user_id,))
                profile = await cursor.fetchone()
                
                if not profile:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User profile not found"
                    )
                
                import json
                current_skills = json.loads(profile[0]) if profile[0] and isinstance(profile[0], str) else (profile[0] if profile[0] else [])
                industry = profile[1]
                current_role = profile[2]
                
                # Find skills that similar users have but this user doesn't
                # First, find users with similar skills
                recommended_skills = []
                
                if current_skills:
                    # Get skills from similar users
                    await cursor.execute("""
                        SELECT 
                            JSON_UNQUOTE(JSON_EXTRACT(skills, CONCAT('$[', idx, ']'))) as skill_name,
                            COUNT(*) as count
                        FROM alumni_profiles
                        CROSS JOIN (
                            SELECT 0 AS idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                            UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
                            UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
                        ) AS indices
                        WHERE skills IS NOT NULL
                        AND JSON_LENGTH(skills) > idx
                        AND (industry = %s OR current_role = %s)
                        AND user_id != %s
                        GROUP BY skill_name
                        ORDER BY count DESC
                        LIMIT %s
                    """, (industry, current_role, user_id, limit * 2))
                    
                    all_similar_skills = await cursor.fetchall()
                    
                    # Filter out skills user already has
                    for skill_row in all_similar_skills:
                        skill_name = skill_row[0]
                        if skill_name and skill_name not in current_skills:
                            recommended_skills.append({
                                "skill": skill_name,
                                "alumni_count": skill_row[1],
                                "reason": f"Popular in {industry or current_role}",
                                "relevance_score": min(100, skill_row[1] * 10)
                            })
                            
                            if len(recommended_skills) >= limit:
                                break
                
                return {
                    "success": True,
                    "data": {
                        "user_id": user_id,
                        "current_skills": current_skills,
                        "recommended_skills": recommended_skills,
                        "total": len(recommended_skills)
                    }
                }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting skill recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get skill recommendations"
        )


@router.get(
    "/skill-trends/top",
    summary="Get top trending skills"
)
async def get_top_skill_trends(
    limit: int = Query(20, ge=1, le=50, description="Number of trending skills"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get top trending skills based on recent adoption and job demand.
    
    Returns the most in-demand skills across the platform.
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get most common skills across all profiles
                await cursor.execute("""
                    SELECT 
                        JSON_UNQUOTE(JSON_EXTRACT(skills, CONCAT('$[', idx, ']'))) as skill_name,
                        COUNT(DISTINCT user_id) as alumni_count
                    FROM alumni_profiles
                    CROSS JOIN (
                        SELECT 0 AS idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
                        UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
                        UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
                    ) AS indices
                    WHERE skills IS NOT NULL
                    AND JSON_LENGTH(skills) > idx
                    AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
                    GROUP BY skill_name
                    HAVING skill_name IS NOT NULL
                    ORDER BY alumni_count DESC
                    LIMIT %s
                """, (limit,))
                
                trending = await cursor.fetchall()
                
                skill_trends = [
                    {
                        "skill": row[0],
                        "alumni_count": row[1],
                        "trend": "rising",
                        "popularity_score": min(100, row[1] * 5)
                    }
                    for row in trending
                ]
                
                return {
                    "success": True,
                    "data": {
                        "trending_skills": skill_trends,
                        "total": len(skill_trends),
                        "period": "Last 90 days"
                    }
                }
        
    except Exception as e:
        logger.error(f"Error getting top skill trends: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get skill trends"
        )
