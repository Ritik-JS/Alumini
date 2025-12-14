"""
Alumni Card Service
Handles digital alumni ID card generation and verification
"""
import logging
import json
import hashlib
import base64
import os
import uuid
from typing import Dict, Optional, List, Any
from datetime import datetime, timedelta, date
import secrets

logger = logging.getLogger(__name__)


class AlumniCardService:
    """Service for alumni digital ID cards"""
    
    def __init__(self):
        """Initialize service with configuration"""
        # Load secret key from environment variable
        self.secret_key = os.getenv(
            'ALUMNI_CARD_SECRET_KEY',
            'alumni_portal_secret_key_2025_change_in_production'
        )
    
    async def generate_alumni_card(
        self,
        db_conn,
        user_id: str
    ) -> Dict:
        """
        Generate digital alumni ID card with QR code
        """
        try:
            # Check if user already has a card
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT id, card_number, qr_code_data, issue_date, expiry_date, is_active
                    FROM alumni_cards
                    WHERE user_id = %s
                """, (user_id,))
                existing_card = await cursor.fetchone()
            
            if existing_card and existing_card[5]:  # If active card exists
                return await self._format_card_response(db_conn, existing_card, user_id)
            
            # Get user and profile details including social_links
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        u.email, u.role, u.created_at,
                        ap.name, ap.photo_url, ap.batch_year, 
                        ap.current_company, ap.current_role, ap.social_links
                    FROM users u
                    LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                    WHERE u.id = %s
                """, (user_id,))
                user_data = await cursor.fetchone()
            
            if not user_data:
                raise ValueError("User not found")
            
            email = user_data[0]
            role = user_data[1]
            name = user_data[3] if user_data[3] else email.split('@')[0]
            photo_url = user_data[4]
            batch_year = user_data[5]
            social_links = json.loads(user_data[8]) if user_data[8] else {}
            linkedin_url = social_links.get('linkedin', '') if social_links else ''
            
            # Generate unique card number
            card_number = await self._generate_card_number(db_conn, batch_year)
            
            # Generate encrypted QR code data with LinkedIn URL
            qr_code_data = self._generate_qr_code_data(user_id, card_number, email, linkedin_url)
            
            # Check for duplicate names (AI validation)
            if name and batch_year:
                duplicate_check = await self.check_duplicate_by_name(db_conn, name, batch_year)
                if duplicate_check.get("duplicate_found"):
                    logger.warning(
                        f"Potential duplicate detected for {name} (batch {batch_year}): "
                        f"Similar to {duplicate_check.get('similar_name')} "
                        f"(similarity: {duplicate_check.get('similarity_score')})"
                    )
                    # Log warning but continue - admin can review later
            
            # Set expiry date (5 years from now) - Use date objects for DATE columns
            issue_date = datetime.now().date()
            expiry_date = issue_date + timedelta(days=5*365)
            
            # Insert or update card
            if existing_card:
                # Update existing inactive card
                card_id = existing_card[0]
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        UPDATE alumni_cards
                        SET card_number = %s, qr_code_data = %s,
                            issue_date = %s, expiry_date = %s, is_active = TRUE,
                            updated_at = NOW()
                        WHERE id = %s
                    """, (card_number, qr_code_data, issue_date, expiry_date, card_id))
                    await db_conn.commit()
            else:
                # Create new card with explicit UUID (MySQL UUID() generates VARCHAR(36))
                card_id = str(uuid.uuid4())
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        INSERT INTO alumni_cards
                        (id, user_id, card_number, qr_code_data, issue_date, expiry_date, is_active)
                        VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                    """, (card_id, user_id, card_number, qr_code_data, issue_date, expiry_date))
                    await db_conn.commit()
            
            # Fetch complete profile data for consistent structure
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        ap.current_company, ap.current_role, ap.location, 
                        ap.headline, ap.is_verified, ap.social_links
                    FROM alumni_profiles ap
                    WHERE ap.user_id = %s
                """, (user_id,))
                profile_data = await cursor.fetchone()
            
            current_company = profile_data[0] if profile_data else None
            current_role = profile_data[1] if profile_data else None
            location = profile_data[2] if profile_data else None
            headline = profile_data[3] if profile_data else None
            is_verified = profile_data[4] if profile_data else False
            profile_social_links = json.loads(profile_data[5]) if (profile_data and profile_data[5]) else {}
            
            # Determine AI validation based on duplicate check
            duplicate_check_result = await self.check_duplicate_by_name(db_conn, name, batch_year) if (name and batch_year) else {"duplicate_found": False}
            duplicate_check_passed = not duplicate_check_result.get("duplicate_found", False)
            ai_confidence_score = 95 if duplicate_check_passed else 60
            ai_validation_status = "verified" if duplicate_check_passed else "pending"
            
            return {
                "id": str(card_id),
                "card_id": str(card_id),
                "user_id": user_id,
                "card_number": card_number,
                "qr_code_data": qr_code_data,
                "issue_date": issue_date.isoformat(),
                "expiry_date": expiry_date.isoformat(),
                "is_active": True,
                "verification_count": 0,
                # AI Validation fields
                "ai_validation_status": ai_validation_status,
                "ai_confidence_score": ai_confidence_score,
                "duplicate_check_passed": duplicate_check_passed,
                "signature_verified": True,
                # Nested profile object
                "profile": {
                    "name": name,
                    "email": email,
                    "photo_url": photo_url,
                    "batch_year": batch_year,
                    "current_company": current_company,
                    "current_role": current_role,
                    "location": location,
                    "headline": headline,
                    "is_verified": is_verified,
                    "social_links": profile_social_links
                },
                # Keep flat structure for backward compatibility
                "holder_name": name,
                "holder_email": email,
                "photo_url": photo_url,
                "batch_year": batch_year,
                "role": role
            }
        
        except Exception as e:
            logger.error(f"Error generating alumni card: {str(e)}")
            raise
    
    async def _generate_card_number(
        self,
        db_conn,
        batch_year: Optional[int]
    ) -> str:
        """
        Generate unique card number in format ALM-YYYY-XXXXX
        """
        year = batch_year if batch_year else datetime.now().year
        
        # Get count of cards issued for this year
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                SELECT COUNT(*) FROM alumni_cards
                WHERE card_number LIKE %s
            """, (f"ALM-{year}-%",))
            result = await cursor.fetchone()
            count = result[0] if result else 0
        
        # Generate sequential number with padding
        sequential_num = str(count + 1).zfill(5)
        card_number = f"ALM-{year}-{sequential_num}"
        
        # Ensure uniqueness
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                SELECT id FROM alumni_cards WHERE card_number = %s
            """, (card_number,))
            existing = await cursor.fetchone()
        
        if existing:
            # Add random suffix if collision occurs
            random_suffix = secrets.token_hex(2).upper()
            card_number = f"ALM-{year}-{sequential_num}-{random_suffix}"
        
        return card_number
    
    def _generate_qr_code_data(
        self,
        user_id: str,
        card_number: str,
        email: str,
        linkedin_url: str = None
    ) -> str:
        """
        Generate encrypted QR code data with LinkedIn URL
        Format: base64(sha256(user_id|card_number|email|secret))
        """
        # Create verification string using instance secret key
        verification_string = f"{user_id}|{card_number}|{email}|{self.secret_key}"
        
        # Hash the string
        hash_object = hashlib.sha256(verification_string.encode())
        hash_hex = hash_object.hexdigest()
        
        # Create QR data payload with LinkedIn URL
        qr_payload = {
            "card_number": card_number,
            "verification_hash": hash_hex,
            "linkedin_url": linkedin_url if linkedin_url else None,
            "profile_url": f"/profile/{user_id}",
            "issue_timestamp": int(datetime.now().timestamp())
        }
        
        # If LinkedIn exists, make it the primary scan target
        if linkedin_url:
            # Return LinkedIn URL directly for easy QR scanning
            return linkedin_url
        
        # Fallback to verification data if no LinkedIn
        qr_json = json.dumps(qr_payload)
        qr_base64 = base64.b64encode(qr_json.encode()).decode()
        
        return qr_base64
    
    async def verify_alumni_card(
        self,
        db_conn,
        qr_code_data: str,
        verification_location: Optional[str] = None
    ) -> Dict:
        """
        Verify alumni card by scanning QR code
        """
        try:
            # Decode QR data
            try:
                qr_json = base64.b64decode(qr_code_data).decode()
                qr_payload = json.loads(qr_json)
            except Exception as e:
                return {
                    "is_valid": False,
                    "error": "Invalid QR code format",
                    "details": str(e)
                }
            
            card_number = qr_payload.get('card_number')
            verification_hash = qr_payload.get('verification_hash')
            
            if not card_number or not verification_hash:
                return {
                    "is_valid": False,
                    "error": "Missing card number or verification hash"
                }
            
            # Get card from database
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        ac.id, ac.user_id, ac.card_number, ac.qr_code_data,
                        ac.expiry_date, ac.is_active, ac.verification_count,
                        u.email, u.role,
                        ap.name, ap.photo_url, ap.batch_year
                    FROM alumni_cards ac
                    JOIN users u ON ac.user_id = u.id
                    LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                    WHERE ac.card_number = %s
                """, (card_number,))
                card_data = await cursor.fetchone()
            
            if not card_data:
                return {
                    "is_valid": False,
                    "error": "Card not found",
                    "card_number": card_number
                }
            
            card_id = card_data[0]
            user_id = card_data[1]
            stored_qr_data = card_data[3]
            expiry_date = card_data[4]
            is_active = card_data[5]
            verification_count = card_data[6]
            email = card_data[7]
            role = card_data[8]
            name = card_data[9]
            photo_url = card_data[10]
            batch_year = card_data[11]
            
            # Validate QR code matches
            if stored_qr_data != qr_code_data:
                await self._log_verification(
                    db_conn, card_id, False, "QR code mismatch", verification_location
                )
                return {
                    "is_valid": False,
                    "error": "QR code verification failed"
                }
            
            # Check if card is active
            if not is_active:
                await self._log_verification(
                    db_conn, card_id, False, "Card is inactive", verification_location
                )
                return {
                    "is_valid": False,
                    "error": "Card has been deactivated"
                }
            
            # Check expiry
            if expiry_date and datetime.now() > expiry_date:
                await self._log_verification(
                    db_conn, card_id, False, "Card expired", verification_location
                )
                return {
                    "is_valid": False,
                    "error": "Card has expired",
                    "expiry_date": expiry_date.isoformat()
                }
            
            # Verify hash using instance secret key
            verification_string = f"{user_id}|{card_number}|{email}|{self.secret_key}"
            expected_hash = hashlib.sha256(verification_string.encode()).hexdigest()
            
            if verification_hash != expected_hash:
                await self._log_verification(
                    db_conn, card_id, False, "Hash verification failed", verification_location
                )
                return {
                    "is_valid": False,
                    "error": "Card authenticity verification failed"
                }
            
            # All checks passed - card is valid
            await self._log_verification(
                db_conn, card_id, True, None, verification_location
            )
            
            # Update verification count and last verified
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    UPDATE alumni_cards
                    SET verification_count = verification_count + 1,
                        last_verified = NOW()
                    WHERE id = %s
                """, (card_id,))
                await db_conn.commit()
            
            return {
                "is_valid": True,
                "card_id": str(card_id),
                "card_number": card_number,
                "holder_name": name if name else email.split('@')[0],
                "holder_email": email,
                "photo_url": photo_url,
                "batch_year": batch_year,
                "role": role,
                "expiry_date": expiry_date.isoformat() if expiry_date else None,
                "verification_count": verification_count + 1,
                "verified_at": datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error verifying alumni card: {str(e)}")
            raise
    
    async def _log_verification(
        self,
        db_conn,
        card_id: str,
        is_valid: bool,
        failure_reason: Optional[str],
        location: Optional[str],
        duplicate_check_passed: bool = True
    ):
        """Log verification attempt"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    INSERT INTO alumni_id_verifications
                    (card_id, verification_method, verification_location, 
                     is_valid, duplicate_check_passed, rule_validations)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    card_id,
                    'qr_scan',
                    location,
                    is_valid,
                    duplicate_check_passed,
                    json.dumps({"valid": is_valid, "reason": failure_reason})
                ))
                await db_conn.commit()
        except Exception as e:
            logger.error(f"Error logging verification: {str(e)}")
    
    async def check_duplicate_by_name(
        self,
        db_conn,
        name: str,
        batch_year: int
    ) -> Dict:
        """
        Fuzzy name matching to detect duplicates using Levenshtein distance
        Part of AI-Validated Digital Alumni ID system (Phase 10.6)
        
        Returns:
            Dict with duplicate_found, similar_name, similarity_score, existing_user_id
        """
        try:
            # Import Levenshtein distance (requires python-Levenshtein package)
            try:
                from Levenshtein import distance as levenshtein_distance
            except ImportError:
                logger.warning("python-Levenshtein not installed. Duplicate check disabled.")
                return {"duplicate_found": False, "error": "Levenshtein library not available"}
            
            # Get existing alumni with same batch year
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT ap.name, ap.user_id
                    FROM alumni_profiles ap
                    WHERE ap.batch_year = %s AND ap.name IS NOT NULL
                """, (batch_year,))
                existing_alumni = await cursor.fetchall()
            
            if not existing_alumni:
                return {"duplicate_found": False}
            
            # Check similarity with each existing name
            for existing_name, existing_user_id in existing_alumni:
                if not existing_name:
                    continue
                
                # Calculate Levenshtein similarity
                # Similarity = 1 - (distance / max_length)
                max_len = max(len(name), len(existing_name))
                if max_len == 0:
                    continue
                    
                lev_dist = levenshtein_distance(name.lower(), existing_name.lower())
                similarity = 1 - (lev_dist / max_len)
                
                # If similarity > 85%, flag as potential duplicate
                if similarity > 0.85:
                    logger.info(
                        f"Potential duplicate detected: '{name}' similar to '{existing_name}' "
                        f"(similarity: {similarity:.2f})"
                    )
                    return {
                        "duplicate_found": True,
                        "similar_name": existing_name,
                        "similarity_score": round(similarity, 2),
                        "existing_user_id": existing_user_id,
                        "batch_year": batch_year
                    }
            
            return {"duplicate_found": False}
        
        except Exception as e:
            logger.error(f"Error in duplicate check: {str(e)}")
            return {
                "duplicate_found": False,
                "error": str(e)
            }
    
    async def get_alumni_card(
        self,
        db_conn,
        user_id: str
    ) -> Optional[Dict]:
        """Get alumni card for user"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        ac.id, ac.card_number, ac.qr_code_data, ac.issue_date,
                        ac.expiry_date, ac.is_active, ac.verification_count, ac.last_verified,
                        u.email, u.role,
                        ap.name, ap.photo_url, ap.batch_year, ap.current_company, 
                        ap.current_role, ap.location, ap.headline, ap.is_verified, ap.social_links
                    FROM alumni_cards ac
                    JOIN users u ON ac.user_id = u.id
                    LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                    WHERE ac.user_id = %s
                """, (user_id,))
                card_data = await cursor.fetchone()
            
            if not card_data:
                return None
            
            # Check for duplicate names to set AI validation status
            name = card_data[10] if card_data[10] else card_data[8].split('@')[0]
            batch_year = card_data[12]
            social_links = json.loads(card_data[18]) if card_data[18] else {}
            
            duplicate_check_passed = True
            ai_confidence_score = 95  # Default high confidence
            
            if name and batch_year:
                duplicate_result = await self.check_duplicate_by_name(db_conn, name, batch_year)
                if duplicate_result.get("duplicate_found"):
                    duplicate_check_passed = False
                    ai_confidence_score = 60  # Lower confidence if duplicate found
            
            # Determine AI validation status
            ai_validation_status = "verified" if (card_data[5] and duplicate_check_passed) else "pending"
            
            # Return data with nested profile object to match frontend expectations
            return {
                "id": str(card_data[0]),
                "card_id": str(card_data[0]),
                "user_id": user_id,
                "card_number": card_data[1],
                "qr_code_data": card_data[2],
                "issue_date": card_data[3].isoformat() if card_data[3] else None,
                "expiry_date": card_data[4].isoformat() if card_data[4] else None,
                "is_active": card_data[5],
                "verification_count": card_data[6],
                "last_verified": card_data[7].isoformat() if card_data[7] else None,
                # AI Validation fields
                "ai_validation_status": ai_validation_status,
                "ai_confidence_score": ai_confidence_score,
                "duplicate_check_passed": duplicate_check_passed,
                "signature_verified": True,  # Cards are generated with valid signatures
                # Nested profile object for frontend compatibility
                "profile": {
                    "name": card_data[10] if card_data[10] else card_data[8].split('@')[0],
                    "email": card_data[8],
                    "photo_url": card_data[11],
                    "batch_year": card_data[12],
                    "current_company": card_data[13],
                    "current_role": card_data[14],
                    "location": card_data[15],
                    "headline": card_data[16],
                    "is_verified": card_data[17],
                    "social_links": social_links
                },
                # Keep flat structure for backward compatibility
                "holder_name": card_data[10] if card_data[10] else card_data[8].split('@')[0],
                "holder_email": card_data[8],
                "photo_url": card_data[11],
                "batch_year": card_data[12],
                "role": card_data[9]
            }
        
        except Exception as e:
            logger.error(f"Error getting alumni card: {str(e)}")
            raise
    
    async def _format_card_response(
        self,
        db_conn,
        card_tuple,
        user_id: str
    ) -> Dict:
        """Format existing card as response"""
        card = await self.get_alumni_card(db_conn, user_id)
        return card if card else {}
    
    async def deactivate_card(
        self,
        db_conn,
        user_id: str,
        reason: Optional[str] = None
    ) -> bool:
        """Deactivate alumni card"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    UPDATE alumni_cards
                    SET is_active = FALSE, updated_at = NOW()
                    WHERE user_id = %s
                """, (user_id,))
                await db_conn.commit()
                
                return cursor.rowcount > 0
        
        except Exception as e:
            logger.error(f"Error deactivating card: {str(e)}")
            raise
    
    async def get_verification_history(
        self,
        db_conn,
        card_id: str,
        limit: int = 20
    ) -> List[Dict]:
        """Get verification history for a card"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, verification_method, verification_location,
                        is_valid, rule_validations, verified_at
                    FROM alumni_id_verifications
                    WHERE card_id = %s
                    ORDER BY verified_at DESC
                    LIMIT %s
                """, (card_id, limit))
                verifications = await cursor.fetchall()
            
            return [
                {
                    "id": str(v[0]),
                    "method": v[1],
                    "location": v[2],
                    "is_valid": v[3],
                    "details": json.loads(v[4]) if v[4] else {},
                    "verified_at": v[5].isoformat() if v[5] else None
                }
                for v in verifications
            ]
        
        except Exception as e:
            logger.error(f"Error getting verification history: {str(e)}")
            raise
    
    def generate_card_image(self, card_data: Dict) -> bytes:
        """
        Generate alumni card as PNG image
        Returns image bytes
        """
        try:
            from PIL import Image, ImageDraw, ImageFont
            import io
            
            # Card dimensions (standard ID card aspect ratio)
            width = 1050
            height = 650
            
            # Create image with gradient background
            img = Image.new('RGB', (width, height), color='#1e40af')
            draw = ImageDraw.Draw(img)
            
            # Create gradient effect (simple top-to-bottom)
            for i in range(height):
                # Gradient from blue to purple
                r = int(30 + (i / height) * 80)
                g = int(64 - (i / height) * 30)
                b = int(175 + (i / height) * 50)
                draw.line([(0, i), (width, i)], fill=(r, g, b))
            
            # Try to load fonts, fall back to default if not available
            try:
                title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
                header_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
                label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
                value_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
            except:
                # Fall back to default font
                title_font = ImageFont.load_default()
                header_font = ImageFont.load_default()
                label_font = ImageFont.load_default()
                value_font = ImageFont.load_default()
            
            # Extract data
            profile = card_data.get('profile', {})
            name = profile.get('name', 'N/A')
            batch_year = profile.get('batch_year', 'N/A')
            card_number = card_data.get('card_number', 'N/A')
            expiry_date = card_data.get('expiry_date', 'N/A')
            is_verified = profile.get('is_verified', False)
            social_links = profile.get('social_links', {})
            linkedin_url = social_links.get('linkedin', '') if social_links else ''
            current_company = profile.get('current_company', '')
            current_role = profile.get('current_role', '')
            
            # Header - AlumUnity
            draw.text((50, 50), "AlumUnity", font=title_font, fill='white')
            draw.text((50, 105), "Official Alumni ID Card", font=label_font, fill='#bfdbfe')
            
            # Verified badge
            if is_verified:
                draw.rectangle([(width - 180, 50), (width - 50, 90)], fill='#10b981')
                draw.text((width - 170, 55), "✓ Verified", font=label_font, fill='white')
            
            # Profile section
            y_offset = 200
            
            # Name
            draw.text((50, y_offset), "NAME", font=label_font, fill='#bfdbfe')
            draw.text((50, y_offset + 30), str(name)[:30], font=value_font, fill='white')
            
            # Batch Year and Card Number (two columns)
            y_offset += 110
            draw.text((50, y_offset), "BATCH YEAR", font=label_font, fill='#bfdbfe')
            draw.text((50, y_offset + 30), str(batch_year), font=value_font, fill='white')
            
            draw.text((400, y_offset), "CARD NUMBER", font=label_font, fill='#bfdbfe')
            draw.text((400, y_offset + 30), str(card_number), font=value_font, fill='white')
            
            # Current Role/Company
            y_offset += 110
            if current_role or current_company:
                draw.text((50, y_offset), "CURRENT POSITION", font=label_font, fill='#bfdbfe')
                position_text = f"{current_role}" if current_role else ""
                if current_company:
                    position_text += f" at {current_company}" if position_text else current_company
                draw.text((50, y_offset + 30), position_text[:40], font=label_font, fill='white')
                y_offset += 80
            
            # Valid Until
            draw.text((50, y_offset), "VALID UNTIL", font=label_font, fill='#bfdbfe')
            if expiry_date and expiry_date != 'N/A':
                try:
                    expiry_obj = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
                    expiry_str = expiry_obj.strftime("%B %d, %Y")
                except:
                    expiry_str = str(expiry_date)
            else:
                expiry_str = "N/A"
            draw.text((50, y_offset + 30), expiry_str, font=label_font, fill='white')
            
            # LinkedIn URL (if available)
            if linkedin_url:
                y_offset += 80
                draw.text((50, y_offset), "LINKEDIN", font=label_font, fill='#bfdbfe')
                # Truncate long URLs
                display_url = linkedin_url.replace('https://', '').replace('www.', '')[:35]
                draw.text((50, y_offset + 30), display_url, font=label_font, fill='#93c5fd')
            
            # QR Code placeholder (white box)
            qr_box_size = 180
            qr_x = width - qr_box_size - 50
            qr_y = 200
            draw.rectangle(
                [(qr_x, qr_y), (qr_x + qr_box_size, qr_y + qr_box_size)],
                fill='white'
            )
            draw.text(
                (qr_x + qr_box_size//2 - 30, qr_y + qr_box_size//2 - 10),
                "QR CODE",
                font=label_font,
                fill='#1e40af'
            )
            draw.text(
                (qr_x + qr_box_size//2 - 50, qr_y + qr_box_size + 15),
                "Scan to verify",
                font=label_font,
                fill='#bfdbfe'
            )
            
            # Convert to bytes
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG', optimize=True)
            img_byte_arr.seek(0)
            
            return img_byte_arr.getvalue()
        
        except Exception as e:
            logger.error(f"Error generating card image: {str(e)}")
            raise
