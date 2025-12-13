from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
import json
from database.connection import get_sync_db_connection
from middleware.auth_middleware import require_admin, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/badges", tags=["admin-badges"])

class BadgeCreate(BaseModel):
    name: str
    description: Optional[str] = "Badge earned"
    rarity: Optional[str] = "common"
    points: Optional[int] = 10
    requirements: Optional[dict] = None

@router.get("", dependencies=[Depends(require_admin)])
async def get_all_badges():
    """Get all badges with earned counts"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT 
                b.*,
                COUNT(DISTINCT ub.id) as earnedCount
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id
            GROUP BY b.id
            ORDER BY b.created_at DESC
        """)
        
        badges = cursor.fetchall()
        
        # Parse JSON requirements
        for badge in badges:
            if badge.get('requirements'):
                try:
                    badge['requirements'] = json.loads(badge['requirements']) if isinstance(badge['requirements'], str) else badge['requirements']
                except:
                    badge['requirements'] = {}
            
            badge['created_at'] = badge['created_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": badges
        }
    
    except Exception as e:
        logger.error(f"Error fetching badges: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", dependencies=[Depends(require_admin)])
async def create_badge(badge_data: BadgeCreate, current_user: dict = Depends(get_current_user)):
    """Create a new badge"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            INSERT INTO badges (name, description, rarity, points, requirements, icon_url)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            badge_data.name,
            badge_data.description,
            badge_data.rarity,
            badge_data.points,
            json.dumps(badge_data.requirements),
            f"https://cdn.alumni.edu/badges/{badge_data.name.lower().replace(' ', '-')}.svg"
        ))
        
        badge_id = cursor.lastrowid
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'system_config', 'badge', %s, 'Created badge')
        """, (current_user['id'], badge_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Badge created successfully",
            "data": {"id": badge_id}
        }
    
    except Exception as e:
        logger.error(f"Error creating badge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{badge_id}", dependencies=[Depends(require_admin)])
async def update_badge(badge_id: str, badge_data: BadgeCreate, current_user: dict = Depends(get_current_user)):
    """Update a badge"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            UPDATE badges
            SET name = %s, description = %s, rarity = %s, points = %s, requirements = %s
            WHERE id = %s
        """, (
            badge_data.name,
            badge_data.description,
            badge_data.rarity,
            badge_data.points,
            json.dumps(badge_data.requirements),
            badge_id
        ))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Badge not found")
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'system_config', 'badge', %s, 'Updated badge')
        """, (current_user['id'], badge_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Badge updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating badge {badge_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{badge_id}", dependencies=[Depends(require_admin)])
async def delete_badge(badge_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a badge"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Log before deletion
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'system_config', 'badge', %s, 'Deleted badge')
        """, (current_user['id'], badge_id))
        
        cursor.execute("DELETE FROM badges WHERE id = %s", (badge_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Badge not found")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Badge deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting badge {badge_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))