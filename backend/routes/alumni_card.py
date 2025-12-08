"""
Alumni Card Routes
Provides endpoints for digital alumni ID card management
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional
import logging

from middleware.auth_middleware import get_current_user, require_role
from database.connection import get_db_pool
from services.alumni_card_service import AlumniCardService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alumni-card", tags=["Alumni Card"])

card_service = AlumniCardService()


class VerifyCardRequest(BaseModel):
    """Request model for card verification"""
    qr_code_data: str = Field(..., description="QR code data to verify")
    verification_location: Optional[str] = Field(None, description="Location where verification occurred")


@router.post("/generate")
async def generate_alumni_card(
    current_user: dict = Depends(get_current_user)
):
    """
    Generate digital alumni ID card with QR code
    Creates a unique card number and encrypted QR code
    
    Returns:
        - Card details with QR code data
        - Card number in format ALM-YYYY-XXXXX
        - Issue and expiry dates
    """
    try:
        user_id = current_user['id']
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            card = await card_service.generate_alumni_card(conn, user_id)
            
            return {
                "success": True,
                "message": "Alumni card generated successfully",
                "data": card
            }
    
    except ValueError as ve:
        raise HTTPException(
            status_code=404,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error generating alumni card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate alumni card: {str(e)}"
        )


@router.get("/{user_id}")
async def get_alumni_card(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get alumni card for specific user
    Available to card owner or admins
    
    Returns card details including QR code
    """
    try:
        # Check permissions - user can view own card or admin can view any
        if current_user['id'] != user_id and current_user['role'] != 'admin':
            raise HTTPException(
                status_code=403,
                detail="You can only view your own card"
            )
        
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            card = await card_service.get_alumni_card(conn, user_id)
            
            if not card:
                raise HTTPException(
                    status_code=404,
                    detail="Alumni card not found. Generate a card first."
                )
            
            return {
                "success": True,
                "data": card
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting alumni card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch alumni card: {str(e)}"
        )


@router.get("/")
async def get_my_alumni_card(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's alumni card
    Convenience endpoint for logged-in user
    """
    try:
        user_id = current_user['id']
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            card = await card_service.get_alumni_card(conn, user_id)
            
            if not card:
                return {
                    "success": True,
                    "data": None,
                    "message": "No alumni card found. Generate one to get started."
                }
            
            return {
                "success": True,
                "data": card
            }
    
    except Exception as e:
        logger.error(f"Error getting alumni card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch alumni card: {str(e)}"
        )


@router.post("/verify")
async def verify_alumni_card(
    request: VerifyCardRequest = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Verify alumni card by scanning QR code
    Checks card validity, expiry, and authenticity
    
    Available to all authenticated users for verification purposes
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            verification_result = await card_service.verify_alumni_card(
                conn,
                request.qr_code_data,
                request.verification_location
            )
            
            if verification_result['is_valid']:
                return {
                    "success": True,
                    "message": "Alumni card verified successfully",
                    "data": verification_result
                }
            else:
                return {
                    "success": False,
                    "message": "Card verification failed",
                    "data": verification_result
                }
    
    except Exception as e:
        logger.error(f"Error verifying alumni card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to verify alumni card: {str(e)}"
        )


@router.post("/deactivate/{user_id}")
async def deactivate_alumni_card(
    user_id: str,
    reason: Optional[str] = Body(None),
    current_user: dict = Depends(require_role(['admin']))
):
    """
    Deactivate alumni card (Admin only)
    Card can be deactivated for security or policy violations
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            success = await card_service.deactivate_card(conn, user_id, reason)
            
            if not success:
                raise HTTPException(
                    status_code=404,
                    detail="Alumni card not found"
                )
            
            return {
                "success": True,
                "message": "Alumni card deactivated successfully"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deactivating alumni card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to deactivate alumni card: {str(e)}"
        )


@router.get("/{user_id}/verification-history")
async def get_verification_history(
    user_id: str,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """
    Get verification history for a card
    Shows all verification attempts (successful and failed)
    
    Available to card owner or admins
    """
    try:
        # Check permissions
        if current_user['id'] != user_id and current_user['role'] != 'admin':
            raise HTTPException(
                status_code=403,
                detail="You can only view your own verification history"
            )
        
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Get card first
            card = await card_service.get_alumni_card(conn, user_id)
            
            if not card:
                raise HTTPException(
                    status_code=404,
                    detail="Alumni card not found"
                )
            
            history = await card_service.get_verification_history(
                conn,
                card['card_id'],
                limit=limit
            )
            
            return {
                "success": True,
                "data": {
                    "card_number": card['card_number'],
                    "verifications": history,
                    "total_verifications": card['verification_count']
                }
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting verification history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch verification history: {str(e)}"
        )


@router.post("/regenerate")
async def regenerate_alumni_card(
    current_user: dict = Depends(get_current_user)
):
    """
    Regenerate alumni card (reissue)
    Creates a new card number and QR code, deactivates old card
    """
    try:
        user_id = current_user['id']
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Deactivate existing card
            await card_service.deactivate_card(conn, user_id, "Reissued")
            
            # Generate new card
            new_card = await card_service.generate_alumni_card(conn, user_id)
            
            return {
                "success": True,
                "message": "Alumni card regenerated successfully",
                "data": new_card
            }
    
    except Exception as e:
        logger.error(f"Error regenerating alumni card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to regenerate alumni card: {str(e)}"
        )
