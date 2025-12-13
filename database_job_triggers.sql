-- ============================================================================
-- JOB APPLICATION TRIGGERS
-- Automatically maintain applications_count in jobs table
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS increment_applications_count;
DROP TRIGGER IF EXISTS decrement_applications_count;

DELIMITER //

-- Trigger: Increment count when application is created
CREATE TRIGGER increment_applications_count
AFTER INSERT ON job_applications
FOR EACH ROW
BEGIN
    UPDATE jobs 
    SET applications_count = applications_count + 1
    WHERE id = NEW.job_id;
END//

-- Trigger: Decrement count when application is deleted
CREATE TRIGGER decrement_applications_count
AFTER DELETE ON job_applications
FOR EACH ROW
BEGIN
    UPDATE jobs 
    SET applications_count = GREATEST(0, applications_count - 1)
    WHERE id = OLD.job_id;
END//

DELIMITER ;

-- ============================================================================
-- FIX EXISTING COUNTS
-- Recalculate applications_count for all existing jobs
-- ============================================================================

UPDATE jobs j
SET applications_count = (
    SELECT COUNT(*) 
    FROM job_applications ja 
    WHERE ja.job_id = j.id
);

-- Verify the fix
SELECT 
    j.id,
    j.title,
    j.applications_count as stored_count,
    COUNT(ja.id) as actual_count,
    CASE 
        WHEN j.applications_count = COUNT(ja.id) THEN 'OK'
        ELSE 'MISMATCH'
    END as status
FROM jobs j
LEFT JOIN job_applications ja ON j.id = ja.job_id
GROUP BY j.id, j.title, j.applications_count
ORDER BY j.created_at DESC;
