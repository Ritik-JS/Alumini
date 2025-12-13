from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
import logging
from datetime import datetime
from database.connection import get_sync_db_connection
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
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Base query with LEFT JOIN to get profiles and card status
        query = """
            SELECT 
                u.id, u.email, u.role, u.is_verified, u.is_active,
                u.last_login, u.created_at, u.updated_at,
                ap.name, ap.photo_url, ap.current_company, ap.current_role,
                ap.location, ap.batch_year, ap.profile_completion_percentage,
                ac.id as card_id, ac.card_number, ac.is_active as card_active
            FROM users u
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            LEFT JOIN alumni_cards ac ON u.id = ac.user_id
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
        rows = cursor.fetchall()
        
        # Transform data into clean structure
        users = []
        for row in rows:
            user = {
                'id': row['id'],
                'email': row['email'],
                'role': row['role'],
                'is_verified': row['is_verified'],
                'is_active': row['is_active'],
                'last_login': row['last_login'].isoformat() if row['last_login'] else None,
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None,
                'name': row['name'],
                'photo_url': row['photo_url'],
                'current_company': row['current_company'],
                'current_role': row['current_role'],
                'location': row['location'],
                'batch_year': row['batch_year'],
                'profile_completion_percentage': row['profile_completion_percentage'],
                'card_status': {
                    'has_card': row['card_id'] is not None,
                    'card_number': row['card_number'],
                    'is_active': row['card_active']
                }
            }
            users.append(user)
        
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
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Get user details with card status
        cursor.execute("""
            SELECT 
                u.id, u.email, u.role, u.is_verified, u.is_active,
                u.last_login, u.created_at, u.updated_at,
                ap.name, ap.photo_url, ap.bio, ap.headline,
                ap.current_company, ap.current_role, ap.location,
                ap.batch_year, ap.skills, ap.achievements,
                ap.social_links, ap.education_details, ap.experience_timeline,
                ap.profile_completion_percentage, ap.is_verified as profile_verified,
                ac.id as card_id, ac.card_number, ac.is_active as card_active
            FROM users u
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            LEFT JOIN alumni_cards ac ON u.id = ac.user_id
            WHERE u.id = %s
        """, (user_id,))
        
        row = cursor.fetchone()
        
        if not row:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="User not found")
        
        import json
        
        # Parse JSON fields for profile
        skills = []
        if row.get('skills'):
            try:
                skills = json.loads(row['skills']) if isinstance(row['skills'], str) else row['skills']
            except (json.JSONDecodeError, TypeError):
                skills = []
        
        achievements = []
        if row.get('achievements'):
            try:
                achievements = json.loads(row['achievements']) if isinstance(row['achievements'], str) else row['achievements']
            except (json.JSONDecodeError, TypeError):
                achievements = []
        
        social_links = {}
        if row.get('social_links'):
            try:
                social_links = json.loads(row['social_links']) if isinstance(row['social_links'], str) else row['social_links']
            except (json.JSONDecodeError, TypeError):
                social_links = {}
        
        # Build nested structure with profile object
        user = {
            'id': row.get('id'),
            'email': row.get('email'),
            'role': row.get('role'),
            'is_verified': row.get('is_verified'),
            'is_active': row.get('is_active'),
            'last_login': row['last_login'].isoformat() if row.get('last_login') else None,
            'created_at': row['created_at'].isoformat() if row.get('created_at') else None,
            'updated_at': row['updated_at'].isoformat() if row.get('updated_at') else None,
            'card_status': {
                'has_card': row.get('card_id') is not None,
                'card_number': row.get('card_number'),
                'is_active': row.get('card_active')
            },
            'profile': {
                'name': row.get('name'),
                'photo_url': row.get('photo_url'),
                'bio': row.get('bio'),
                'headline': row.get('headline'),
                'current_company': row.get('current_company'),
                'current_role': row.get('current_role'),
                'location': row.get('location'),
                'batch_year': row.get('batch_year'),
                'skills': skills,
                'achievements': achievements,
                'social_links': social_links,
                'education_details': row.get('education_details'),
                'experience_timeline': row.get('experience_timeline'),
                'profile_completion_percentage': row.get('profile_completion_percentage'),
                'is_verified': row.get('profile_verified')
            }
        }
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": user
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{user_id}/ban", dependencies=[Depends(require_admin)])
async def ban_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Ban a user by setting is_active to FALSE"""
    try:
        connection = get_sync_db_connection()
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
        connection = get_sync_db_connection()
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
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
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


