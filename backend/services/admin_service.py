"""Admin service for profile verification and management"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import aiomysql

from database.connection import get_db_pool

logger = logging.getLogger(__name__)


class AdminService:
    """Service for admin operations"""
    
    @staticmethod
    async def verify_profile(user_id: str, admin_id: str) -> Dict[str, Any]:
        """Verify alumni profile"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if profile exists
                await cursor.execute(
                    "SELECT id FROM alumni_profiles WHERE user_id = %s",
                    (user_id,)
                )
                profile = await cursor.fetchone()
                
                if not profile:
                    raise ValueError("Profile not found")
                
                # Update profile verification status
                await cursor.execute(
                    """
                    UPDATE alumni_profiles 
                    SET is_verified = TRUE, verified_by = %s, verified_at = NOW()
                    WHERE user_id = %s
                    """,
                    (admin_id, user_id)
                )
                
                # Update or create verification request
                await cursor.execute(
                    """
                    INSERT INTO profile_verification_requests 
                    (user_id, status, reviewed_by, reviewed_at)
                    VALUES (%s, 'approved', %s, NOW())
                    ON DUPLICATE KEY UPDATE
                    status = 'approved',
                    reviewed_by = %s,
                    reviewed_at = NOW()
                    """,
                    (user_id, admin_id, admin_id)
                )
                
                await conn.commit()
                
                # Log admin action
                await cursor.execute(
                    """
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description
                    ) VALUES (%s, %s, %s, %s, %s)
                    """,
                    (admin_id, 'verification', 'profile', user_id, 'Approved profile verification')
                )
                await conn.commit()
                
                # Send notification to user
                await cursor.callproc('send_notification', (
                    user_id, 'verification', 'Profile Verified',
                    'Your alumni profile has been verified by admin.', 
                    '/profile', 'high'
                ))
                await conn.commit()
                
                return {"message": "Profile verified successfully", "user_id": user_id}
    
    @staticmethod
    async def reject_profile(user_id: str, admin_id: str, rejection_reason: str) -> Dict[str, Any]:
        """Reject alumni profile verification"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if profile exists
                await cursor.execute(
                    "SELECT id FROM alumni_profiles WHERE user_id = %s",
                    (user_id,)
                )
                profile = await cursor.fetchone()
                
                if not profile:
                    raise ValueError("Profile not found")
                
                # Update or create verification request
                await cursor.execute(
                    """
                    INSERT INTO profile_verification_requests 
                    (user_id, status, rejection_reason, reviewed_by, reviewed_at)
                    VALUES (%s, 'rejected', %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                    status = 'rejected',
                    rejection_reason = %s,
                    reviewed_by = %s,
                    reviewed_at = NOW()
                    """,
                    (user_id, rejection_reason, admin_id, rejection_reason, admin_id)
                )
                
                await conn.commit()
                
                # Log admin action
                await cursor.execute(
                    """
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description, metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (admin_id, 'verification', 'profile', user_id, 
                     'Rejected profile verification', 
                     f'{{"reason": "{rejection_reason}"}}')
                )
                await conn.commit()
                
                # Send notification to user
                await cursor.callproc('send_notification', (
                    user_id, 'verification', 'Profile Verification Rejected',
                    f'Your profile verification was rejected. Reason: {rejection_reason}', 
                    '/profile', 'high'
                ))
                await conn.commit()
                
                return {
                    "message": "Profile verification rejected",
                    "user_id": user_id,
                    "reason": rejection_reason
                }
    
    @staticmethod
    async def get_pending_verifications(page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get pending profile verification requests"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get pending verifications or profiles that need verification
                offset = (page - 1) * limit
                
                # Count total pending
                await cursor.execute(
                    """
                    SELECT COUNT(*) as total
                    FROM alumni_profiles ap
                    LEFT JOIN profile_verification_requests pvr ON ap.user_id = pvr.user_id
                    WHERE ap.is_verified = FALSE
                    AND (pvr.status IS NULL OR pvr.status = 'pending')
                    AND ap.profile_completion_percentage >= 70
                    """
                )
                total_result = await cursor.fetchone()
                total = total_result['total'] if total_result else 0
                
                # Get pending profiles with user info
                await cursor.execute(
                    """
                    SELECT 
                        ap.*,
                        u.email,
                        u.role,
                        pvr.id as verification_request_id,
                        pvr.status as verification_status,
                        pvr.created_at as request_created_at
                    FROM alumni_profiles ap
                    JOIN users u ON ap.user_id = u.id
                    LEFT JOIN profile_verification_requests pvr ON ap.user_id = pvr.user_id
                    WHERE ap.is_verified = FALSE
                    AND (pvr.status IS NULL OR pvr.status = 'pending')
                    AND ap.profile_completion_percentage >= 70
                    ORDER BY ap.created_at DESC
                    LIMIT %s OFFSET %s
                    """,
                    (limit, offset)
                )
                
                profiles = await cursor.fetchall()
                
                # Parse JSON fields
                from services.profile_service import ProfileService
                parsed_profiles = [ProfileService._parse_profile_json_fields(p) for p in profiles]
                
                return {
                    "profiles": parsed_profiles,
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "total_pages": (total + limit - 1) // limit
                }
    
    @staticmethod
    async def get_all_verification_requests(
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get all verification requests with optional status filter"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                where_clause = "WHERE pvr.status = %s" if status else ""
                values = [status] if status else []
                
                # Count total
                count_query = f"""
                SELECT COUNT(*) as total
                FROM profile_verification_requests pvr
                {where_clause}
                """
                await cursor.execute(count_query, values)
                total_result = await cursor.fetchone()
                total = total_result['total'] if total_result else 0
                
                # Get requests
                offset = (page - 1) * limit
                query = f"""
                SELECT 
                    pvr.*,
                    ap.name as profile_name,
                    u.email as user_email,
                    admin_u.email as reviewed_by_email
                FROM profile_verification_requests pvr
                JOIN users u ON pvr.user_id = u.id
                JOIN alumni_profiles ap ON pvr.user_id = ap.user_id
                LEFT JOIN users admin_u ON pvr.reviewed_by = admin_u.id
                {where_clause}
                ORDER BY pvr.created_at DESC
                LIMIT %s OFFSET %s
                """
                values.extend([limit, offset])
                
                await cursor.execute(query, values)
                requests = await cursor.fetchall()
                
                return {
                    "requests": requests,
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "total_pages": (total + limit - 1) // limit
                }
    
    @staticmethod
    async def get_user_verification_status(user_id: str) -> Optional[Dict[str, Any]]:
        """Get verification status for a specific user"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    """
                    SELECT 
                        pvr.*,
                        admin_u.email as reviewed_by_email,
                        ap.is_verified as profile_verified
                    FROM profile_verification_requests pvr
                    LEFT JOIN users admin_u ON pvr.reviewed_by = admin_u.id
                    LEFT JOIN alumni_profiles ap ON pvr.user_id = ap.user_id
                    WHERE pvr.user_id = %s
                    ORDER BY pvr.created_at DESC
                    LIMIT 1
                    """,
                    (user_id,)
                )
                
                return await cursor.fetchone()
