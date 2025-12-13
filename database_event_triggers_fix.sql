-- ============================================================================
-- EVENT RSVP TRIGGERS FIX
-- Purpose: Properly maintain current_attendees_count in events table
-- ============================================================================

USE AlumUnity;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS after_event_rsvp;
DROP TRIGGER IF EXISTS after_event_rsvp_insert;
DROP TRIGGER IF EXISTS after_event_rsvp_update;
DROP TRIGGER IF EXISTS after_event_rsvp_delete;

DELIMITER //

-- ============================================================================
-- TRIGGER 1: Handle RSVP INSERT
-- When a new RSVP is created with 'attending' status, increment count
-- ============================================================================
CREATE TRIGGER after_event_rsvp_insert
AFTER INSERT ON event_rsvps
FOR EACH ROW
BEGIN
    IF NEW.status = 'attending' THEN
        UPDATE events 
        SET current_attendees_count = current_attendees_count + 1 
        WHERE id = NEW.event_id;
    END IF;
END //

-- ============================================================================
-- TRIGGER 2: Handle RSVP UPDATE
-- When RSVP status changes, adjust count accordingly
-- ============================================================================
CREATE TRIGGER after_event_rsvp_update
AFTER UPDATE ON event_rsvps
FOR EACH ROW
BEGIN
    -- If status changed from attending to something else, decrease count
    IF OLD.status = 'attending' AND NEW.status != 'attending' THEN
        UPDATE events 
        SET current_attendees_count = GREATEST(current_attendees_count - 1, 0)
        WHERE id = NEW.event_id;
    END IF;
    
    -- If status changed to attending from something else, increase count
    IF OLD.status != 'attending' AND NEW.status = 'attending' THEN
        UPDATE events 
        SET current_attendees_count = current_attendees_count + 1 
        WHERE id = NEW.event_id;
    END IF;
END //

-- ============================================================================
-- TRIGGER 3: Handle RSVP DELETE
-- When an RSVP is deleted and status was 'attending', decrease count
-- ============================================================================
CREATE TRIGGER after_event_rsvp_delete
AFTER DELETE ON event_rsvps
FOR EACH ROW
BEGIN
    IF OLD.status = 'attending' THEN
        UPDATE events 
        SET current_attendees_count = GREATEST(current_attendees_count - 1, 0)
        WHERE id = OLD.event_id;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- VERIFICATION: Check if triggers are created
-- ============================================================================
SELECT 
    TRIGGER_NAME, 
    EVENT_MANIPULATION, 
    EVENT_OBJECT_TABLE,
    ACTION_TIMING,
    ACTION_STATEMENT
FROM information_schema.TRIGGERS 
WHERE TRIGGER_SCHEMA = 'AlumUnity' 
  AND EVENT_OBJECT_TABLE = 'event_rsvps'
ORDER BY TRIGGER_NAME;

-- ============================================================================
-- DATA INTEGRITY FIX: Recalculate all current_attendees_count
-- This ensures existing data is corrected
-- ============================================================================
UPDATE events e
SET current_attendees_count = (
    SELECT COUNT(*)
    FROM event_rsvps r
    WHERE r.event_id = e.id AND r.status = 'attending'
);

-- ============================================================================
-- VERIFICATION: Show events with their attendee counts
-- ============================================================================
SELECT 
    e.id,
    e.title,
    e.current_attendees_count AS stored_count,
    (SELECT COUNT(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'attending') AS actual_count,
    CASE 
        WHEN e.current_attendees_count = (SELECT COUNT(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'attending') 
        THEN 'OK' 
        ELSE 'MISMATCH' 
    END AS status
FROM events e
ORDER BY e.created_at DESC
LIMIT 10;

-- ============================================================================
-- END OF TRIGGER FIXES
-- ============================================================================
