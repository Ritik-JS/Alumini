"""Job management routes"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
import logging

from database.models import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobSearchParams,
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    JobStatus,
    JobType
)
from services.job_service import JobService
from middleware.auth_middleware import get_current_user, require_role
from utils.validators import validate_uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.post("/create", response_model=dict, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(require_role(["alumni", "recruiter", "admin"]))
):
    """
    Create a new job posting
    - **Alumni, Recruiters, and Admins** can post jobs
    - Available at both POST /api/jobs and POST /api/jobs/create
    """
    try:
        job = await JobService.create_job(current_user['id'], job_data)
        return {
            "success": True,
            "data": job,
            "message": "Job posted successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create job posting")


@router.get("", response_model=dict)
async def get_jobs(
    status: Optional[str] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    search: Optional[str] = None,
    skills: Optional[List[str]] = Query(None),
    page: int = 1,
    limit: int = 20
):
    """
    Get all jobs with optional filters
    - **Public endpoint** - Anyone can view jobs
    - **NEW**: Supports multiple skill filters via ?skills=Python&skills=React
    """
    try:
        # Convert status and job_type to enums if provided
        status_enum = JobStatus(status) if status else None
        job_type_enum = JobType(job_type) if job_type else None
        
        search_params = JobSearchParams(
            status=status_enum,
            company=company,
            location=location,
            job_type=job_type_enum,
            search=search,
            skills=skills,
            page=page,
            limit=limit
        )
        
        result = await JobService.search_jobs(search_params)
        return {
            "success": True,
            "data": result['jobs'],
            "total": result['total'],
            "page": result['page'],
            "limit": result['limit'],
            "total_pages": result['total_pages']
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")


@router.get("/{job_id}", response_model=dict)
async def get_job(job_id: str):
    """
    Get job details by ID
    - **Public endpoint** - Anyone can view job details
    """
    try:
        validate_uuid(job_id)
        job = await JobService.get_job_by_id(job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "success": True,
            "data": job
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch job")


@router.put("/{job_id}", response_model=dict)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update job posting
    - **Only job poster or admin** can update
    """
    try:
        validate_uuid(job_id)
        job = await JobService.update_job(job_id, current_user['id'], job_data)
        
        return {
            "success": True,
            "data": job,
            "message": "Job updated successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update job")


@router.delete("/{job_id}", response_model=dict)
async def delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete job posting
    - **Only job poster or admin** can delete
    """
    try:
        validate_uuid(job_id)
        success = await JobService.delete_job(job_id, current_user['id'])
        
        if not success:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "success": True,
            "message": "Job deleted successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete job")


@router.post("/{job_id}/close", response_model=dict)
async def close_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Close job posting
    - **Only job poster** can close
    """
    try:
        validate_uuid(job_id)
        job = await JobService.close_job(job_id, current_user['id'])
        
        return {
            "success": True,
            "data": job,
            "message": "Job closed successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error closing job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to close job")


@router.post("/{job_id}/apply", response_model=dict, status_code=status.HTTP_201_CREATED)
async def apply_for_job(
    job_id: str,
    application_data: JobApplicationCreate,
    current_user: dict = Depends(require_role(["student", "alumni"]))
):
    """
    Apply for a job
    - **Students and Alumni** can apply
    """
    try:
        validate_uuid(job_id)
        application = await JobService.apply_for_job(
            job_id, 
            current_user['id'], 
            application_data
        )
        
        return {
            "success": True,
            "data": application,
            "message": "Application submitted successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error applying for job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit application")


@router.get("/{job_id}/applications", response_model=dict)
async def get_job_applications(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all applications for a job
    - **Only job poster** can view applications
    """
    try:
        validate_uuid(job_id)
        applications = await JobService.get_job_applications(job_id, current_user['id'])
        
        return {
            "success": True,
            "data": applications
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch applications")


@router.get("/user/{user_id}/jobs", response_model=dict)
@router.get("/user/{user_id}", response_model=dict)
async def get_user_jobs(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all jobs posted by a user
    - **Any authenticated user** can view
    - Available at both GET /api/jobs/user/:userId and GET /api/jobs/user/:userId/jobs
    """
    try:
        validate_uuid(user_id)
        jobs = await JobService.get_recruiter_jobs(user_id)
        
        return {
            "success": True,
            "data": jobs
        }
    except Exception as e:
        logger.error(f"Error fetching user jobs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user jobs")
