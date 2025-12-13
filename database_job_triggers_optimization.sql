-- ============================================================================
-- Job Application Triggers - Optimization Update
-- Purpose: Add missing trigger for application deletion to keep counts accurate
-- ============================================================================

USE AlumUnity;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS after_job_application_insert;
DROP TRIGGER IF EXISTS after_job_application_delete;

DELIMITER //

-- ============================================================================
-- TRIGGER 1: Increment applications_count on application insert
-- ============================================================================
CREATE TRIGGER after_job_application_insert
AFTER INSERT ON job_applications
FOR EACH ROW
BEGIN
    -- Increment the applications count for the job
    UPDATE jobs 
    SET applications_count = applications_count + 1 
    WHERE id = NEW.job_id;
END //

-- ============================================================================
-- TRIGGER 2: Decrement applications_count on application delete
-- ============================================================================
CREATE TRIGGER after_job_application_delete
AFTER DELETE ON job_applications
FOR EACH ROW
BEGIN
    -- Decrement the applications count for the job
    -- Use GREATEST to ensure count never goes below 0
    UPDATE jobs 
    SET applications_count = GREATEST(0, applications_count - 1)
    WHERE id = OLD.job_id;
END //

DELIMITER ;

-- ============================================================================
-- Verification: Check if triggers were created successfully
-- ============================================================================
SHOW TRIGGERS WHERE `Table` = 'job_applications';

-- ============================================================================
-- Testing: Verify trigger functionality (optional - run manually if needed)
-- ============================================================================

-- Test 1: Check current count
-- SELECT id, title, applications_count FROM jobs LIMIT 5;

-- Test 2: Insert a test application (replace with valid IDs)
-- INSERT INTO job_applications (id, job_id, applicant_id, status) 
-- VALUES (UUID(), 'VALID_JOB_ID', 'VALID_USER_ID', 'pending');

-- Test 3: Verify count increased
-- SELECT id, title, applications_count FROM jobs WHERE id = 'VALID_JOB_ID';

-- Test 4: Delete the test application
-- DELETE FROM job_applications WHERE job_id = 'VALID_JOB_ID' AND applicant_id = 'VALID_USER_ID';

-- Test 5: Verify count decreased
-- SELECT id, title, applications_count FROM jobs WHERE id = 'VALID_JOB_ID';

-- ============================================================================
-- Recalculate existing counts (run if counts are incorrect)
-- ============================================================================

-- This query recalculates all application counts based on actual data
UPDATE jobs j
SET applications_count = (
    SELECT COUNT(*)
    FROM job_applications ja
    WHERE ja.job_id = j.id
);

-- ============================================================================
-- END OF TRIGGER OPTIMIZATION
-- ============================================================================
