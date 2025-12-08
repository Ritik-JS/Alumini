"""
Skills API Wrapper Routes
Provides /api/skills/* endpoints that map to /api/skill-graph/*
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
import logging

from middleware.auth_middleware import get_current_user
from database.connection import get_db_pool
from services.skill_graph_service import SkillGraphService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/skills", tags=["Skills"])

skill_graph_service = SkillGraphService()


@router.get("/graph")
async def get_skill_graph(
    min_popularity: float = Query(0.0, ge=0.0, le=100.0),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user)
):
    """
    Get skill network data for visualization
    Wrapper for GET /api/skill-graph/network
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            network = await skill_graph_service.get_skill_network(
                conn,
                min_popularity=min_popularity,
                limit=limit
            )
            
            return {
                "success": True,
                "data": network
            }
    
    except Exception as e:
        logger.error(f"Error getting skill network: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch skill network: {str(e)}"
        )


@router.get("/trending")
async def get_trending_skills(
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Get trending skills based on job demand and alumni expertise
    Wrapper for GET /api/skill-graph/trending
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            trending = await skill_graph_service.get_trending_skills(
                conn,
                limit=limit
            )
            
            return {
                "success": True,
                "data": {
                    "trending_skills": trending,
                    "total": len(trending)
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting trending skills: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch trending skills: {str(e)}"
        )


@router.get("/search")
async def search_skills(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Search for skills by name or description
    New endpoint - searches skills in the database
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Search in profiles skills
                query = """
                    SELECT DISTINCT skill_name, COUNT(*) as count
                    FROM (
                        SELECT jsonb_array_elements_text(skills) as skill_name
                        FROM profiles
                        WHERE skills IS NOT NULL
                    ) skills_list
                    WHERE LOWER(skill_name) LIKE LOWER(%s)
                    GROUP BY skill_name
                    ORDER BY count DESC
                    LIMIT %s
                """
                search_pattern = f"%{q}%"
                await cursor.execute(query, (search_pattern, limit))
                results = await cursor.fetchall()
                
                skills = [
                    {
                        "name": row[0],
                        "alumni_count": row[1],
                        "popularity": min(100, (row[1] / 10) * 100)  # Simple popularity score
                    }
                    for row in results
                ]
                
                return {
                    "success": True,
                    "data": skills,
                    "total": len(skills),
                    "query": q
                }
    
    except Exception as e:
        logger.error(f"Error searching skills: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search skills: {str(e)}"
        )


@router.get("/{skill_name}")
async def get_skill_details(
    skill_name: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific skill
    Wrapper for GET /api/skill-graph/skill/:skillName
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            skill_details = await skill_graph_service.get_skill_details(
                conn,
                skill_name
            )
            
            if not skill_details:
                raise HTTPException(
                    status_code=404,
                    detail=f"Skill '{skill_name}' not found in graph"
                )
            
            return {
                "success": True,
                "data": skill_details
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting skill details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch skill details: {str(e)}"
        )


@router.get("/{skill_name}/related")
async def get_related_skills(
    skill_name: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Get skills related to a specific skill
    New endpoint - finds skills commonly paired with the given skill
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Find skills that commonly appear together
                query = """
                    WITH target_skill_profiles AS (
                        SELECT user_id
                        FROM profiles
                        WHERE skills @> %s::jsonb
                    )
                    SELECT 
                        skill_name,
                        COUNT(*) as co_occurrence_count,
                        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM target_skill_profiles)), 2) as percentage
                    FROM (
                        SELECT 
                            p.user_id,
                            jsonb_array_elements_text(p.skills) as skill_name
                        FROM profiles p
                        INNER JOIN target_skill_profiles tsp ON p.user_id = tsp.user_id
                        WHERE p.skills IS NOT NULL
                    ) all_skills
                    WHERE skill_name != %s
                    GROUP BY skill_name
                    ORDER BY co_occurrence_count DESC
                    LIMIT %s
                """
                
                import json
                skill_json = json.dumps([skill_name])
                await cursor.execute(query, (skill_json, skill_name, limit))
                results = await cursor.fetchall()
                
                related_skills = [
                    {
                        "name": row[0],
                        "co_occurrence_count": row[1],
                        "percentage": float(row[2]),
                        "relationship_strength": min(100, float(row[2]))
                    }
                    for row in results
                ]
                
                return {
                    "success": True,
                    "data": related_skills,
                    "total": len(related_skills),
                    "skill": skill_name
                }
    
    except Exception as e:
        logger.error(f"Error getting related skills: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch related skills: {str(e)}"
        )
