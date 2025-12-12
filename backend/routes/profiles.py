"""Profile management routes"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from typing import Optional, List

from database.models import (
    AlumniProfileCreate,
    AlumniProfileUpdate,
    AlumniProfileResponse,
    ProfileSearchParams,
    ProfileFilterOptions,
    UserResponse
)
from services.profile_service import ProfileService
from middleware.auth_middleware import get_current_user, require_roles
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profiles", tags=["profiles"])
@router.post("/create", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: AlumniProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create alumni profile
    
    - **name**: Full name (required)
    - **bio**: Short biography
    - **headline**: Professional headline
    - **current_company**: Current company name
    - **current_role**: Current job role
    - **location**: Current location
    - **batch_year**: Graduation year
    - **experience_timeline**: List of work experiences
    - **education_details**: List of education records
    - **skills**: List of skills
    - **achievements**: List of achievements
    - **social_links**: Social media links (linkedin, github, twitter, website)
    - **industry**: Industry/sector
    - **years_of_experience**: Total years of professional experience
    - **willing_to_mentor**: Availability for mentorship
    - **willing_to_hire**: Willing to post job opportunities
    """
    try:
        profile = await ProfileService.create_profile(current_user['id'], profile_data)
        return {
            "success": True,
            "message": "Profile created successfully",
            "data": profile
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create profile"
        )
@router.get("/me", response_model=dict)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    try:
        profile = await ProfileService.get_profile_by_user_id(current_user['id'])
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found. Please create your profile first."
            )
        
        return {
            "success": True,
            "data": profile
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile"
        )
@router.get("/search", response_model=dict)
async def search_profiles(
    name: Optional[str] = None,
    company: Optional[str] = None,
    skills: Optional[str] = None,  # Comma-separated
    batch_year: Optional[int] = None,
    job_role: Optional[str] = None,
    location: Optional[str] = None,
    verified_only: bool = False,
    page: int = 1,
    limit: int = 20
):
    """
    Search alumni profiles with filters
    
    - **name**: Search by name (partial match)
    - **company**: Filter by company (partial match)
    - **skills**: Filter by skills (comma-separated, e.g., "Python,React")
    - **batch_year**: Filter by graduation year
    - **job_role**: Filter by job role (partial match)
    - **location**: Filter by location (partial match)
    - **verified_only**: Show only verified profiles
    - **page**: Page number (default: 1)
    - **limit**: Results per page (default: 20, max: 100)
    """
    try:
        # Parse skills if provided
        skills_list = None
        if skills:
            skills_list = [s.strip() for s in skills.split(',')]
        
        search_params = ProfileSearchParams(
            name=name,
            company=company,
            skills=skills_list,
            batch_year=batch_year,
            job_role=job_role,
            location=location,
            verified_only=verified_only,
            page=page,
            limit=limit
        )
        
        result = await ProfileService.search_profiles(search_params)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Error searching profiles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search profiles"
        )
@router.get("/filters/options", response_model=dict)
async def get_filter_options():
    """
    Get available filter options
    
    Returns unique values for:
    - Companies
    - Skills
    - Locations
    - Batch years
    - Industries
    """
    try:
        options = await ProfileService.get_filter_options()
        
        return {
            "success": True,
            "data": options.dict()
        }
    except Exception as e:
        logger.error(f"Error fetching filter options: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch filter options"
        )
@router.get("/directory", response_model=dict)
async def get_directory(page: int = 1, limit: int = 20):
    """
    Get paginated alumni directory
    
    Returns all alumni profiles in reverse chronological order
    """
    try:
        result = await ProfileService.get_directory(page, limit)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Error fetching directory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch directory"
        )
@router.get("/{user_id}", response_model=dict)
async def get_profile(user_id: str):
    """Get profile by user ID (public access)"""
    try:
        profile = await ProfileService.get_profile_by_user_id(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return {
            "success": True,
            "data": profile
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile"
        )
@router.put("/{user_id}", response_model=dict)
async def update_profile(
    user_id: str,
    profile_data: AlumniProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update alumni profile
    
    Users can only update their own profile unless they are admin
    """
    # Check if user is updating their own profile or is admin
    if current_user['id'] != user_id and current_user['role'] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    try:
        profile = await ProfileService.update_profile(user_id, profile_data)
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "data": profile
        }
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )
@router.delete("/{user_id}", response_model=dict)
async def delete_profile(
    user_id: str,
    current_user: dict = Depends(require_roles(["admin"]))
):
    """Delete profile (admin only)"""
    try:
        success = await ProfileService.delete_profile(user_id, current_user['id'])
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return {
            "success": True,
            "message": "Profile deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete profile"
        )
@router.post("/upload-cv", response_model=dict)
async def upload_cv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload CV file
    
    Note: This is a placeholder. In production, integrate with S3 or similar storage.
    For now, returns a mock URL.
    """
    try:
        # Validate file type
        allowed_types = ["application/pdf", "application/msword", 
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only PDF and DOC/DOCX files are allowed."
            )
        
        # In production, upload to S3 or similar
        # For now, create a mock URL
        cv_url = f"https://storage.example.com/cvs/{current_user['id']}/{file.filename}"
        
        # Update profile with CV URL
        profile = await ProfileService.update_cv_url(current_user['id'], cv_url)
        
        return {
            "success": True,
            "message": "CV uploaded successfully",
            "data": {
                "cv_url": cv_url,
                "profile": profile
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading CV: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload CV"
        )
