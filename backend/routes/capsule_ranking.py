"""
Knowledge Capsules Ranking API Routes
Provides endpoints for personalized capsule ranking and recommendations
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging

from middleware.auth_middleware import get_current_user, require_role
from services.capsule_ranking_service import get_ranking_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai/knowledge", tags=["AI - Knowledge Ranking"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class RankedCapsuleResponse(BaseModel):
    """Response model for a single ranked capsule"""
    capsule_id: str
    title: str
    category: str
    tags: List[str]
    views_count: int
    likes_count: int
    bookmarks_count: int
    created_at: Optional[str]
    author: Dict[str, Any]
    rank_score: float
    match_reason: str
    score_breakdown: Dict[str, float]


class RankedCapsulesListResponse(BaseModel):
    """Response model for list of ranked capsules"""
    success: bool
    capsules: List[RankedCapsuleResponse]
    total: int
    user_id: str
    cached: bool
    llm_enabled: bool


class RefreshRankingsResponse(BaseModel):
    """Response model for refresh rankings operation"""
    success: bool
    message: str
    details: Dict[str, Any]


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/ranked", response_model=RankedCapsulesListResponse)
async def get_ranked_capsules(
    limit: int = Query(20, ge=1, le=100, description="Number of capsules to return"),
    force_refresh: bool = Query(False, description="Force recalculation (bypass cache)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get personalized ranked knowledge capsules for the current user
    
    **Algorithm Components:**
    - Skill Match (30%): Jaccard similarity between user skills and capsule tags
    - Engagement Score (25%): Normalized views, likes, and bookmarks
    - Credibility Score (20%): Author's engagement score
    - Recency Score (15%): Exponential decay based on capsule age
    - Content Relevance (10%): LLM-based semantic matching (or keyword fallback)
    
    **Caching:**
    - Results are cached in Redis for 30 minutes
    - Use `force_refresh=true` to bypass cache and recalculate
    
    **Response:**
    - Returns top N ranked capsules with scores and match reasons
    """
    try:
        user_id = current_user['id']
        ranking_service = get_ranking_service()
        
        # Get ranked capsules (with caching)
        ranked_capsules = await ranking_service.get_ranked_capsules_for_user(
            user_id=user_id,
            limit=limit,
            force_refresh=force_refresh
        )
        
        # Convert to response models
        capsule_responses = [
            RankedCapsuleResponse(**capsule)
            for capsule in ranked_capsules
        ]
        
        return RankedCapsulesListResponse(
            success=True,
            capsules=capsule_responses,
            total=len(capsule_responses),
            user_id=user_id,
            cached=not force_refresh,
            llm_enabled=ranking_service.llm_enabled
        )
    
    except ValueError as e:
        logger.error(f"Validation error in get_ranked_capsules: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        logger.error(f"Error getting ranked capsules: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get ranked capsules: {str(e)}"
        )


