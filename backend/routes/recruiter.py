"""Recruiter dashboard routes"""
from fastapi import APIRouter, HTTPException, Depends
import logging

from services.job_service import JobService
from middleware.auth_middleware import require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recruiter", tags=["Recruiter Dashboard"])


@router.get("/jobs", response_model=dict)
async def get_recruiter_jobs(
    current_user: dict = Depends(require_role(["alumni", "recruiter", "admin"]))
):
    """
    Get all jobs posted by current recruiter/alumni
    - **Alumni, Recruiters, and Admins** only
    """
    try:
        jobs = await JobService.get_recruiter_jobs(current_user['id'])
        
        return {
            "success": True,
            "data": jobs
        }
    except Exception as e:
        logger.error(f"Error fetching recruiter jobs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")


@router.get("/analytics", response_model=dict)
async def get_recruiter_analytics(
    current_user: dict = Depends(require_role(["alumni", "recruiter", "admin"]))
):
    """
    Get analytics for current recruiter
    - **Alumni, Recruiters, and Admins** only
    """
    try:
        analytics = await JobService.get_recruiter_analytics(current_user['id'])
        
        return {
            "success": True,
            "data": analytics.dict()
        }
    except Exception as e:
        logger.error(f"Error fetching recruiter analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")


@router.get("/applications/summary", response_model=dict)
async def get_applications_summary(
    current_user: dict = Depends(require_role(["alumni", "recruiter", "admin"]))
):
    """
    Get applications summary for current recruiter
    - **Alumni, Recruiters, and Admins** only
    """
    try:
        summary = await JobService.get_applications_summary(current_user['id'])
        
        return {
            "success": True,
            "data": summary.dict()
        }
    except Exception as e:
        logger.error(f"Error fetching applications summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch summary")
