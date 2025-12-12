from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging
from database.connection import get_sync_db_connection
from middleware.auth_middleware import require_admin, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/events", tags=["admin-events"])

@router.get("", dependencies=[Depends(require_admin)])
async def get_all_events(
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get all events with attendee counts"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        query = """
            SELECT 
                e.*,
                u.email as creator_email,
                COUNT(DISTINCT er.id) as current_attendees_count
            FROM events e
            LEFT JOIN users u ON e.created_by = u.id
            LEFT JOIN event_rsvps er ON e.id = er.event_id AND er.status = 'attending'
            WHERE 1=1
        """
        
        params = []
        
        if status:
            query += " AND e.status = %s"
            params.append(status)
        
        if search:
            query += " AND (e.title LIKE %s OR e.location LIKE %s)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term])
        
        query += " GROUP BY e.id ORDER BY e.start_date DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        events = cursor.fetchall()
        
        # Format dates
        for event in events:
            event['start_date'] = event['start_date'].isoformat()
            event['end_date'] = event['end_date'].isoformat()
            if event.get('registration_deadline'):
                event['registration_deadline'] = event['registration_deadline'].isoformat()
            event['created_at'] = event['created_at'].isoformat()
            event['updated_at'] = event['updated_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": events
        }
    
    except Exception as e:
        logger.error(f"Error fetching events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{event_id}", dependencies=[Depends(require_admin)])
async def get_event_by_id(event_id: str):
    """Get detailed event information"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT 
                e.*,
                u.email as creator_email,
                u.id as creator_id
            FROM events e
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.id = %s
        """, (event_id,))
        
        event = cursor.fetchone()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get attendees
        cursor.execute("""
            SELECT 
                er.status,
                u.id as user_id,
                u.email,
                u.role,
                ap.name,
                ap.photo_url
            FROM event_rsvps er
            JOIN users u ON er.user_id = u.id
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            WHERE er.event_id = %s
        """, (event_id,))
        
        attendees = cursor.fetchall()
        event['attendees'] = attendees
        
        # Format dates
        event['start_date'] = event['start_date'].isoformat()
        event['end_date'] = event['end_date'].isoformat()
        if event.get('registration_deadline'):
            event['registration_deadline'] = event['registration_deadline'].isoformat()
        event['created_at'] = event['created_at'].isoformat()
        event['updated_at'] = event['updated_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": event
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{event_id}/attendees", dependencies=[Depends(require_admin)])
async def get_event_attendees(event_id: str):
    """Get list of attendees for an event"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT 
                er.status,
                er.rsvp_date,
                u.id as user_id,
                u.email,
                u.role,
                ap.name,
                ap.photo_url,
                ap.current_company,
                ap.current_role
            FROM event_rsvps er
            JOIN users u ON er.user_id = u.id
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            WHERE er.event_id = %s
            ORDER BY er.rsvp_date DESC
        """, (event_id,))
        
        attendees = cursor.fetchall()
        
        # Format dates
        for attendee in attendees:
            attendee['rsvp_date'] = attendee['rsvp_date'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": attendees
        }
    
    except Exception as e:
        logger.error(f"Error fetching attendees for event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{event_id}", dependencies=[Depends(require_admin)])
async def update_event(event_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    """Update event details"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        update_fields = []
        params = []
        
        if 'status' in update_data:
            update_fields.append("status = %s")
            params.append(update_data['status'])
        
        if 'title' in update_data:
            update_fields.append("title = %s")
            params.append(update_data['title'])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = NOW()")
        params.append(event_id)
        
        query = f"UPDATE events SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, params)
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'content_moderation', 'event', %s, 'Updated event')
        """, (current_user['id'], event_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Event updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{event_id}", dependencies=[Depends(require_admin)])
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an event"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Log before deletion
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'content_moderation', 'event', %s, 'Deleted event')
        """, (current_user['id'], event_id))
        
        cursor.execute("DELETE FROM events WHERE id = %s", (event_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Event deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))