"""
Career Path Prediction Routes
Provides endpoints for career trajectory predictions and analysis
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
import logging

from middleware.auth_middleware import get_current_user
from database.connection import get_db_pool
from services.career_prediction_service import CareerPredictionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/career", tags=["Career Paths"])

# Add wrapper routes for /api/career-paths
career_paths_router = APIRouter(prefix="/api/career-paths", tags=["Career Paths"])

career_service = CareerPredictionService()


@router.post("/predict")
async def predict_career_path(
    current_user: dict = Depends(get_current_user)
):
    """
    Predict career trajectory for current user
    Uses rule-based ML algorithm with historical transition data
    
    Returns:
        - Predicted next roles with probabilities
        - Recommended skills to acquire
        - Similar alumni who made successful transitions
        - Confidence score for predictions
    """
    try:
        user_id = current_user['id']
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            prediction = await career_service.predict_career_path(
                conn,
                user_id
            )
            
            return {
                "success": True,
                "data": prediction
            }
    
    except ValueError as ve:
        raise HTTPException(
            status_code=404,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error predicting career path: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to predict career path: {str(e)}"
        )


@router.post("/predict/{user_id}")
async def predict_career_path_for_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Predict career trajectory for specific user
    Available to all authenticated users
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            prediction = await career_service.predict_career_path(
                conn,
                user_id
            )
            
            return {
                "success": True,
                "data": prediction
            }
    
    except ValueError as ve:
        raise HTTPException(
            status_code=404,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error predicting career path: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to predict career path: {str(e)}"
        )


@router.get("/paths")
async def get_common_career_paths(
    limit: int = Query(20, ge=1, le=100),
    startingRole: Optional[str] = Query(None, alias="startingRole"),
    targetRole: Optional[str] = Query(None, alias="targetRole"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get most common career transitions
    Shows popular career progressions across alumni
    Supports filtering by starting role and/or target role
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            paths = await career_service.get_common_career_paths(
                conn,
                limit=limit,
                starting_role=startingRole,
                target_role=targetRole
            )
            
            return {
                "success": True,
                "data": {
                    "career_paths": paths,
                    "total": len(paths)
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting career paths: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch career paths: {str(e)}"
        )


@router.get("/transitions")
async def get_career_transitions(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get popular career transitions
    Alias for /paths endpoint for backward compatibility
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            transitions = await career_service.get_common_career_paths(
                conn,
                limit=limit
            )
            
            return {
                "success": True,
                "data": {
                    "transitions": transitions,
                    "total": len(transitions)
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting career transitions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch career transitions: {str(e)}"
        )


@router.get("/paths/{skill}")
async def get_paths_by_skill(
    skill: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Get career transitions where a specific skill is required
    Helps users understand where their skills can take them
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            paths = await career_service.get_career_transitions_by_skill(
                conn,
                skill,
                limit=limit
            )
            
            return {
                "success": True,
                "data": {
                    "skill": skill,
                    "career_paths": paths,
                    "total": len(paths)
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting career paths by skill: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch career paths by skill: {str(e)}"
        )


@router.get("/my-prediction")
async def get_my_latest_prediction(
    current_user: dict = Depends(get_current_user)
):
    """
    Get the latest career prediction for current user
    Returns cached prediction if available
    """
    try:
        user_id = current_user['id']
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, current_role, predicted_roles, 
                        recommended_skills, similar_alumni, 
                        confidence_score, created_at
                    FROM career_predictions
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (user_id,))
                result = await cursor.fetchone()
            
            if not result:
                raise HTTPException(
                    status_code=404,
                    detail="No predictions found. Generate a prediction first."
                )
            
            import json
            
            return {
                "success": True,
                "data": {
                    "prediction_id": result[0],
                    "current_role": result[1],
                    "predicted_roles": json.loads(result[2]) if result[2] else [],
                    "recommended_skills": json.loads(result[3]) if result[3] else [],
                    "similar_alumni_ids": json.loads(result[4]) if result[4] else [],
                    "confidence_score": float(result[5]) if result[5] else 0,
                    "prediction_date": result[6]
                }
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting latest prediction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch latest prediction: {str(e)}"
        )


# ============================================================================
# WRAPPER ROUTES FOR /api/career-paths
# ============================================================================

@career_paths_router.get("")
async def get_career_paths_wrapper(
    limit: int = Query(20, ge=1, le=100),
    startingRole: Optional[str] = Query(None, alias="startingRole"),
    targetRole: Optional[str] = Query(None, alias="targetRole"),
    current_user: dict = Depends(get_current_user)
):
    """
    Wrapper for GET /api/career/paths
    Get most common career transitions
    Supports filtering by starting role and/or target role
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            paths = await career_service.get_common_career_paths(
                conn,
                limit=limit,
                starting_role=startingRole,
                target_role=targetRole
            )
            
            return {
                "success": True,
                "data": {
                    "career_paths": paths,
                    "total": len(paths)
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting career paths: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch career paths: {str(e)}"
        )


@career_paths_router.get("/roles")
async def get_career_roles(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all unique career roles from alumni profiles
    Useful for career exploration and filtering
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get all unique current roles
                await cursor.execute("""
                    SELECT DISTINCT current_role, COUNT(*) as count
                    FROM alumni_profiles
                    WHERE current_role IS NOT NULL AND current_role != ''
                    GROUP BY current_role
                    ORDER BY count DESC
                """)
                roles = await cursor.fetchall()
                
                role_list = [
                    {
                        "role": row[0],
                        "alumni_count": row[1]
                    }
                    for row in roles
                ]
                
                return {
                    "success": True,
                    "data": {
                        "roles": role_list,
                        "total": len(role_list)
                    }
                }
    
    except Exception as e:
        logger.error(f"Error getting career roles: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch career roles: {str(e)}"
        )
