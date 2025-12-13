"# Events Pages Implementation Fix Plan

## Problem Analysis

After analyzing all event pages in `/app/frontend/src/page/events/` and the backend services, I've identified the following issues that need to be fixed:

---

## Issues Identified

### 1. **Backend API Route Ordering Issue**
**Location:** `/app/backend/routes/events.py`
**Problem:** 
- The route `/api/events/my-events` (line 158) is defined AFTER the route `/api/events/{event_id}` (line 78)
- FastAPI matches routes in order, so \"my-events\" will be treated as an `event_id` parameter
- This causes 404 errors when trying to fetch user's events

**Fix:**
- Move `/api/events/my-events` route BEFORE `/api/events/{event_id}` route
- More specific routes should be defined before parameterized routes

---

### 2. **Event Attendees Query Missing Non-Alumni Users**
**Location:** `/app/backend/services/event_service.py`, line 308-320
**Problem:**
- The query only LEFT JOINs with `alumni_profiles` table
- Students, recruiters, and admins who RSVP'd won't appear in attendees list because they don't have alumni profiles
- Query needs to fetch user data from base `users` table for all user types

**Current Query:**
```sql
SELECT 
    r.id, r.event_id, r.user_id, r.status, r.rsvp_date,
    u.email as user_email,
    COALESCE(ap.name, u.email) as user_name,
    ap.photo_url as user_photo_url
FROM event_rsvps r
INNER JOIN users u ON r.user_id = u.id
LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
WHERE r.event_id = %s AND r.status = 'attending'
```

**Issue:** Missing fields needed by frontend - `user` object and `profile` object

**Fix:**
- Return complete user object and profile object
- Update EventAttendee model to include user role, profile data
- Query should return nested structure expected by frontend

---

### 3. **Status Filter Mapping Issue**
**Location:** `/app/frontend/src/page/events/Events.jsx`, line 38-40
**Problem:**
- Frontend sends `status: \"upcoming\"` or `status: \"past\"` in filters
- Backend expects `is_upcoming: boolean` parameter, not `status`
- Backend `status` parameter expects event status like 'published', 'cancelled', 'completed'

**Frontend Code:**
```javascript
const filters = {
    status: activeTab,  // \"upcoming\" or \"past\"
    search: searchTerm
};
```

**Backend expects:**
```python
is_upcoming: Optional[bool] = None
status: Optional[str] = None  # expects 'published', 'draft', 'cancelled', 'completed'
```

**Fix:**
- Map `status: \"upcoming\"` to `is_upcoming: True, status: \"published\"`
- Map `status: \"past\"` to `is_upcoming: False`
- Update frontend service to send correct parameters

---

### 4. **Event Type Filter Not Working**
**Location:** `/app/frontend/src/page/events/Events.jsx`, line 42-44
**Problem:**
- Frontend sends `type` in filters but backend expects `event_type`

**Frontend Code:**
```javascript
if (selectedType !== 'all') {
    filters.type = selectedType;
}
```

**Backend expects:**
```python
event_type: Optional[str] = None
```

**Fix:**
- Change `filters.type` to `filters.event_type` in frontend

---

### 5. **Missing User and Profile Data in Attendees**
**Location:** `/app/backend/services/event_service.py`, EventAttendee model
**Problem:**
- Frontend EventAttendees.jsx expects `attendee.user` and `attendee.profile` objects
- Backend only returns flat fields in EventAttendee model
- Frontend code accesses `attendee.profile?.name`, `attendee.user?.role`, etc.

**Frontend Code (EventAttendees.jsx, line 103-108):**
```javascript
const profile = attendee.profile;
const user = attendee.user;
const name = profile?.name || user?.email || 'Anonymous';
const photo = profile?.photo_url;
const role = user?.role || 'user';
```

**Current EventAttendee Model:**
```python
class EventAttendee(BaseModel):
    id: str
    event_id: str
    user_id: str
    status: str
    rsvp_date: datetime
    user_name: str
    user_email: str
    user_photo_url: Optional[str] = None
```

**Fix:**
- Update EventAttendee model to include nested `user` and `profile` objects
- Update query to return complete user and profile data

---

### 6. **Date Serialization Issues**
**Problem:**
- Python datetime objects might not serialize properly to JSON
- Frontend expects ISO format strings for dates

**Fix:**
- Ensure all datetime fields are properly serialized in EventResponse model
- Use Pydantic's JSON encoders for datetime fields

---

## Implementation Plan

### Phase 1: Backend API Route Fixes

**File:** `/app/backend/routes/events.py`

1. **Move `/api/events/my-events` route before `/{event_id}` route**
   - Cut lines 158-169
   - Paste before line 78
   - This ensures specific routes match before parameterized ones

