"""
Skill Graph Routes
Provides endpoints for skill network visualization and analysis
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from ..middleware.auth_middleware import get_current_user, require_role
from ..database.connection import get_db_pool
from ..services.skill_graph_service import SkillGraphService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/skill-graph", tags=["Skill Graph"])

skill_graph_service = SkillGraphService()


@router.get("/network")
async def get_skill_network(
    min_popularity: float = Query(0.0, ge=0.0, le=100.0),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user)
):
    """
    Get skill network data for visualization
    Returns nodes and edges representing skill relationships
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


@router.get("/skill/{skill_name}")
async def get_skill_details(
    skill_name: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific skill
    Includes related skills, alumni count, job demand
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


@router.get("/paths")
async def find_career_paths_by_skill(
    skill: str = Query(..., description="Skill name to find career paths"),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Find common career paths for alumni with a specific skill
    Shows role distribution, companies, and experience levels
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            paths = await skill_graph_service.find_career_paths_by_skill(
                conn,
                skill,
                limit=limit
            )
            
            return {
                "success": True,
                "data": {
                    "skill": skill,
                    "career_paths": paths,
                    "total_paths": len(paths)
                }
            }
    
    except Exception as e:
        logger.error(f"Error finding career paths: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to find career paths: {str(e)}"
        )


@router.get("/clusters")
async def get_skill_clusters(
    min_popularity: float = Query(0.0, ge=0.0, le=100.0),
    current_user: dict = Depends(get_current_user)
):
    """
    Get skill clusters - groups of related skills
    Useful for identifying technology ecosystems
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            network = await skill_graph_service.get_skill_network(
                conn,
                min_popularity=min_popularity,
                limit=200  # Need more data for clustering
            )
            
            return {
                "success": True,
                "data": {
                    "clusters": network['clusters'],
                    "total_clusters": len(network['clusters'])
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting skill clusters: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch skill clusters: {str(e)}"
        )


@router.get("/trending")
async def get_trending_skills(
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Get trending skills based on job demand and alumni expertise
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


@router.post("/rebuild")
async def rebuild_skill_graph(
    current_user: dict = Depends(require_role(['admin']))
):
    """
    Rebuild skill graph from current data
    Admin only - Updates all skill relationships
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            result = await skill_graph_service.build_skill_graph(conn)
            
            return {
                "success": True,
                "data": result,
                "message": "Skill graph rebuilt successfully"
            }
    
    except Exception as e:
        logger.error(f"Error rebuilding skill graph: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to rebuild skill graph: {str(e)}"
        )
