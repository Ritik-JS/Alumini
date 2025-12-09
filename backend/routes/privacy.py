"""Privacy Settings routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
import logging
import aiomysql

from database.connection import get_db_pool
from middleware.auth_middleware import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/privacy", tags=["Privacy"])


@router.get("/settings", response_model=Dict)
async def get_privacy_settings(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's privacy settings
    
    Returns:
    - profile_visibility: public, alumni, connections, private
    - show_email: boolean
    - show_phone: boolean
    - allow_messages: boolean
    - allow_mentorship_requests: boolean
    - show_in_directory: boolean
    - show_activity: boolean
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get privacy settings
                await cursor.execute("""
                    SELECT 
                        profile_visibility,
                        show_email,
                        show_phone,
                        allow_messages,
                        allow_mentorship_requests,
                        show_in_directory,
                        show_activity
                    FROM privacy_settings
                    WHERE user_id = %s
                """, (current_user['id'],))
                
                settings = await cursor.fetchone()
                
                # If no settings exist, create default settings
                if not settings:
                    await cursor.execute("""
                        INSERT INTO privacy_settings (
                            user_id,
                            profile_visibility,
                            show_email,
                            show_phone,
                            allow_messages,
                            allow_mentorship_requests,
                            show_in_directory,
                            show_activity
                        ) VALUES (%s, 'public', FALSE, FALSE, TRUE, TRUE, TRUE, TRUE)
                    """, (current_user['id'],))
                    await conn.commit()
                    
                    # Return default settings
                    settings = {
                        'profile_visibility': 'public',
                        'show_email': False,
                        'show_phone': False,
                        'allow_messages': True,
                        'allow_mentorship_requests': True,
                        'show_in_directory': True,
                        'show_activity': True
                    }
                
                return {
                    "success": True,
                    "data": settings
                }
    except Exception as e:
        logger.error(f"Error getting privacy settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve privacy settings"
        )


@router.put("/settings", response_model=Dict)
async def update_privacy_settings(
    settings: Dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user's privacy settings
    
    Body:
    - profile_visibility (optional): public, alumni, connections, private
    - show_email (optional): boolean
    - show_phone (optional): boolean
    - allow_messages (optional): boolean
    - allow_mentorship_requests (optional): boolean
    - show_in_directory (optional): boolean
    - show_activity (optional): boolean
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build update query dynamically based on provided fields
                update_fields = []
                values = []
                
                allowed_fields = [
                    'profile_visibility',
                    'show_email',
                    'show_phone',
                    'allow_messages',
                    'allow_mentorship_requests',
                    'show_in_directory',
                    'show_activity'
                ]
                
                for field in allowed_fields:
                    if field in settings:
                        update_fields.append(f"{field} = %s")
                        values.append(settings[field])
                
                if not update_fields:
                    raise ValueError("No valid fields to update")
                
                values.append(current_user['id'])
                
                # Check if settings exist
                await cursor.execute("""
                    SELECT id FROM privacy_settings WHERE user_id = %s
                """, (current_user['id'],))
                
                existing = await cursor.fetchone()
                
                if existing:
                    # Update existing settings
                    query = f"""
                        UPDATE privacy_settings 
                        SET {', '.join(update_fields)}
                        WHERE user_id = %s
                    """
                    await cursor.execute(query, values)
                else:
                    # Insert new settings with defaults
                    await cursor.execute("""
                        INSERT INTO privacy_settings (
                            user_id,
                            profile_visibility,
                            show_email,
                            show_phone,
                            allow_messages,
                            allow_mentorship_requests,
                            show_in_directory,
                            show_activity
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        current_user['id'],
                        settings.get('profile_visibility', 'public'),
                        settings.get('show_email', False),
                        settings.get('show_phone', False),
                        settings.get('allow_messages', True),
                        settings.get('allow_mentorship_requests', True),
                        settings.get('show_in_directory', True),
                        settings.get('show_activity', True)
                    ))
                
                await conn.commit()
                
                # Get updated settings
                await cursor.execute("""
                    SELECT 
                        profile_visibility,
                        show_email,
                        show_phone,
                        allow_messages,
                        allow_mentorship_requests,
                        show_in_directory,
                        show_activity
                    FROM privacy_settings
                    WHERE user_id = %s
                """, (current_user['id'],))
                
                updated_settings = await cursor.fetchone()
                
                return {
                    "success": True,
                    "message": "Privacy settings updated successfully",
                    "data": updated_settings
                }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating privacy settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update privacy settings"
        )
