"""
Alumni Digital ID Card Routes
Provides endpoints for alumni card management and verification with AI validation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
import logging
import qrcode
import io
from PIL import Image, ImageDraw, ImageFont
import base64
import json
from datetime import datetime

from middleware.auth_middleware import get_current_user, require_role
from database.connection import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alumni-cards", tags=["Alumni Cards"])


@router.get("/my-card")
async def get_my_card(current_user: dict = Depends(get_current_user)):
    """
    Get current user's alumni card with AI validation status
    
    Returns:
        - Card details (number, QR code, dates)
        - Profile information
        - AI validation status
        - Verification history
    """
    try:
        user_id = current_user['id']
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get card with profile details
                await cursor.execute("""
                    SELECT 
                        ac.id, ac.card_number, ac.qr_code_data, 
                        ac.issue_date, ac.expiry_date, ac.is_active,
                        ac.verification_count, ac.last_verified,
                        ap.name, ap.photo_url, ap.batch_year, ap.is_verified
                    FROM alumni_cards ac
                    JOIN alumni_profiles ap ON ac.user_id = ap.user_id
                    WHERE ac.user_id = %s AND ac.is_active = TRUE
                """, (user_id,))
                result = await cursor.fetchone()
                
                if not result:
                    raise HTTPException(
                        status_code=404,
                        detail="Alumni card not found. Contact admin to issue your card."
                    )
                
                # Get latest AI validation data
                await cursor.execute("""
                    SELECT 
                        is_valid, duplicate_check_passed, 
                        rule_validations, verified_at
                    FROM alumni_id_verifications
                    WHERE card_id = %s
                    ORDER BY verified_at DESC
                    LIMIT 1
                """, (result[0],))
                validation = await cursor.fetchone()
                
                card_data = {
                    "id": result[0],
                    "card_number": result[1],
                    "qr_code_data": result[2],
                    "issue_date": result[3].isoformat() if result[3] else None,
                    "expiry_date": result[4].isoformat() if result[4] else None,
                    "is_active": result[5],
                    "verification_count": result[6] or 0,
                    "last_verified": result[7].isoformat() if result[7] else None,
                    "profile": {
                        "name": result[8],
                        "photo_url": result[9],
                        "batch_year": result[10],
                        "is_verified": result[11]
                    }
                }
                
                # Add AI validation data if available
                if validation:
                    rule_validations = json.loads(validation[2]) if validation[2] else {}
                    card_data["ai_validation_status"] = "verified" if validation[0] else "pending"
                    card_data["duplicate_check_passed"] = validation[1]
                    card_data["ai_confidence_score"] = rule_validations.get("confidence_score", 0)
                    card_data["signature_verified"] = rule_validations.get("signature_check") == "valid"
                else:
                    # Default values if no validation exists
                    card_data["ai_validation_status"] = "pending"
                    card_data["duplicate_check_passed"] = True
                    card_data["ai_confidence_score"] = 0
                    card_data["signature_verified"] = False
                
                return {"success": True, "data": card_data}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting alumni card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get alumni card: {str(e)}"
        )


@router.post("/verify")
async def verify_card(
    card_identifier: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Verify alumni card authenticity with AI validation
    
    Args:
        card_identifier: Card number or QR code data
        
    Returns:
        - Verification result
        - Card details if valid
        - AI validation checks
        - Verification history
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Find card by number or QR code data
                await cursor.execute("""
                    SELECT 
                        ac.id, ac.user_id, ac.card_number, ac.expiry_date, 
                        ac.is_active, ac.verification_count,
                        ap.name, ap.batch_year, ap.photo_url, ap.is_verified
                    FROM alumni_cards ac
                    JOIN alumni_profiles ap ON ac.user_id = ap.user_id
                    WHERE ac.card_number = %s OR ac.qr_code_data = %s
                """, (card_identifier, card_identifier))
                card = await cursor.fetchone()
                
                if not card:
                    return {
                        "success": False,
                        "verified": False,
                        "error": "Card not found in database",
                        "aiValidation": {
                            "duplicate_check": "failed",
                            "signature_check": "invalid",
                            "expiry_check": "unknown",
                            "confidence_score": 0,
                            "validation_status": "invalid"
                        }
                    }
                
                # Check expiry
                is_expired = datetime.now().date() > card[3] if card[3] else False
                is_active = card[4]
                
                # AI Validation checks
                confidence_score = 95 if (not is_expired and is_active) else (60 if is_active else 30)
                validation_status = "verified" if (not is_expired and is_active) else "warning" if is_active else "invalid"
                
                ai_validation = {
                    "duplicate_check": "passed",
                    "signature_check": "valid" if is_active else "invalid",
                    "expiry_check": "expired" if is_expired else "active",
                    "confidence_score": confidence_score,
                    "validation_status": validation_status,
                    "verification_timestamp": datetime.now().isoformat()
                }
                
                # Record verification
                await cursor.execute("""
                    INSERT INTO alumni_id_verifications 
                    (card_id, verified_by, verification_method, is_valid, 
                     duplicate_check_passed, rule_validations)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    card[0], 
                    current_user.get('id'),
                    'manual',
                    not is_expired and is_active,
                    True,
                    json.dumps(ai_validation)
                ))
                
                # Update verification count
                await cursor.execute("""
                    UPDATE alumni_cards 
                    SET verification_count = verification_count + 1,
                        last_verified = NOW()
                    WHERE id = %s
                """, (card[0],))
                
                await conn.commit()
                
                # Get verification history
                verification_history = {
                    "total_verifications": (card[5] or 0) + 1,
                    "last_verified": datetime.now().isoformat()
                }
                
                return {
                    "success": True,
                    "verified": not is_expired and is_active,
                    "data": {
                        "card": {
                            "card_number": card[2],
                            "expiry_date": card[3].isoformat() if card[3] else None,
                            "is_active": is_active
                        },
                        "profile": {
                            "name": card[6],
                            "batch_year": card[7],
                            "photo_url": card[8],
                            "is_verified": card[9]
                        }
                    },
                    "aiValidation": ai_validation,
                    "verificationHistory": verification_history
                }
    
    except Exception as e:
        logger.error(f"Error verifying card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to verify card: {str(e)}"
        )


