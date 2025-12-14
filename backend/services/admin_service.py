"""Admin service for profile verification and management"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import aiomysql
import json

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
    
    # ========================================================================
    # USER MANAGEMENT METHODS
    # ========================================================================
    
    @staticmethod
    async def get_all_users(
        role: Optional[str] = None,
        is_verified: Optional[bool] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get all users with filters"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build WHERE clause
                conditions = []
                values = []
                
                if role:
                    conditions.append("u.role = %s")
                    values.append(role)
                
                if is_verified is not None:
                    conditions.append("u.is_verified = %s")
                    values.append(is_verified)
                
                if is_active is not None:
                    conditions.append("u.is_active = %s")
                    values.append(is_active)
                
                if search:
                    conditions.append("(u.email LIKE %s OR ap.name LIKE %s)")
                    search_term = f"%{search}%"
                    values.extend([search_term, search_term])
                
                where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
                
                # Count total
                count_query = f"""
                SELECT COUNT(DISTINCT u.id) as total
                FROM users u
                LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                {where_clause}
                """
                await cursor.execute(count_query, values)
                total_result = await cursor.fetchone()
                total = total_result['total'] if total_result else 0
                
                # Get users
                offset = (page - 1) * limit
                query = f"""
                SELECT 
                    u.*,
                    ap.name as profile_name,
                    ap.photo_url,
                    ap.current_company,
                    ap.current_role,
                    ap.is_verified as profile_verified
                FROM users u
                LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                {where_clause}
                ORDER BY u.created_at DESC
                LIMIT %s OFFSET %s
                """
                values_with_limit = values + [limit, offset]
                
                await cursor.execute(query, values_with_limit)
                users = await cursor.fetchall()
                
                return {
                    "data": users,
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "total_pages": (total + limit - 1) // limit
                }
    
    @staticmethod
    async def get_user_detail(user_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed user information"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute("""
                    SELECT 
                        u.*,
                        ap.name,
                        ap.photo_url,
                        ap.bio,
                        ap.current_company,
                        ap.current_role,
                        ap.location,
                        ap.batch_year,
                        ap.skills,
                        ap.industry,
                        ap.profile_completion_percentage,
                        ap.is_verified as profile_verified
                    FROM users u
                    LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                    WHERE u.id = %s
                """, (user_id,))
                
                user = await cursor.fetchone()
                if user and user['skills']:
                    import json
                    user['skills'] = json.loads(user['skills']) if isinstance(user['skills'], str) else user['skills']
                
                return user
    
    @staticmethod
    async def update_user(user_id: str, admin_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user information"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if user exists
                await cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
                if not await cursor.fetchone():
                    raise ValueError("User not found")
                
                # Build update query
                update_fields = []
                values = []
                
                if 'role' in updates:
                    update_fields.append("role = %s")
                    values.append(updates['role'])
                
                if 'is_active' in updates:
                    update_fields.append("is_active = %s")
                    values.append(updates['is_active'])
                
                if 'is_verified' in updates:
                    update_fields.append("is_verified = %s")
                    values.append(updates['is_verified'])
                
                if not update_fields:
                    raise ValueError("No valid fields to update")
                
                values.append(user_id)
                
                update_query = f"""
                UPDATE users 
                SET {', '.join(update_fields)}
                WHERE id = %s
                """
                
                await cursor.execute(update_query, values)
                await conn.commit()
                
                # Log admin action
                await cursor.execute("""
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description, metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    admin_id, 'user_management', 'user', user_id,
                    'Updated user information',
                    json.dumps(updates)
                ))
                await conn.commit()
                
                return {"message": "User updated successfully", "user_id": user_id}
    
    @staticmethod
    async def suspend_user(user_id: str, admin_id: str, reason: str) -> Dict[str, Any]:
        """Suspend a user account"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if user exists
                await cursor.execute("SELECT id, email FROM users WHERE id = %s", (user_id,))
                user = await cursor.fetchone()
                if not user:
                    raise ValueError("User not found")
                
                # Suspend user
                await cursor.execute("""
                    UPDATE users 
                    SET is_active = FALSE
                    WHERE id = %s
                """, (user_id,))
                await conn.commit()
                
                # Log admin action
                await cursor.execute("""
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description, metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    admin_id, 'user_management', 'user', user_id,
                    'Suspended user account',
                    json.dumps({'reason': reason})
                ))
                await conn.commit()
                
                # Send notification
                await cursor.callproc('send_notification', (
                    user_id, 'system', 'Account Suspended',
                    f'Your account has been suspended. Reason: {reason}',
                    '/support', 'high'
                ))
                await conn.commit()
                
                return {"message": "User suspended successfully", "user_id": user_id}
    
    @staticmethod
    async def activate_user(user_id: str, admin_id: str) -> Dict[str, Any]:
        """Activate a suspended user account"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if user exists
                await cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
                if not await cursor.fetchone():
                    raise ValueError("User not found")
                
                # Activate user
                await cursor.execute("""
                    UPDATE users 
                    SET is_active = TRUE
                    WHERE id = %s
                """, (user_id,))
                await conn.commit()
                
                # Log admin action
                await cursor.execute("""
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description
                    ) VALUES (%s, %s, %s, %s, %s)
                """, (
                    admin_id, 'user_management', 'user', user_id,
                    'Activated user account'
                ))
                await conn.commit()
                
                # Send notification
                await cursor.callproc('send_notification', (
                    user_id, 'system', 'Account Activated',
                    'Your account has been activated. You can now log in.',
                    '/login', 'medium'
                ))
                await conn.commit()
                
                return {"message": "User activated successfully", "user_id": user_id}
    
    @staticmethod
    async def delete_user(user_id: str, admin_id: str) -> Dict[str, Any]:
        """Soft delete a user account"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if user exists
                await cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
                if not await cursor.fetchone():
                    raise ValueError("User not found")
                
                # Soft delete (deactivate)
                await cursor.execute("""
                    UPDATE users 
                    SET is_active = FALSE
                    WHERE id = %s
                """, (user_id,))
                await conn.commit()
                
                # Log admin action
                await cursor.execute("""
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description
                    ) VALUES (%s, %s, %s, %s, %s)
                """, (
                    admin_id, 'user_management', 'user', user_id,
                    'Deleted user account (soft delete)'
                ))
                await conn.commit()
                
                return {"message": "User deleted successfully", "user_id": user_id}
    
    @staticmethod
    async def ban_user(user_id: str, admin_id: str, reason: str = "") -> Dict[str, Any]:
        """Ban a user account (alias for suspend)"""
        return await AdminService.suspend_user(user_id, admin_id, reason)
    
    @staticmethod
    async def reset_password(user_id: str, admin_id: str) -> Dict[str, Any]:
        """Send password reset email to user"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if user exists
                await cursor.execute("SELECT id, email FROM users WHERE id = %s", (user_id,))
                user = await cursor.fetchone()
                if not user:
                    raise ValueError("User not found")
                
                # Log admin action
                await cursor.execute("""
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description
                    ) VALUES (%s, %s, %s, %s, %s)
                """, (
                    admin_id, 'user_management', 'user', user_id,
                    'Triggered password reset'
                ))
                await conn.commit()
                
                # Send notification to user
                await cursor.callproc('send_notification', (
                    user_id, 'system', 'Password Reset Requested',
                    'A password reset has been requested for your account by admin. Please check your email for reset instructions.',
                    '/auth/reset-password', 'high'
                ))
                await conn.commit()
                
                return {
                    "message": "Password reset email sent successfully",
                    "user_id": user_id,
                    "email": user['email']
                }
    
    # ========================================================================
    # CONTENT MODERATION METHODS
    # ========================================================================
    
    @staticmethod
    async def get_flagged_content(
        content_type: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get flagged content for moderation"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build WHERE clause
                conditions = []
                values = []
                
                if content_type:
                    conditions.append("cf.content_type = %s")
                    values.append(content_type)
                
                if status:
                    conditions.append("cf.status = %s")
                    values.append(status)
                
                where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
                
                # Count total
                count_query = f"""
                SELECT COUNT(*) as total
                FROM content_flags cf
                {where_clause}
                """
                await cursor.execute(count_query, values)
                total_result = await cursor.fetchone()
                total = total_result['total'] if total_result else 0
                
                # Get flagged content
                offset = (page - 1) * limit
                query = f"""
                SELECT 
                    cf.*,
                    flagger.email as flagged_by_email,
                    flagger_profile.name as flagged_by_name,
                    reviewer.email as reviewed_by_email
                FROM content_flags cf
                JOIN users flagger ON cf.flagged_by = flagger.id
                LEFT JOIN alumni_profiles flagger_profile ON flagger.id = flagger_profile.user_id
                LEFT JOIN users reviewer ON cf.reviewed_by = reviewer.id
                {where_clause}
                ORDER BY cf.created_at DESC
                LIMIT %s OFFSET %s
                """
                values_with_limit = values + [limit, offset]
                
                await cursor.execute(query, values_with_limit)
                flags = await cursor.fetchall()
                
                return {
                    "flags": flags,
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "total_pages": (total + limit - 1) // limit
                }
    
    @staticmethod
    async def moderate_content(
        flag_id: str,
        admin_id: str,
        action: str,
        admin_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Moderate flagged content (approve or remove)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get flag details
                await cursor.execute("""
                    SELECT * FROM content_flags WHERE id = %s
                """, (flag_id,))
                flag = await cursor.fetchone()
                
                if not flag:
                    raise ValueError("Flag not found")
                
                # Update flag status
                new_status = 'approved' if action == 'approve' else 'removed'
                await cursor.execute("""
                    UPDATE content_flags
                    SET status = %s, reviewed_by = %s, reviewed_at = NOW()
                    WHERE id = %s
                """, (new_status, admin_id, flag_id))
                await conn.commit()
                
                # If removing content, mark as deleted
                if action == 'remove':
                    content_type = flag['content_type']
                    content_id = flag['content_id']
                    
                    if content_type == 'post':
                        await cursor.execute("""
                            UPDATE forum_posts SET is_deleted = TRUE WHERE id = %s
                        """, (content_id,))
                    elif content_type == 'comment':
                        await cursor.execute("""
                            UPDATE forum_comments SET is_deleted = TRUE WHERE id = %s
                        """, (content_id,))
                    # Add more content types as needed
                    
                    await conn.commit()
                
                # Log admin action
                metadata = {
                    'flag_id': flag_id,
                    'action': action,
                    'content_type': flag['content_type'],
                    'content_id': flag['content_id']
                }
                if admin_notes:
                    metadata['admin_notes'] = admin_notes
                
                await cursor.execute("""
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description, metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    admin_id, 'content_moderation', flag['content_type'], flag['content_id'],
                    f'Content {action}d after moderation review',
                    json.dumps(metadata)
                ))
                await conn.commit()
                
                return {
                    "message": f"Content {action}d successfully",
                    "flag_id": flag_id,
                    "action": action
                }
    
    @staticmethod
    async def remove_content(
        content_type: str,
        content_id: str,
        admin_id: str,
        reason: str
    ) -> Dict[str, Any]:
        """Remove content directly (without flag)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Mark content as deleted based on type
                if content_type == 'post':
                    await cursor.execute("""
                        UPDATE forum_posts SET is_deleted = TRUE WHERE id = %s
                    """, (content_id,))
                elif content_type == 'comment':
                    await cursor.execute("""
                        UPDATE forum_comments SET is_deleted = TRUE WHERE id = %s
                    """, (content_id,))
                elif content_type == 'job':
                    await cursor.execute("""
                        UPDATE jobs SET status = 'closed' WHERE id = %s
                    """, (content_id,))
                elif content_type == 'event':
                    await cursor.execute("""
                        UPDATE events SET status = 'cancelled' WHERE id = %s
                    """, (content_id,))
                else:
                    raise ValueError(f"Unsupported content type: {content_type}")
                
                await conn.commit()
                
                # Log admin action
                await cursor.execute("""
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description, metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    admin_id, 'content_moderation', content_type, content_id,
                    'Content removed by admin',
                    json.dumps({'reason': reason})
                ))
                await conn.commit()
                
                return {
                    "message": "Content removed successfully",
                    "content_type": content_type,
                    "content_id": content_id
                }
    
    # ========================================================================
    # SYSTEM CONFIGURATION METHODS
    # ========================================================================
    
    @staticmethod
    async def get_system_settings() -> List[Dict[str, Any]]:
        """Get all system configuration settings"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute("""
                    SELECT * FROM system_config
                    ORDER BY config_key
                """)
                
                return await cursor.fetchall()
    
    @staticmethod
    async def update_system_setting(
        config_key: str,
        config_value: str,
        admin_id: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update a system configuration setting"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if config exists
                await cursor.execute("""
                    SELECT id FROM system_config WHERE config_key = %s
                """, (config_key,))
                config = await cursor.fetchone()
                
                if config:
                    # Update existing config
                    await cursor.execute("""
                        UPDATE system_config
                        SET config_value = %s, updated_by = %s, updated_at = NOW()
                        WHERE config_key = %s
                    """, (config_value, admin_id, config_key))
                else:
                    # Create new config
                    await cursor.execute("""
                        INSERT INTO system_config (config_key, config_value, description, updated_by)
                        VALUES (%s, %s, %s, %s)
                    """, (config_key, config_value, description, admin_id))
                
                await conn.commit()
                
                # Log admin action
                await cursor.execute("""
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description, metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    admin_id, 'system_config', 'config', config_key,
                    'Updated system configuration',
                    json.dumps({'config_key': config_key, 'new_value': config_value})
                ))
                await conn.commit()
                
                return {
                    "message": "System setting updated successfully",
                    "config_key": config_key,
                    "config_value": config_value
                }
    
    # ========================================================================
    # AUDIT LOG METHODS
    # ========================================================================
    
    @staticmethod
    async def get_audit_log(
        action_type: Optional[str] = None,
        admin_id: Optional[str] = None,
        page: int = 1,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get admin action audit log"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build WHERE clause
                conditions = []
                values = []
                
                if action_type:
                    conditions.append("aa.action_type = %s")
                    values.append(action_type)
                
                if admin_id:
                    conditions.append("aa.admin_id = %s")
                    values.append(admin_id)
                
                where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
                
                # Count total
                count_query = f"""
                SELECT COUNT(*) as total
                FROM admin_actions aa
                {where_clause}
                """
                await cursor.execute(count_query, values)
                total_result = await cursor.fetchone()
                total = total_result['total'] if total_result else 0
                
                # Get audit log
                offset = (page - 1) * limit
                query = f"""
                SELECT 
                    aa.*,
                    u.email as admin_email,
                    ap.name as admin_name
                FROM admin_actions aa
                JOIN users u ON aa.admin_id = u.id
                LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                {where_clause}
                ORDER BY aa.timestamp DESC
                LIMIT %s OFFSET %s
                """
                values_with_limit = values + [limit, offset]
                
                await cursor.execute(query, values_with_limit)
                logs = await cursor.fetchall()
                
                # Parse metadata JSON
                for log in logs:
                    if log.get('metadata'):
                        try:
                            log['metadata'] = json.loads(log['metadata']) if isinstance(log['metadata'], str) else log['metadata']
                        except:
                            pass
                
                return {
                    "logs": logs,
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "total_pages": (total + limit - 1) // limit
                }

    
    @staticmethod
    async def create_missing_alumni_profiles() -> Dict[str, Any]:
        """
        Create default profiles for verified alumni users who don't have profiles yet.
        This is a migration/fix method for existing users.
        """
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Find all verified alumni users without profiles
                query = """
                    SELECT u.id, u.email, u.created_at
                    FROM users u
                    LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                    WHERE u.role = 'alumni' 
                      AND u.is_verified = TRUE
                      AND u.is_active = TRUE
                      AND ap.id IS NULL
                """
                await cursor.execute(query)
                users_without_profiles = await cursor.fetchall()
                
                created_count = 0
                created_users = []
                
                for user in users_without_profiles:
                    try:
                        # Extract name from email
                        default_name = user['email'].split('@')[0].replace('.', ' ').replace('_', ' ').title()
                        
                        # Create basic alumni profile
                        insert_query = """
                        INSERT INTO alumni_profiles (
                            user_id, name, bio, headline, 
                            profile_completion_percentage, is_verified
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s
                        )
                        """
                        await cursor.execute(insert_query, (
                            user['id'],
                            default_name,
                            f"Alumni member at AlumUnity",
                            "AlumUnity Alumni",
                            10,  # Basic completion percentage
                            False  # Not admin-verified yet
                        ))
                        
                        created_count += 1
                        created_users.append({
                            "user_id": user['id'],
                            "email": user['email'],
                            "name": default_name
                        })
                        
                        logger.info(f"Created missing profile for user {user['id']} ({user['email']})")
                        
                    except Exception as e:
                        logger.error(f"Failed to create profile for user {user['id']}: {str(e)}")
                        continue
                
                if not conn.get_autocommit():
                    await conn.commit()
                
                return {
                    "created_count": created_count,
                    "total_missing": len(users_without_profiles),
                    "created_users": created_users
                }