@router.post("/recalculate-rankings", response_model=RefreshRankingsResponse)
async def recalculate_rankings(
    user_id: Optional[str] = Query(None, description="Specific user ID to refresh (admin only)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Manually trigger ranking recalculation
    
    **Admin Endpoint:**
    - Admins can refresh rankings for all users or a specific user
    - Regular users can only refresh their own rankings
    
    **Process:**
    1. Clears Redis cache for target user(s)
    2. Recalculates rankings for all capsules
    3. Stores updated rankings in database
    4. Caches new results
    
    **Note:** This is a synchronous operation (no Celery background job)
    """
    try:
        ranking_service = get_ranking_service()
        
        # Permission check
        is_admin = current_user.get('role') == 'admin'
        current_user_id = current_user['id']
        
        if user_id and user_id != current_user_id and not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Only admins can refresh rankings for other users"
            )
        
        # If no user_id specified, regular users refresh their own, admins refresh all
        if user_id is None:
            if is_admin:
                # Admin: refresh all users
                logger.info(f"Admin {current_user_id} initiating full ranking refresh")
                result = await ranking_service.refresh_all_rankings()
                message = f"Successfully refreshed rankings for {result['processed']} users"
            else:
                # Regular user: refresh own rankings
                user_id = current_user_id
                await ranking_service.clear_user_cache(user_id)
                await ranking_service.get_ranked_capsules_for_user(user_id, force_refresh=True)
                result = {
                    'total_users': 1,
                    'processed': 1,
                    'errors': 0,
                    'success_rate': 100.0
                }
                message = "Successfully refreshed your rankings"
        else:
            # Specific user refresh
            await ranking_service.clear_user_cache(user_id)
            await ranking_service.get_ranked_capsules_for_user(user_id, force_refresh=True)
            result = {
                'total_users': 1,
                'processed': 1,
                'errors': 0,
                'success_rate': 100.0
            }
            message = f"Successfully refreshed rankings for user {user_id}"
        
        return RefreshRankingsResponse(
            success=True,
            message=message,
            details=result
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error recalculating rankings: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to recalculate rankings: {str(e)}"
        )


@router.get("/ranking/{capsule_id}", response_model=Dict[str, Any])
async def get_capsule_ranking(
    capsule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get ranking details for a specific capsule for the current user
    
    **Returns:**
    - Final rank score
    - Detailed score breakdown for each component
    - Match reasoning
    """
    try:
        user_id = current_user['id']
        ranking_service = get_ranking_service()
        
        # Calculate rank for specific capsule
        final_score, breakdown = await ranking_service.calculate_capsule_rank(
            user_id=user_id,
            capsule_id=capsule_id
        )
        
        match_reason = ranking_service._generate_match_reason(breakdown)
        
        return {
            'success': True,
            'capsule_id': capsule_id,
            'user_id': user_id,
            'rank_score': final_score,
            'score_breakdown': breakdown,
            'match_reason': match_reason,
            'llm_enabled': ranking_service.llm_enabled
        }
    
    except ValueError as e:
        logger.error(f"Validation error in get_capsule_ranking: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        logger.error(f"Error getting capsule ranking: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get capsule ranking: {str(e)}"
        )


@router.post("/batch-ranking", response_model=Dict[str, Any])
async def batch_calculate_rankings(
    capsule_ids: List[str] = Query(..., description="List of capsule IDs to rank"),
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate rankings for multiple capsules in batch
    
    **Use Case:**
    - When you need rankings for a specific set of capsules
    - Useful for comparing multiple capsules
    
    **Returns:**
    - Dictionary mapping capsule_id to rank_score
    """
    try:
        if not capsule_ids:
            raise HTTPException(status_code=400, detail="capsule_ids list cannot be empty")
        
        if len(capsule_ids) > 50:
            raise HTTPException(
                status_code=400,
                detail="Maximum 50 capsules can be ranked in a single batch"
            )
        
        user_id = current_user['id']
        ranking_service = get_ranking_service()
        
        # Batch calculate rankings
        rankings = await ranking_service.batch_calculate_rankings(
            user_id=user_id,
            capsule_ids=capsule_ids
        )
        
        return {
            'success': True,
            'user_id': user_id,
            'rankings': rankings,
            'total': len(rankings)
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error in batch ranking: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate batch rankings: {str(e)}"
        )


@router.delete("/cache/{user_id}")
async def clear_user_ranking_cache(
    user_id: str,
    current_user: dict = Depends(require_role(['admin']))
):
    """
    Clear cached rankings for a specific user (Admin only)
    
    **Use Case:**
    - When user updates their profile significantly
    - After manual data corrections
    - For testing purposes
    """
    try:
        ranking_service = get_ranking_service()
        await ranking_service.clear_user_cache(user_id)
        
        return {
            'success': True,
            'message': f"Cache cleared for user {user_id}"
        }
    
    except Exception as e:
        logger.error(f"Error clearing cache: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/ranking-health")
async def ranking_health_check():
    """
    Health check endpoint for ranking system
    
    **Returns:**
    - System status
    - LLM availability
    - Redis cache status
    """
    try:
        ranking_service = get_ranking_service()
        
        # Check Redis
        redis_status = "connected"
        try:
            if ranking_service.redis:
                ranking_service.redis.ping()
        except Exception:
            redis_status = "disconnected"
        
        return {
            'success': True,
            'status': 'healthy',
            'llm_enabled': ranking_service.llm_enabled,
            'redis_cache': redis_status,
            'cache_ttl': ranking_service.cache_ttl
        }
    
    except Exception as e:
        return {
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }
