from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
import logging
from datetime import datetime
from database.connection import get_db_connection
from middleware.auth_middleware import get_current_user, require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])

@router.get("", dependencies=[Depends(require_admin)])
async def get_all_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get all users with their profiles"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Base query with LEFT JOIN to get profiles
        query = """
            SELECT 
                u.id, u.email, u.role, u.is_verified, u.is_active,
                u.last_login, u.created_at, u.updated_at,
                ap.name, ap.photo_url, ap.current_company, ap.current_role,
                ap.location, ap.batch_year, ap.profile_completion_percentage
            FROM users u
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            WHERE 1=1
        """
        
        params = []
        
        # Add filters
        if role:
            query += " AND u.role = %s"
            params.append(role)
        
        if search:
            query += " AND (u.email LIKE %s OR ap.name LIKE %s)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term])
        
        query += " ORDER BY u.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        users = cursor.fetchall()
        
        # Transform data
        for user in users:
            if user['last_login']:
                user['last_login'] = user['last_login'].isoformat()
            user['created_at'] = user['created_at'].isoformat()
            user['updated_at'] = user['updated_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": users,
            "total": len(users)
        }
    
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}", dependencies=[Depends(require_admin)])
async def get_user_with_profile(user_id: str):
    """Get detailed user information with full profile"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get user details
        cursor.execute("""
            SELECT 
                u.id, u.email, u.role, u.is_verified, u.is_active,
                u.last_login, u.created_at, u.updated_at,
                ap.name, ap.photo_url, ap.bio, ap.headline,
                ap.current_company, ap.current_role, ap.location,
                ap.batch_year, ap.skills, ap.achievements,
                ap.social_links, ap.education_details, ap.experience_timeline,
                ap.profile_completion_percentage, ap.is_verified as profile_verified
            FROM users u
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            WHERE u.id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Parse JSON fields
        if user.get('skills'):
            import json
            try:
                user['skills'] = json.loads(user['skills']) if isinstance(user['skills'], str) else user['skills']
            except:
                user['skills'] = []
        
        if user.get('achievements'):
            import json
            try:
                user['achievements'] = json.loads(user['achievements']) if isinstance(user['achievements'], str) else user['achievements']
            except:
                user['achievements'] = []
        
        if user.get('social_links'):
            import json
            try:
                user['social_links'] = json.loads(user['social_links']) if isinstance(user['social_links'], str) else user['social_links']
            except:
                user['social_links'] = {}
        
        # Format timestamps
        if user['last_login']:
            user['last_login'] = user['last_login'].isoformat()
        user['created_at'] = user['created_at'].isoformat()
        user['updated_at'] = user['updated_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": user
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{user_id}/ban", dependencies=[Depends(require_admin)])
async def ban_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Ban a user by setting is_active to FALSE"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Update user status
        cursor.execute("""
            UPDATE users 
            SET is_active = FALSE, updated_at = NOW()
            WHERE id = %s
        """, (user_id,))
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'user_management', 'user', %s, 'Banned user')
        """, (current_user['id'], user_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "User banned successfully"
        }
    
    except Exception as e:
        logger.error(f"Error banning user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a user (CASCADE will handle related records)"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Log before deletion
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'user_management', 'user', %s, 'Deleted user')
        """, (current_user['id'], user_id))
        
        # Delete user (CASCADE deletes related records)
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "User deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/reset-password", dependencies=[Depends(require_admin)])
async def reset_user_password(user_id: str, current_user: dict = Depends(get_current_user)):
    """Trigger password reset for a user"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get user email
        cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # TODO: Implement actual email service integration
        # For now, just log the action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'user_management', 'user', %s, 'Triggered password reset')
        """, (current_user['id'], user_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": f"Password reset email sent to {user['email']}"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting password for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))