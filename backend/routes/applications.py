"""Job application routes"""
from fastapi import APIRouter, HTTPException, Depends, status
import logging

from database.models import (
    JobApplicationUpdate
)
from services.job_service import JobService
from middleware.auth_middleware import get_current_user
from utils.validators import validate_uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.get("/my-applications", response_model=dict)
async def get_my_applications(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all applications submitted by current user
    - **Authenticated users** only
    """
    try:
        applications = await JobService.get_user_applications(current_user['id'])
        
        return {
            "success": True,
            "data": applications
        }
    except Exception as e:
        logger.error(f"Error fetching user applications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch applications")


@router.get("/user/{user_id}", response_model=dict)
async def get_user_applications(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all applications by a specific user
    - **Any authenticated user** can view
    """
    try:
        validate_uuid(user_id)
        applications = await JobService.get_user_applications(user_id)
        
        return {
            "success": True,
            "data": applications
        }
    except Exception as e:
        logger.error(f"Error fetching user applications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch applications")


@router.get("/{application_id}", response_model=dict)
async def get_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get application details by ID
    - **Authenticated users** only
    """
    try:
        validate_uuid(application_id)
        application = await JobService.get_application_by_id(application_id)
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Check if user is applicant or job poster
        if application['applicant_id'] != current_user['id']:
            # Check if current user posted the job
            from services.job_service import JobService
            job = await JobService.get_job_by_id(application['job_id'])
            if not job or job['posted_by'] != current_user['id']:
                raise HTTPException(
                    status_code=403, 
                    detail="You don't have permission to view this application"
                )
        
        return {
            "success": True,
            "data": application
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching application: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch application")


@router.put("/{application_id}", response_model=dict)
async def update_application_status(
    application_id: str,
    update_data: JobApplicationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update application status
    - **Only job poster** can update application status
    """
    try:
        validate_uuid(application_id)
        application = await JobService.update_application_status(
            application_id,
            current_user['id'],
            update_data
        )
        
        return {
            "success": True,
            "data": application,
            "message": "Application status updated successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating application: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update application")


@router.get("/recruiter/{recruiter_id}", response_model=dict)
async def get_recruiter_applications(
    recruiter_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all applications for jobs posted by a specific recruiter
    - **Authenticated users** can view (with permission check)
    """
    try:
        validate_uuid(recruiter_id)
        
        # Check if current user is the recruiter or an admin
        if current_user['id'] != recruiter_id and current_user.get('role') != 'admin':
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to view these applications"
            )
        
        # Get all jobs posted by the recruiter
        from services.job_service import JobService
        jobs = await JobService.get_recruiter_jobs(recruiter_id)
        
        # Get applications for all these jobs
        all_applications = []
        for job in jobs:
            applications = await JobService.get_job_applications(job['id'], recruiter_id)
            # Add job info to each application
            for app in applications:
                app['job_title'] = job['title']
                app['job_company'] = job['company']
            all_applications.extend(applications)
        
        return {
            "success": True,
            "data": all_applications,
            "total": len(all_applications)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recruiter applications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch recruiter applications")
