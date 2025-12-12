"""Event management service for handling event CRUD operations"""
import logging
import uuid
from typing import Optional
from datetime import datetime
import json

from database.connection import get_db_pool
from database.models import (
    EventCreate, EventUpdate, EventResponse, 
    EventRSVPCreate, EventRSVPUpdate, EventRSVPResponse,
    EventAttendee, EventWithRSVP
)

logger = logging.getLogger(__name__)


class EventService:
    """Service for event management operations"""
    
    @staticmethod
    async def create_event(event_data: EventCreate, created_by: str) -> EventResponse:
        """Create a new event"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Generate UUID for the event
                event_id = str(uuid.uuid4())
                
                query = """
                INSERT INTO events (
                    id, title, description, event_type, location, is_virtual,
                    meeting_link, start_date, end_date, registration_deadline,
                    max_attendees, banner_image, created_by, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                await cursor.execute(query, (
                    event_id,
                    event_data.title,
                    event_data.description,
                    event_data.event_type.value,
                    event_data.location,
                    event_data.is_virtual,
                    event_data.meeting_link,
                    event_data.start_date,
                    event_data.end_date,
                    event_data.registration_deadline,
                    event_data.max_attendees,
                    event_data.banner_image,
                    created_by,
                    event_data.status.value
                ))
                await conn.commit()
                
                # Fetch the created event
                await cursor.execute("SELECT * FROM events WHERE id = %s", (event_id,))
                event_row = await cursor.fetchone()
                
                if event_row:
                    return EventService._event_from_row(event_row, cursor)
                
        raise ValueError("Failed to create event")
    
    @staticmethod
    async def get_event_by_id(event_id: str) -> Optional[EventResponse]:
        """Get event by ID"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                query = "SELECT * FROM events WHERE id = %s"
                await cursor.execute(query, (event_id,))
                event_row = await cursor.fetchone()
                
                if event_row:
                    # Increment views count
                    await cursor.execute(
                        "UPDATE events SET views_count = views_count + 1 WHERE id = %s",
                        (event_id,)
                    )
                    await conn.commit()
                    return EventService._event_from_row(event_row, cursor)
                
        return None
    
    @staticmethod
    async def get_all_events(
        event_type: Optional[str] = None,
        status: Optional[str] = None,
        is_upcoming: Optional[bool] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[EventResponse]:
        """Get all events with filters"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                query = "SELECT * FROM events WHERE 1=1"
                params = []
                
                if event_type:
                    query += " AND event_type = %s"
                    params.append(event_type)
                
                if status:
                    query += " AND status = %s"
                    params.append(status)
                
                if is_upcoming is not None:
                    if is_upcoming:
                        query += " AND start_date >= NOW()"
                    else:
                        query += " AND start_date < NOW()"
                
                if search:
                    query += " AND (title LIKE %s OR description LIKE %s)"
                    search_param = f"%{search}%"
                    params.extend([search_param, search_param])
                
                query += " ORDER BY start_date DESC LIMIT %s OFFSET %s"
                params.extend([limit, offset])
                
                await cursor.execute(query, tuple(params))
                event_rows = await cursor.fetchall()
                
                return [EventService._event_from_row(row, cursor) for row in event_rows]
    
    @staticmethod
    async def update_event(event_id: str, event_data: EventUpdate) -> Optional[EventResponse]:
        """Update an event"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Build dynamic update query
                update_fields = []
                params = []
                
                if event_data.title is not None:
                    update_fields.append("title = %s")
                    params.append(event_data.title)
                
                if event_data.description is not None:
                    update_fields.append("description = %s")
                    params.append(event_data.description)
                
                if event_data.event_type is not None:
                    update_fields.append("event_type = %s")
                    params.append(event_data.event_type.value)
                
                if event_data.location is not None:
                    update_fields.append("location = %s")
                    params.append(event_data.location)
                
                if event_data.is_virtual is not None:
                    update_fields.append("is_virtual = %s")
                    params.append(event_data.is_virtual)
                
                if event_data.meeting_link is not None:
                    update_fields.append("meeting_link = %s")
                    params.append(event_data.meeting_link)
                
                if event_data.start_date is not None:
                    update_fields.append("start_date = %s")
                    params.append(event_data.start_date)
                
                if event_data.end_date is not None:
                    update_fields.append("end_date = %s")
                    params.append(event_data.end_date)
                
                if event_data.registration_deadline is not None:
                    update_fields.append("registration_deadline = %s")
                    params.append(event_data.registration_deadline)
                
                if event_data.max_attendees is not None:
                    update_fields.append("max_attendees = %s")
                    params.append(event_data.max_attendees)
                
                if event_data.banner_image is not None:
                    update_fields.append("banner_image = %s")
                    params.append(event_data.banner_image)
                
                if event_data.status is not None:
                    update_fields.append("status = %s")
                    params.append(event_data.status.value)
                
                if not update_fields:
                    return await EventService.get_event_by_id(event_id)
                
                query = f"UPDATE events SET {', '.join(update_fields)} WHERE id = %s"
                params.append(event_id)
                
                await cursor.execute(query, tuple(params))
                await conn.commit()
                
                return await EventService.get_event_by_id(event_id)
    
    @staticmethod
    async def delete_event(event_id: str) -> bool:
        """Delete an event"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM events WHERE id = %s", (event_id,))
                await conn.commit()
                return cursor.rowcount > 0
    
    @staticmethod
    async def get_events_by_creator(creator_id: str) -> list[EventResponse]:
        """Get all events created by a user"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                query = "SELECT * FROM events WHERE created_by = %s ORDER BY created_at DESC"
                await cursor.execute(query, (creator_id,))
                event_rows = await cursor.fetchall()
                
                return [EventService._event_from_row(row, cursor) for row in event_rows]
    
    # RSVP Methods
    
    @staticmethod
    async def create_rsvp(event_id: str, user_id: str, rsvp_data: EventRSVPCreate) -> EventRSVPResponse:
        """Create or update an RSVP for an event"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Check if RSVP already exists
                await cursor.execute(
                    "SELECT * FROM event_rsvps WHERE event_id = %s AND user_id = %s",
                    (event_id, user_id)
                )
                existing_rsvp = await cursor.fetchone()
                
                if existing_rsvp:
                    # Update existing RSVP
                    await cursor.execute(
                        "UPDATE event_rsvps SET status = %s WHERE event_id = %s AND user_id = %s",
                        (rsvp_data.status.value, event_id, user_id)
                    )
                else:
                    # Create new RSVP
                    await cursor.execute(
                        "INSERT INTO event_rsvps (event_id, user_id, status) VALUES (%s, %s, %s)",
                        (event_id, user_id, rsvp_data.status.value)
                    )
                
                await conn.commit()
                
                # Fetch the RSVP
                await cursor.execute(
                    "SELECT * FROM event_rsvps WHERE event_id = %s AND user_id = %s",
                    (event_id, user_id)
                )
                rsvp_row = await cursor.fetchone()
                
                if rsvp_row:
                    return EventService._rsvp_from_row(rsvp_row, cursor)
                
        raise ValueError("Failed to create RSVP")
    
    @staticmethod
    async def get_user_rsvp(event_id: str, user_id: str) -> Optional[EventRSVPResponse]:
        """Get user's RSVP for an event"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT * FROM event_rsvps WHERE event_id = %s AND user_id = %s",
                    (event_id, user_id)
                )
                rsvp_row = await cursor.fetchone()
                
                if rsvp_row:
                    return EventService._rsvp_from_row(rsvp_row, cursor)
                
        return None
    
    @staticmethod
    async def get_user_events(user_id: str, status_filter: Optional[str] = None) -> list[EventResponse]:
        """Get all events user has RSVP'd to"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                query = """
                SELECT e.* FROM events e
                INNER JOIN event_rsvps r ON e.id = r.event_id
                WHERE r.user_id = %s
                """
                params = [user_id]
                
                if status_filter:
                    query += " AND r.status = %s"
                    params.append(status_filter)
                
                query += " ORDER BY e.start_date DESC"
                
                await cursor.execute(query, tuple(params))
                event_rows = await cursor.fetchall()
                
                return [EventService._event_from_row(row, cursor) for row in event_rows]
    
    @staticmethod
    async def get_event_attendees(event_id: str) -> list[EventAttendee]:
        """Get all attendees for an event"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                query = """
                SELECT 
                    r.id, r.event_id, r.user_id, r.status, r.rsvp_date,
                    u.email as user_email,
                    COALESCE(ap.name, u.email) as user_name,
                    ap.photo_url as user_photo_url
                FROM event_rsvps r
                INNER JOIN users u ON r.user_id = u.id
                LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                WHERE r.event_id = %s AND r.status = 'attending'
                ORDER BY r.rsvp_date DESC
                """
                await cursor.execute(query, (event_id,))
                rows = await cursor.fetchall()
                
                attendees = []
                for row in rows:
                    attendees.append(EventAttendee(
                        id=row[0],
                        event_id=row[1],
                        user_id=row[2],
                        status=row[3],
                        rsvp_date=row[4],
                        user_email=row[5],
                        user_name=row[6],
                        user_photo_url=row[7]
                    ))
                
                return attendees
    
    @staticmethod
    def _event_from_row(row: tuple, cursor) -> EventResponse:
        """Convert database row to EventResponse"""
        columns = [desc[0] for desc in cursor.description]
        event_dict = dict(zip(columns, row))
        return EventResponse(**event_dict)
    
    @staticmethod
    def _rsvp_from_row(row: tuple, cursor) -> EventRSVPResponse:
        """Convert database row to EventRSVPResponse"""
        columns = [desc[0] for desc in cursor.description]
        rsvp_dict = dict(zip(columns, row))
        return EventRSVPResponse(**rsvp_dict)
