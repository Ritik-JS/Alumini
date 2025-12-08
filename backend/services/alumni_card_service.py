"""
Alumni Card Service
Handles digital alumni ID card generation and verification
"""
import logging
import json
import hashlib
import base64
from typing import Dict, Optional, List, Any
from datetime import datetime, timedelta
import secrets

logger = logging.getLogger(__name__)


class AlumniCardService:
    """Service for alumni digital ID cards"""
    
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
            
            # Get user and profile details
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        u.email, u.role, u.created_at,
                        ap.name, ap.photo_url, ap.batch_year, 
                        ap.current_company, ap.current_role
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
            
            # Generate unique card number
            card_number = await self._generate_card_number(db_conn, batch_year)
            
            # Generate encrypted QR code data
            qr_code_data = self._generate_qr_code_data(user_id, card_number, email)
            
            # Set expiry date (5 years from now)
            issue_date = datetime.now()
            expiry_date = issue_date + timedelta(days=5*365)
            
            # Insert or update card
            if existing_card:
                # Update existing inactive card
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        UPDATE alumni_cards
                        SET card_number = %s, qr_code_data = %s,
                            issue_date = %s, expiry_date = %s, is_active = TRUE,
                            updated_at = NOW()
                        WHERE user_id = %s
                    """, (card_number, qr_code_data, issue_date, expiry_date, user_id))
                    await db_conn.commit()
                
                card_id = existing_card[0]
            else:
                # Create new card
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        INSERT INTO alumni_cards
                        (user_id, card_number, qr_code_data, issue_date, expiry_date, is_active)
                        VALUES (%s, %s, %s, %s, %s, TRUE)
                    """, (user_id, card_number, qr_code_data, issue_date, expiry_date))
                    await db_conn.commit()
                    
                    await cursor.execute("SELECT LAST_INSERT_ID()")
                    result = await cursor.fetchone()
                    card_id = result[0] if result else None
            
            return {
                "card_id": str(card_id),
                "user_id": user_id,
                "card_number": card_number,
                "holder_name": name,
                "holder_email": email,
                "photo_url": photo_url,
                "batch_year": batch_year,
                "role": role,
                "qr_code_data": qr_code_data,
                "issue_date": issue_date.isoformat(),
                "expiry_date": expiry_date.isoformat(),
                "is_active": True,
                "verification_count": 0
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
        email: str
    ) -> str:
        """
        Generate encrypted QR code data
        Format: base64(sha256(user_id|card_number|email|secret))
        """
        # Secret key for hashing (should be from environment in production)
        secret_key = "alumni_portal_secret_key_2025"  # TODO: Move to env
        
        # Create verification string
        verification_string = f"{user_id}|{card_number}|{email}|{secret_key}"
        
        # Hash the string
        hash_object = hashlib.sha256(verification_string.encode())
        hash_hex = hash_object.hexdigest()
        
        # Create QR data payload
        qr_payload = {
            "card_number": card_number,
            "verification_hash": hash_hex,
            "issue_timestamp": int(datetime.now().timestamp())
        }
        
        # Encode to base64
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
            
            # Verify hash
            secret_key = "alumni_portal_secret_key_2025"  # TODO: Move to env
            verification_string = f"{user_id}|{card_number}|{email}|{secret_key}"
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
        location: Optional[str]
    ):
        """Log verification attempt"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    INSERT INTO alumni_id_verifications
                    (card_id, verification_method, verification_location, 
                     is_valid, rule_validations)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    card_id,
                    'qr_scan',
                    location,
                    is_valid,
                    json.dumps({"valid": is_valid, "reason": failure_reason})
                ))
                await db_conn.commit()
        except Exception as e:
            logger.error(f"Error logging verification: {str(e)}")
    
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
                        ap.name, ap.photo_url, ap.batch_year
                    FROM alumni_cards ac
                    JOIN users u ON ac.user_id = u.id
                    LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                    WHERE ac.user_id = %s
                """, (user_id,))
                card_data = await cursor.fetchone()
            
            if not card_data:
                return None
            
            return {
                "card_id": str(card_data[0]),
                "user_id": user_id,
                "card_number": card_data[1],
                "qr_code_data": card_data[2],
                "issue_date": card_data[3].isoformat() if card_data[3] else None,
                "expiry_date": card_data[4].isoformat() if card_data[4] else None,
                "is_active": card_data[5],
                "verification_count": card_data[6],
                "last_verified": card_data[7].isoformat() if card_data[7] else None,
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
