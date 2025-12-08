"""Analytics routes for reporting and insights"""
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List

from database.models import (
    SkillDistribution, LocationDistribution, CompanyDistribution,
    BatchDistribution, JobTrendsByCategory, MentorshipStats,
    EventParticipationStats, EngagementMetrics, UserResponse
)
from services.analytics_service import AnalyticsService
from middleware.auth_middleware import require_admin

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/skills", response_model=List[SkillDistribution])
async def get_skills_distribution(
    limit: int = Query(20, ge=1, le=100, description="Number of top skills to return"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get top skills distribution across alumni
    
    **Admin only**
    
    Returns top skills with count and percentage
    """
    try:
        skills = await AnalyticsService.get_skills_distribution(limit=limit)
        return skills
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/locations", response_model=List[LocationDistribution])
async def get_locations_distribution(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get alumni distribution by location with coordinates
    
    **Admin only**
    
    Returns locations with alumni count, job count, and geo coordinates for heatmap
    """
    try:
        locations = await AnalyticsService.get_locations_distribution()
        return locations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/companies", response_model=List[CompanyDistribution])
async def get_companies_distribution(
    limit: int = Query(20, ge=1, le=100, description="Number of top companies to return"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get top companies where alumni work
    
    **Admin only**
    
    Returns top companies with alumni count and percentage
    """
    try:
        companies = await AnalyticsService.get_companies_distribution(limit=limit)
        return companies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/batches", response_model=List[BatchDistribution])
async def get_batches_distribution(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get alumni distribution by batch/graduation year
    
    **Admin only**
    
    Returns count of alumni per batch year
    """
    try:
        batches = await AnalyticsService.get_batches_distribution()
        return batches
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/job-trends", response_model=List[JobTrendsByCategory])
async def get_job_trends(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get job posting trends by job type/category
    
    **Admin only**
    
    Returns job distribution by type with percentages
    """
    try:
        trends = await AnalyticsService.get_job_trends()
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mentorship-stats", response_model=MentorshipStats)
async def get_mentorship_stats(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get comprehensive mentorship program statistics
    
    **Admin only**
    
    Returns:
    - Total mentors and active mentors
    - Total mentees
    - Request statistics (total, accepted, rejected, pending)
    - Session statistics
    - Average mentor rating
    """
    try:
        stats = await AnalyticsService.get_mentorship_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/event-participation", response_model=EventParticipationStats)
async def get_event_participation(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get event participation statistics
    
    **Admin only**
    
    Returns:
    - Total events (upcoming, past)
    - Total RSVPs
    - Average attendance rate
    - Events breakdown by type
    """
    try:
        stats = await AnalyticsService.get_event_participation_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/engagement", response_model=EngagementMetrics)
async def get_engagement_metrics(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get user engagement metrics
    
    **Admin only**
    
    Returns:
    - Total active users
    - Average engagement score
    - Top contributors
    - Engagement distribution by level
    """
    try:
        metrics = await AnalyticsService.get_engagement_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