2. **Fix route path from `/my-events` to `/user/my-events`**
   - Change `@router.get(\"/my-events\")` to `@router.get(\"/user/my-events\")`
   - This makes the route structure clearer and avoids conflicts

---

### Phase 2: Backend Service Fixes

**File:** `/app/backend/services/event_service.py`

1. **Update `get_event_attendees()` method (lines 303-336)**
   - Expand query to return complete user and profile data
   - Include user role, all profile fields
   - Return nested structure

**New Query:**
```sql
SELECT 
    r.id, r.event_id, r.user_id, r.status, r.rsvp_date,
    u.id as user_id_inner, u.email, u.role, u.is_verified, u.is_active,
    ap.id as profile_id, ap.name, ap.photo_url, ap.headline, 
    ap.current_company, ap.current_role, ap.location, ap.batch_year,
    ap.skills, ap.bio
FROM event_rsvps r
INNER JOIN users u ON r.user_id = u.id
LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
WHERE r.event_id = %s AND r.status = 'attending'
ORDER BY r.rsvp_date DESC
```

2. **Update EventAttendee model construction**
   - Parse query results into nested user and profile objects
   - Handle NULL profile data for non-alumni users

---

### Phase 3: Backend Model Updates

**File:** `/app/backend/database/models.py`

1. **Update EventAttendee model (lines 724-734)**
   
**New Model:**
```python
class EventAttendeeUser(BaseModel):
    \"\"\"User details for attendee\"\"\"
    id: str
    email: str
    role: str
    is_verified: bool
    is_active: bool

class EventAttendeeProfile(BaseModel):
    \"\"\"Profile details for attendee\"\"\"
    id: Optional[str] = None
    name: Optional[str] = None
    photo_url: Optional[str] = None
    headline: Optional[str] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    batch_year: Optional[int] = None
    skills: Optional[list[str]] = None
    bio: Optional[str] = None

class EventAttendee(BaseModel):
    \"\"\"Event attendee details with nested user and profile\"\"\"
    id: str
    event_id: str
    user_id: str
    status: str
    rsvp_date: datetime
    user: EventAttendeeUser
    profile: Optional[EventAttendeeProfile] = None
```

---

### Phase 4: Frontend Service Fixes

**File:** `/app/frontend/src/services/apiEventService.js`

1. **Update `getMyEvents()` method (line 89-96)**
   - Change endpoint from `/api/events/my-events` to `/api/events/user/my-events`

**Updated Method:**
```javascript
// Get events created by current user
async getMyEvents() {
  try {
    const response = await axios.get('/api/events/user/my-events');
    return response.data;
  } catch (error) {
    return handleApiError(error, []);
  }
}
```

2. **Update `getEvents()` method to fix filter mapping (line 7-14)**

**Updated Method:**
```javascript
// Get all events with optional filters
async getEvents(filters = {}) {
  try {
    // Map frontend status to backend parameters
    const params = { ...filters };
    
    if (filters.status === 'upcoming') {
      params.is_upcoming = true;
      params.status = 'published';
      delete params.status; // Remove the status=\"upcoming\"
    } else if (filters.status === 'past') {
      params.is_upcoming = false;
      delete params.status; // Remove the status=\"past\"
    }
    
    // Map type to event_type
    if (filters.type) {
      params.event_type = filters.type;
      delete params.type;
    }
    
    const response = await axios.get('/api/events', { params });
    return response.data;
  } catch (error) {
    return handleApiError(error, []);
  }
}
```

---

### Phase 5: Backend Query Optimization

**File:** `/app/backend/services/event_service.py`

1. **Update `get_all_events()` to handle status filter properly**
   - When `status` param is 'upcoming' or 'past', ignore it and use is_upcoming
   - Only filter by status for actual event statuses

**Updated Logic (lines 86-126):**
```python
@staticmethod
async def get_all_events(
    event_type: Optional[str] = None,
    status: Optional[str] = None,
    is_upcoming: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> list[EventResponse]:
    \"\"\"Get all events with filters\"\"\"
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            query = \"SELECT * FROM events WHERE 1=1\"
            params = []
            
            # Default to published events only
            query += \" AND status = 'published'\"
            
            if event_type:
                query += \" AND event_type = %s\"
                params.append(event_type)
            
            # Handle status filter - only for actual event statuses
            if status and status in ['draft', 'published', 'cancelled', 'completed']:
                query += \" AND status = %s\"
                params.append(status)
            
            if is_upcoming is not None:
                if is_upcoming:
                    query += \" AND start_date >= NOW()\"
                else:
                    query += \" AND start_date < NOW()\"
            
            if search:
                query += \" AND (title LIKE %s OR description LIKE %s)\"
                search_param = f\"%{search}%\"
                params.extend([search_param, search_param])
            
            query += \" ORDER BY start_date DESC LIMIT %s OFFSET %s\"
            params.extend([limit, offset])
            
            await cursor.execute(query, tuple(params))
            event_rows = await cursor.fetchall()
            
            return [EventService._event_from_row(row, cursor) for row in event_rows]
```

