"""Event management routes"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import logging

from database.models import (
    EventCreate, EventUpdate, EventResponse,
    EventRSVPCreate, EventRSVPUpdate, EventRSVPResponse,
    EventAttendee
)
from services.event_service import EventService
from middleware.auth_middleware import get_current_user, require_roles

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/events", tags=["events"])


@router.post("", response_model=dict)
async def create_event(
    event_data: EventCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new event (Admin/Alumni only)"""
    try:
        # Check if user has permission to create events
        if current_user["role"] not in ["admin", "alumni"]:
            raise HTTPException(status_code=403, detail="Only admins and alumni can create events")
        
        event = await EventService.create_event(event_data, current_user["id"])
        return {
            "success": True,
            "data": event.model_dump(),
            "message": "Event created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=dict)
async def get_all_events(
    event_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_upcoming: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all events with optional filters"""
    try:
        events = await EventService.get_all_events(
            event_type=event_type,
            status=status,
            is_upcoming=is_upcoming,
            search=search,
            limit=limit,
            offset=offset
        )
        
        # Return events without fetching attendees (N+1 query fix)
        # Frontend will fetch attendees separately when viewing event details
        return {
            "success": True,
            "data": [event.model_dump() for event in events]
        }
    except Exception as e:
        logger.error(f"Error fetching events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/my-events", response_model=dict)
async def get_my_events(current_user: dict = Depends(get_current_user)):
    """Get events created by current user"""
    try:
        events = await EventService.get_events_by_creator(current_user["id"])
        return {
            "success": True,
            "data": [event.model_dump() for event in events]
        }
    except Exception as e:
        logger.error(f"Error fetching user events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}", response_model=dict)
async def get_event(event_id: str):
    """Get event details by ID"""
    try:
        event = await EventService.get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return {
            "success": True,
            "data": event.model_dump()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{event_id}", response_model=dict)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an event (Creator/Admin only)"""
    try:
        # Check if event exists
        event = await EventService.get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check permissions
        if event.created_by != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update this event")
        
        updated_event = await EventService.update_event(event_id, event_data)
        return {
            "success": True,
            "data": updated_event.model_dump() if updated_event else None,
            "message": "Event updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{event_id}", response_model=dict)
async def delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an event (Creator/Admin only)"""
    try:
        # Check if event exists
        event = await EventService.get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check permissions
        if event.created_by != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to delete this event")
        
        success = await EventService.delete_event(event_id)
        if success:
            return {
                "success": True,
                "message": "Event deleted successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Event not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# RSVP Routes

@router.post("/{event_id}/rsvp", response_model=dict)
async def create_rsvp(
    event_id: str,
    rsvp_data: EventRSVPCreate,
    current_user: dict = Depends(get_current_user)
):
    """RSVP to an event"""
    try:
        # Check if event exists
        event = await EventService.get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if event is full (for attending status)
        if rsvp_data.status.value == "attending" and event.max_attendees:
            if event.current_attendees_count >= event.max_attendees:
                raise HTTPException(status_code=400, detail="Event is full")
        
        rsvp = await EventService.create_rsvp(event_id, current_user["id"], rsvp_data)
        return {
            "success": True,
            "data": rsvp.model_dump(),
            "message": "RSVP successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating RSVP: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}/my-rsvp", response_model=dict)
async def get_my_rsvp(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's RSVP for an event"""
    try:
        rsvp = await EventService.get_user_rsvp(event_id, current_user["id"])
        return {
            "success": True,
            "data": rsvp.model_dump() if rsvp else None
        }
    except Exception as e:
        logger.error(f"Error fetching RSVP: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}/attendees", response_model=dict)
async def get_event_attendees(event_id: str):
    """Get all attendees for an event"""
    try:
        # Check if event exists
        event = await EventService.get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        attendees = await EventService.get_event_attendees(event_id)
        return {
            "success": True,
            "data": [attendee.model_dump() for attendee in attendees]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching attendees: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/registered-events", response_model=dict)
async def get_user_registered_events(
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get all events user has RSVP'd to"""
    try:
        events = await EventService.get_user_events(current_user["id"], status)
        return {
            "success": True,
            "data": [event.model_dump() for event in events]
        }
    except Exception as e:
        logger.error(f"Error fetching user events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
