"""Admin routes for profile verification and management"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from database.models import (
    VerifyProfileRequest,
    RejectProfileRequest,
    UserResponse
)
from services.admin_service import AdminService
from middleware.auth_middleware import require_admin
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/profiles/verify/{user_id}", response_model=dict)
async def verify_profile(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Verify alumni profile (Admin only)
    
    - Sets profile as verified
    - Creates verification record
    - Sends notification to user
    """
    try:
        result = await AdminService.verify_profile(user_id, current_user["id"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": {"user_id": user_id}
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error verifying profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify profile"
        )


@router.post("/profiles/reject/{user_id}", response_model=dict)
async def reject_profile(
    user_id: str,
    rejection_data: RejectProfileRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Reject alumni profile verification (Admin only)
    
    - Creates rejection record with reason
    - Sends notification to user with rejection reason
    """
    try:
        result = await AdminService.reject_profile(
            user_id,
            current_user["id"],
            rejection_data.rejection_reason
        )
        
        return {
            "success": True,
            "message": result["message"],
            "data": {
                "user_id": user_id,
                "reason": rejection_data.rejection_reason
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error rejecting profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reject profile"
        )


@router.get("/profiles/pending", response_model=dict)
async def get_pending_verifications(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(require_admin)
):
    """
    Get pending profile verification requests (Admin only)
    
    Returns profiles that:
    - Are not yet verified
    - Have profile completion >= 70%
    - Don't have a rejection record
    """
    try:
        result = await AdminService.get_pending_verifications(page, limit)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Error fetching pending verifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pending verifications"
        )


@router.get("/profiles/verification-requests", response_model=dict)
async def get_verification_requests(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(require_admin)
):
    """
    Get all verification requests with optional status filter (Admin only)
    
    - **status**: Filter by status (pending, approved, rejected)
    - **page**: Page number
    - **limit**: Results per page
    """
    try:
        # Validate status if provided
        if status and status not in ['pending', 'approved', 'rejected']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Must be: pending, approved, or rejected"
            )
        
        result = await AdminService.get_all_verification_requests(status, page, limit)
        
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching verification requests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch verification requests"
        )


@router.get("/profiles/verification-status/{user_id}", response_model=dict)
async def get_user_verification_status(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Get verification status for a specific user (Admin only)
    """
    try:
        verification_status = await AdminService.get_user_verification_status(user_id)
        
        if not verification_status:
            return {
                "success": True,
                "data": {
                    "has_request": False,
                    "message": "No verification request found for this user"
                }
            }
        
        return {
            "success": True,
            "data": {
                "has_request": True,
                "verification": verification_status
            }
        }
    except Exception as e:
        logger.error(f"Error fetching verification status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch verification status"
        )