---

### Phase 6: Frontend Event Filters Fix

**File:** `/app/frontend/src/page/events/Events.jsx`

1. **Update filter construction in `loadEvents()` (lines 34-46)**

**Updated Code:**
```javascript
const loadEvents = async () => {
  setLoading(true);
  try {
    const filters = {
      search: searchTerm
    };
    
    // Map activeTab to is_upcoming
    if (activeTab === 'upcoming') {
      filters.is_upcoming = true;
    } else if (activeTab === 'past') {
      filters.is_upcoming = false;
    }
    
    // Map selectedType to event_type
    if (selectedType !== 'all') {
      filters.event_type = selectedType;
    }

    const response = await eventService.getEvents(filters);
    
    if (response.success) {
      setEvents(response.data);
    } else {
      toast.error('Failed to load events');
    }
  } catch (error) {
    toast.error('Error loading events');
  } finally {
    setLoading(false);
  }
};
```

---

## Summary of Changes

### Backend Changes:

1. **routes/events.py:**
   - Reorder routes: Move `/user/my-events` before `/{event_id}`
   - Change path from `/my-events` to `/user/my-events`
   - Update `get_all_events()` to default to published events

2. **services/event_service.py:**
   - Update `get_event_attendees()` query to fetch complete user and profile data
   - Update `_event_from_row()` parsing logic
   - Handle NULL profiles for non-alumni users

3. **database/models.py:**
   - Add `EventAttendeeUser` model
   - Add `EventAttendeeProfile` model
   - Update `EventAttendee` model with nested user and profile objects

### Frontend Changes:

1. **services/apiEventService.js:**
   - Update `getMyEvents()` endpoint to `/api/events/user/my-events`
   - Update `getEvents()` to properly map filters:
     - `status: \"upcoming\"` → `is_upcoming: true`
     - `status: \"past\"` → `is_upcoming: false`
     - `type` → `event_type`

2. **page/events/Events.jsx:**
   - Update filter construction to use correct parameter names
   - Change `filters.type` to `filters.event_type`
   - Change `filters.status` to `filters.is_upcoming`

---

## Testing Checklist

After implementation, verify:

- [ ] Events list page loads correctly
- [ ] \"Upcoming\" tab shows only future events
- [ ] \"Past\" tab shows only past events
- [ ] Event type filter works (workshop, webinar, etc.)
- [ ] Search functionality works
- [ ] \"Create Event\" button works for alumni/admin
- [ ] \"Manage My Events\" page loads user's events correctly
- [ ] Event details page displays correctly
- [ ] RSVP button works and updates attendee count
- [ ] Event attendees page shows all users (not just alumni)
- [ ] Attendees display correct profile information
- [ ] Non-alumni attendees (students, recruiters) appear in list
- [ ] Event creation form submits successfully
- [ ] Event deletion works
- [ ] All buttons and UI actions function properly

---

## Database Schema Validation

Based on `/app/database_schema.sql`:

### Events Table (lines 257-282):
```sql
CREATE TABLE events (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('workshop', 'webinar', 'meetup', 'conference', 'networking', 'other') NOT NULL,
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT FALSE,
    meeting_link VARCHAR(500),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    registration_deadline TIMESTAMP,
    max_attendees INT,
    current_attendees_count INT DEFAULT 0,
    banner_image VARCHAR(500),
    created_by VARCHAR(50) NOT NULL,
    status ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'published',
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ...
) ENGINE=InnoDB
```

### Event RSVPs Table (lines 285-300):
```sql
CREATE TABLE event_rsvps (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    event_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    status ENUM('attending', 'maybe', 'not_attending') DEFAULT 'attending',
    rsvp_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rsvp (event_id, user_id),
    ...
) ENGINE=InnoDB
```

✅ **Schema is correct and supports all required functionality**

---

## Implementation Priority

1. **HIGH PRIORITY** - Backend route ordering (fixes 404 errors)
2. **HIGH PRIORITY** - Event attendees query (fixes missing users)
3. **MEDIUM PRIORITY** - Filter mapping (fixes filter functionality)
4. **MEDIUM PRIORITY** - API endpoint path update
5. **LOW PRIORITY** - Model enhancements (improves data structure)

---

## Notes

- All changes are backward compatible
- No database migrations required
- Changes only affect code, not schema
- Testing should be done incrementally after each phase
- Consider adding error handling for edge cases
- Add logging for debugging filter parameters
"