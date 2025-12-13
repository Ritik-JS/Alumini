"""
Alumni Card Routes
Provides endpoints for digital alumni ID card management
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional
from typing import Optional, List
from datetime import datetime
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


@router.get("/{card_id}/download")
async def download_alumni_card(
    card_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Download alumni card as PNG image
    Generates a visual representation of the digital ID card
    """
    try:
        from fastapi.responses import Response
        
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Get card by ID
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT user_id FROM alumni_cards WHERE id = %s
                """, (card_id,))
                result = await cursor.fetchone()
            
            if not result:
                raise HTTPException(
                    status_code=404,
                    detail="Alumni card not found"
                )
            
            card_user_id = result[0]
            
            # Check permissions - user can download own card or admin can download any
            if current_user['id'] != card_user_id and current_user['role'] != 'admin':
                raise HTTPException(
                    status_code=403,
                    detail="You can only download your own card"
                )
            
            # Get full card data
            card_data = await card_service.get_alumni_card(conn, card_user_id)
            
            if not card_data:
                raise HTTPException(
                    status_code=404,
                    detail="Alumni card not found"
                )
            
            # Generate image
            image_bytes = card_service.generate_card_image(card_data)
            
            # Return as downloadable PNG
            return Response(
                content=image_bytes,
                media_type="image/png",
                headers={
                    "Content-Disposition": f"attachment; filename=alumni_card_{card_data['card_number']}.png"
                }
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading alumni card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download alumni card: {str(e)}"
        )


@router.get("/{card_id}/verifications")
async def get_card_verifications_by_id(
    card_id: str,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """
    Get verification history for a card by card_id
    Frontend expects this endpoint for verification history display
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Get card and check permissions
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT user_id, card_number, verification_count
                    FROM alumni_cards
                    WHERE id = %s
                """, (card_id,))
                card_result = await cursor.fetchone()
            
            if not card_result:
                raise HTTPException(
                    status_code=404,
                    detail="Alumni card not found"
                )
            
            card_user_id = card_result[0]
            card_number = card_result[1]
            total_verifications = card_result[2]
            
            # Check permissions - user can view own card or admin can view any
            if current_user['id'] != card_user_id and current_user['role'] != 'admin':
                raise HTTPException(
                    status_code=403,
                    detail="You can only view your own verification history"
                )
            
            # Get verification history
            history = await card_service.get_verification_history(
                conn,
                card_id,
                limit=limit
            )
            
            return {
                "success": True,
                "data": {
                    "card_number": card_number,
                    "verifications": history,
                    "total_verifications": total_verifications or 0
                }
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting card verifications: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch verification history: {str(e)}"
        )


# Admin endpoints
admin_router = APIRouter(prefix="/api/admin/alumni-card", tags=["Alumni Card Admin"])


@admin_router.get("/verifications")
async def get_all_verifications_admin(
    limit: int = 50,
    offset: int = 0,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(require_role(['admin']))
):
    """
    Get all card verifications across system (Admin only)
    Used for admin verification tracking and monitoring
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Build query with optional status filter
                query = """
                    SELECT 
                        aiv.id,
                        aiv.card_id,
                        ac.card_number,
                        ac.user_id,
                        ap.name as user_name,
                        aiv.verification_method,
                        aiv.verification_location,
                        aiv.is_valid,
                        aiv.verified_at,
                        aiv.rule_validations
                    FROM alumni_id_verifications aiv
                    JOIN alumni_cards ac ON aiv.card_id = ac.id
                    LEFT JOIN alumni_profiles ap ON ac.user_id = ap.user_id
                """
                
                params = []
                
                if status_filter:
                    query += " WHERE aiv.is_valid = %s"
                    params.append(status_filter == 'valid')
                
                query += " ORDER BY aiv.verified_at DESC LIMIT %s OFFSET %s"
                params.extend([limit, offset])
                
                await cursor.execute(query, tuple(params))
                
                verifications = []
                for row in await cursor.fetchall():
                    verifications.append({
                        "id": row[0],
                        "card_id": row[1],
                        "card_number": row[2],
                        "user_id": row[3],
                        "user_name": row[4],
                        "verification_method": row[5],
                        "verification_location": row[6],
                        "is_valid": bool(row[7]),
                        "verified_at": row[8].isoformat() if row[8] else None,
                        "rule_validations": row[9]
                    })
                
                # Get total count
                count_query = "SELECT COUNT(*) FROM alumni_id_verifications"
                if status_filter:
                    count_query += " WHERE is_valid = %s"
                    await cursor.execute(count_query, (status_filter == 'valid',))
                else:
                    await cursor.execute(count_query)
                
                total_count = (await cursor.fetchone())[0]
                
                return {
                    "success": True,
                    "data": verifications,
                    "total": total_count,
                    "limit": limit,
                    "offset": offset
                }
    
    except Exception as e:
        logger.error(f"Error getting admin verifications: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch verifications: {str(e)}"
        )