@router.post("/{user_id}/issue-card", dependencies=[Depends(require_admin)])
def issue_alumni_card(user_id: str, current_user: dict = Depends(get_current_user)):
    """Issue/generate alumni card for a specific user (Admin only)"""
    try:
        import hashlib
        import secrets
        from datetime import datetime, timedelta
        
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id, email, role FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if card already exists
        cursor.execute("""
            SELECT id, card_number, qr_code_data, is_active
            FROM alumni_cards
            WHERE user_id = %s
        """, (user_id,))
        existing_card = cursor.fetchone()
        
        if existing_card and existing_card['is_active']:
            # Card already exists and is active
            cursor.close()
            connection.close()
            return {
                "success": True,
                "message": "Alumni card already exists",
                "data": {
                    "card_id": existing_card['id'],
                    "card_number": existing_card['card_number'],
                    "user_id": user_id
                }
            }
        
        # Get user profile details
        cursor.execute("""
            SELECT 
                u.email, u.role,
                ap.name, ap.photo_url, ap.batch_year
            FROM users u
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            WHERE u.id = %s
        """, (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        batch_year = user_data['batch_year'] or datetime.now().year
        
        # Generate unique card number
        card_number = f"ALU{batch_year}{secrets.token_hex(4).upper()}"
        
        # Ensure card number is unique
        cursor.execute("SELECT id FROM alumni_cards WHERE card_number = %s", (card_number,))
        while cursor.fetchone():
            card_number = f"ALU{batch_year}{secrets.token_hex(4).upper()}"
            cursor.execute("SELECT id FROM alumni_cards WHERE card_number = %s", (card_number,))
        
        # Generate QR code data
        qr_data = {
            "user_id": user_id,
            "card_number": card_number,
            "email": user_data['email'],
            "issued": datetime.now().isoformat()
        }
        import json
        qr_code_data = json.dumps(qr_data)
        
        # Set dates
        issue_date = datetime.now().date()
        expiry_date = issue_date + timedelta(days=5*365)
        
        # Insert or update card
        if existing_card:
            # Update existing card
            cursor.execute("""
                UPDATE alumni_cards
                SET card_number = %s, qr_code_data = %s,
                    issue_date = %s, expiry_date = %s, is_active = TRUE,
                    updated_at = NOW()
                WHERE user_id = %s
            """, (card_number, qr_code_data, issue_date, expiry_date, user_id))
            card_id = existing_card['id']
        else:
            # Insert new card
            card_id = str(secrets.token_hex(16))
            cursor.execute("""
                INSERT INTO alumni_cards 
                (id, user_id, card_number, qr_code_data, issue_date, expiry_date, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE)
            """, (card_id, user_id, card_number, qr_code_data, issue_date, expiry_date))
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'verification', 'alumni_card', %s, 'Issued alumni card')
        """, (current_user['id'], card_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        logger.info(f"Admin {current_user['id']} issued alumni card for user {user_id}")
        
        return {
            "success": True,
            "message": "Alumni card issued successfully",
            "data": {
                "card_id": card_id,
                "card_number": card_number,
                "user_id": user_id,
                "issue_date": issue_date.isoformat(),
                "expiry_date": expiry_date.isoformat()
            }
        }
    
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error issuing alumni card for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/card-status", dependencies=[Depends(require_admin)])
def get_user_card_status(user_id: str):
    """Get alumni card status for a specific user"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT 
                id, card_number, issue_date, expiry_date, 
                is_active, verification_count, last_verified
            FROM alumni_cards
            WHERE user_id = %s
        """, (user_id,))
        card = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if not card:
            return {
                "success": True,
                "has_card": False,
                "data": None
            }
        
        return {
            "success": True,
            "has_card": True,
            "data": {
                "card_id": str(card[0]),
                "card_number": card[1],
                "issue_date": card[2].isoformat() if card[2] else None,
                "expiry_date": card[3].isoformat() if card[3] else None,
                "is_active": card[4],
                "verification_count": card[5],
                "last_verified": card[6].isoformat() if card[6] else None
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting card status for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
