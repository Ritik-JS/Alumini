#!/usr/bin/env python
"""Test event creation endpoint"""
import asyncio
import json
from datetime import datetime, timedelta
from database.models import EventCreate, EventType, EventStatus

# Test data
test_data = {
    "title": "Web Development Workshop",
    "description": "Learn modern web development with React and FastAPI",
    "event_type": "workshop",
    "location": "Main Campus Room 101",
    "is_virtual": False,
    "meeting_link": None,
    "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
    "end_date": (datetime.now() + timedelta(days=7, hours=2)).isoformat(),
    "registration_deadline": (datetime.now() + timedelta(days=5)).isoformat(),
    "max_attendees": 50,
    "banner_image": "https://example.com/banner.jpg",
    "status": "published"
}

print("Test 1: Valid event creation data")
print(json.dumps(test_data, indent=2))
try:
    event = EventCreate(**test_data)
    print("✓ Validation passed!")
    print(f"  Event: {event.title}")
except Exception as e:
    print(f"✗ Validation failed: {e}")

print("\n" + "="*60 + "\n")

# Test with empty strings (what frontend sends initially)
test_data_with_empty = {
    "title": "Web Development Workshop",
    "description": "Learn modern web development with React and FastAPI",
    "event_type": "workshop",
    "location": "Main Campus Room 101",
    "is_virtual": False,
    "meeting_link": "",  # Empty string
    "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
    "end_date": (datetime.now() + timedelta(days=7, hours=2)).isoformat(),
    "registration_deadline": (datetime.now() + timedelta(days=5)).isoformat(),
    "max_attendees": 50,
    "banner_image": "",  # Empty string
    "status": "published"
}

print("Test 2: Event with empty optional fields")
print(json.dumps(test_data_with_empty, indent=2))
try:
    event = EventCreate(**test_data_with_empty)
    print("✓ Validation passed!")
    print(f"  Event: {event.title}")
    print(f"  Meeting link: {event.meeting_link}")
    print(f"  Banner image: {event.banner_image}")
except Exception as e:
    print(f"✗ Validation failed: {e}")

print("\n" + "="*60 + "\n")

# Test virtual event
test_data_virtual = {
    "title": "Online Networking Event",
    "description": "Connect with alumni from around the world",
    "event_type": "networking",
    "location": None,
    "is_virtual": True,
    "meeting_link": "https://zoom.us/j/123456789",
    "start_date": (datetime.now() + timedelta(days=3)).isoformat(),
    "end_date": (datetime.now() + timedelta(days=3, hours=1)).isoformat(),
    "registration_deadline": None,
    "max_attendees": 100,
    "banner_image": None,
    "status": "published"
}

print("Test 3: Virtual event with minimal fields")
print(json.dumps(test_data_virtual, indent=2))
try:
    event = EventCreate(**test_data_virtual)
    print("✓ Validation passed!")
    print(f"  Event: {event.title}")
    print(f"  Is virtual: {event.is_virtual}")
    print(f"  Meeting link: {event.meeting_link}")
except Exception as e:
    print(f"✗ Validation failed: {e}")