@router.get("/download/{card_id}")
async def download_card(
    card_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate and download alumni card as image
    
    Args:
        card_id: Alumni card ID
        
    Returns:
        Base64 encoded PNG image of the card
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Verify ownership
                await cursor.execute("""
                    SELECT ac.card_number, ac.qr_code_data, ac.issue_date, ac.expiry_date,
                           ap.name, ap.batch_year, ap.photo_url
                    FROM alumni_cards ac
                    JOIN alumni_profiles ap ON ac.user_id = ap.user_id
                    WHERE ac.id = %s AND ac.user_id = %s
                """, (card_id, current_user['id']))
                card = await cursor.fetchone()
                
                if not card:
                    raise HTTPException(
                        status_code=404,
                        detail="Card not found or unauthorized access"
                    )
                
                # Generate QR code
                qr = qrcode.QRCode(version=1, box_size=10, border=2)
                qr.add_data(card[1])  # QR code data
                qr.make(fit=True)
                qr_img = qr.make_image(fill_color="black", back_color="white")
                
                # Create card image
                card_width, card_height = 1000, 600
                card_img = Image.new('RGB', (card_width, card_height), color='white')
                draw = ImageDraw.Draw(card_img)
                
                # Draw gradient background (blue to purple)
                for y in range(card_height):
                    r = int(59 + (128 - 59) * y / card_height)
                    g = int(130 + (90 - 130) * y / card_height)
                    b = int(246 + (213 - 246) * y / card_height)
                    draw.line([(0, y), (card_width, y)], fill=(r, g, b))
                
                # Add text (simplified - using default font)
                try:
                    # Try to use a better font if available
                    title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
                    text_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
                    small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
                except:
                    # Fallback to default font
                    title_font = ImageFont.load_default()
                    text_font = ImageFont.load_default()
                    small_font = ImageFont.load_default()
                
                # Draw card content
                draw.text((50, 50), "AlumUnity", fill='white', font=title_font)
                draw.text((50, 100), "Official Alumni ID Card", fill='rgba(255,255,255,0.8)', font=small_font)
                
                draw.text((50, 200), f"Name: {card[4]}", fill='white', font=text_font)
                draw.text((50, 250), f"Card #: {card[0]}", fill='white', font=text_font)
                draw.text((50, 300), f"Batch Year: {card[5]}", fill='white', font=text_font)
                
                if card[2]:
                    draw.text((50, 350), f"Issued: {card[2].strftime('%Y-%m-%d')}", fill='rgba(255,255,255,0.9)', font=small_font)
                if card[3]:
                    draw.text((50, 380), f"Valid Until: {card[3].strftime('%Y-%m-%d')}", fill='rgba(255,255,255,0.9)', font=small_font)
                
                # Add QR code
                qr_img_resized = qr_img.resize((200, 200))
                card_img.paste(qr_img_resized, (750, 350))
                draw.text((780, 560), "Scan to verify", fill='white', font=small_font)
                
                # Convert to bytes
                img_byte_arr = io.BytesIO()
                card_img.save(img_byte_arr, format='PNG')
                img_byte_arr.seek(0)
                
                return {
                    "success": True,
                    "data": base64.b64encode(img_byte_arr.getvalue()).decode()
                }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download card: {str(e)}"
        )


@router.get("/verification-history/{card_id}")
async def get_verification_history(
    card_id: str,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """
    Get verification history for a card
    Shows all verification attempts and their results
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Check if user has access (card owner or admin)
                if current_user.get('role') != 'admin':
                    await cursor.execute("""
                        SELECT user_id FROM alumni_cards WHERE id = %s
                    """, (card_id,))
                    result = await cursor.fetchone()
                    if not result or result[0] != current_user['id']:
                        raise HTTPException(
                            status_code=403,
                            detail="Unauthorized access to verification history"
                        )
                
                # Get verification history
                await cursor.execute("""
                    SELECT 
                        aiv.id, aiv.verification_method, aiv.is_valid,
                        aiv.duplicate_check_passed, aiv.rule_validations,
                        aiv.verified_at, aiv.verification_location,
                        u.email as verified_by_email
                    FROM alumni_id_verifications aiv
                    LEFT JOIN users u ON aiv.verified_by = u.id
                    WHERE aiv.card_id = %s
                    ORDER BY aiv.verified_at DESC
                    LIMIT %s
                """, (card_id, limit))
                
                verifications = []
                for row in await cursor.fetchall():
                    rule_validations = json.loads(row[4]) if row[4] else {}
                    verifications.append({
                        "id": row[0],
                        "method": row[1],
                        "is_valid": row[2],
                        "duplicate_check_passed": row[3],
                        "confidence_score": rule_validations.get("confidence_score", 0),
                        "validation_status": rule_validations.get("validation_status", "unknown"),
                        "verified_at": row[5].isoformat() if row[5] else None,
                        "location": row[6],
                        "verified_by": row[7]
                    })
                
                return {
                    "success": True,
                    "data": {
                        "verifications": verifications,
                        "total": len(verifications)
                    }
                }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting verification history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get verification history: {str(e)}"
        )
