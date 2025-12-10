-- ============================================================================
-- AlumUnity - DATABASE SCHEMA
-- Database: MySQL 8.0+ / MariaDB 10.5+
-- Description: Comprehensive database schema for AlumUnity Management System
-- Version: 1.0
-- ============================================================================

-- Drop database if exists (use with caution in production)
-- DROP DATABASE IF EXISTS AlumUnity;

-- Create database
CREATE DATABASE IF NOT EXISTS AlumUnity
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE AlumUnity;

-- ============================================================================
-- PHASE 1: CORE AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

-- Users table - Core authentication
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'alumni', 'recruiter', 'admin') NOT NULL DEFAULT 'student',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_verified (is_verified),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email verification tokens
CREATE TABLE email_verifications (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset tokens
CREATE TABLE password_resets (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL,
    reset_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_reset_token (reset_token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHASE 2: ALUMNI PROFILE SYSTEM
-- ============================================================================

-- Alumni profiles
CREATE TABLE alumni_profiles (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    photo_url VARCHAR(500),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    headline VARCHAR(500),
    current_company VARCHAR(255),
    current_role VARCHAR(255),
    location VARCHAR(255),
    batch_year INT,
    experience_timeline JSON,  -- [{company, role, start_date, end_date, description}]
    education_details JSON,    -- [{institution, degree, field, start_year, end_year, achievements}]
    skills JSON,               -- ["skill1", "skill2", ...]
    achievements JSON,         -- ["achievement1", "achievement2", ...]
    social_links JSON,         -- {linkedin, github, twitter, website}
    cv_url VARCHAR(500),
    -- Alumni-specific fields
    industry VARCHAR(255),     -- Industry/sector the alumni works in
    years_of_experience INT DEFAULT 0,  -- Total years of professional experience
    willing_to_mentor BOOLEAN DEFAULT FALSE,  -- Availability for mentorship
    willing_to_hire BOOLEAN DEFAULT FALSE,    -- Willing to post job opportunities
    profile_completion_percentage INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(50) NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_current_company (current_company),
    INDEX idx_location (location),
    INDEX idx_batch_year (batch_year),
    INDEX idx_is_verified (is_verified),
    INDEX idx_industry (industry),
    INDEX idx_willing_to_mentor (willing_to_mentor),
    FULLTEXT idx_name_bio (name, bio, headline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profile verification requests
CREATE TABLE profile_verification_requests (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by VARCHAR(50) NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHASE 3: JOBS & CAREER MANAGEMENT
-- ============================================================================

-- Jobs table
CREATE TABLE jobs (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    job_type ENUM('full-time', 'part-time', 'internship', 'contract', 'remote') NOT NULL,
    experience_required VARCHAR(100),
    skills_required JSON,  -- ["skill1", "skill2", ...]
    salary_range VARCHAR(100),
    apply_link VARCHAR(500),
    posted_by VARCHAR(50) NOT NULL,
    application_deadline DATE,
    status ENUM('active', 'closed', 'draft') DEFAULT 'active',
    views_count INT DEFAULT 0,
    applications_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_posted_by (posted_by),
    INDEX idx_company (company),
    INDEX idx_location (location),
    INDEX idx_job_type (job_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_title_description (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job applications
-- API Endpoints needed for frontend integration:
--   GET /api/applications/recruiter/:recruiterId - Get all applications for jobs posted by a recruiter
--   GET /api/jobs/:jobId/applications - Get applications for a specific job
--   GET /api/applications/user/:userId - Get applications submitted by a user
--   PUT /api/applications/:applicationId - Update application status
CREATE TABLE job_applications (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    job_id VARCHAR(50) NOT NULL,
    applicant_id VARCHAR(50) NOT NULL,
    cv_url VARCHAR(500),
    cover_letter TEXT,
    status ENUM('pending', 'reviewed', 'shortlisted', 'rejected', 'accepted') DEFAULT 'pending',
    viewed_at TIMESTAMP NULL,
    response_message TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (job_id, applicant_id),
    INDEX idx_job_id (job_id),
    INDEX idx_applicant_id (applicant_id),
    INDEX idx_status (status),
    INDEX idx_applied_at (applied_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHASE 4: MENTORSHIP SYSTEM
-- ============================================================================

-- Mentor profiles
CREATE TABLE mentor_profiles (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    is_available BOOLEAN DEFAULT TRUE,
    expertise_areas JSON,  -- ["area1", "area2", ...]
    max_mentees INT DEFAULT 5,
    current_mentees_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_sessions INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    mentorship_approach TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_available (is_available),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mentorship requests
CREATE TABLE mentorship_requests (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    student_id VARCHAR(50) NOT NULL,
    mentor_id VARCHAR(50) NOT NULL,
    request_message TEXT,
    goals TEXT,
    preferred_topics JSON,  -- ["topic1", "topic2", ...]
    status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
    rejection_reason TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_request (student_id, mentor_id, status),
    INDEX idx_student_id (student_id),
    INDEX idx_mentor_id (mentor_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mentorship sessions
CREATE TABLE mentorship_sessions (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    mentorship_request_id VARCHAR(50) NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    duration INT DEFAULT 60,  -- in minutes
    status ENUM('scheduled', 'completed', 'cancelled', 'missed') DEFAULT 'scheduled',
    meeting_link VARCHAR(500),
    agenda TEXT,
    notes TEXT,
    feedback TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mentorship_request_id) REFERENCES mentorship_requests(id) ON DELETE CASCADE,
    INDEX idx_mentorship_request_id (mentorship_request_id),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHASE 5: EVENTS & COMMUNITY ENGAGEMENT
-- ============================================================================

-- Events
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
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_event_type (event_type),
    INDEX idx_start_date (start_date),
    INDEX idx_status (status),
    FULLTEXT idx_title_description (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event RSVPs
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
    INDEX idx_event_id (event_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Forum posts
CREATE TABLE forum_posts (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255),
    content TEXT NOT NULL,
    author_id VARCHAR(50) NOT NULL,
    tags JSON,  -- ["tag1", "tag2", ...]
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_author_id (author_id),
    INDEX idx_is_pinned (is_pinned),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Forum comments
CREATE TABLE forum_comments (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    post_id VARCHAR(50) NOT NULL,
    author_id VARCHAR(50) NOT NULL,
    parent_comment_id VARCHAR(50) NULL,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES forum_comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_author_id (author_id),
    INDEX idx_parent_comment_id (parent_comment_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Post and comment likes
CREATE TABLE post_likes (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    post_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (post_id, user_id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE comment_likes (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    comment_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES forum_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (comment_id, user_id),
    INDEX idx_comment_id (comment_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHASE 6: NOTIFICATIONS SYSTEM
-- ============================================================================

-- Notifications
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL,
    type ENUM('profile', 'mentorship', 'job', 'event', 'forum', 'system', 'verification') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    metadata JSON,  -- Additional contextual data
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification preferences
CREATE TABLE notification_preferences (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    job_alerts BOOLEAN DEFAULT TRUE,
    event_reminders BOOLEAN DEFAULT TRUE,
    mentorship_updates BOOLEAN DEFAULT TRUE,
    forum_activity BOOLEAN DEFAULT TRUE,
    notification_types JSON,  -- {profile: true, mentorship: true, job: true, event: true, forum: true, ...}
    notification_frequency ENUM('instant', 'daily', 'weekly') DEFAULT 'instant',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Privacy settings
CREATE TABLE privacy_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    profile_visibility ENUM('public', 'alumni', 'connections', 'private') DEFAULT 'public',
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    allow_messages BOOLEAN DEFAULT TRUE,
    allow_mentorship_requests BOOLEAN DEFAULT TRUE,
    show_in_directory BOOLEAN DEFAULT TRUE,
    show_activity BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHASE 7: ADMIN DASHBOARD & ANALYTICS
-- ============================================================================

-- Admin actions audit log
CREATE TABLE admin_actions (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    admin_id VARCHAR(50) NOT NULL,
    action_type ENUM('user_management', 'content_moderation', 'verification', 'system_config', 'other') NOT NULL,
    target_type VARCHAR(50),  -- user, post, comment, job, event, etc.
    target_id VARCHAR(50),
    description TEXT NOT NULL,
    metadata JSON,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_type (action_type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System metrics
CREATE TABLE system_metrics (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(50),
    category VARCHAR(50),  -- users, jobs, events, mentorship, etc.
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric_name (metric_name),
    INDEX idx_category (category),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content moderation flags
CREATE TABLE content_flags (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    content_type ENUM('post', 'comment', 'job', 'event', 'profile') NOT NULL,
    content_id VARCHAR(50) NOT NULL,
    flagged_by VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'removed') DEFAULT 'pending',
    reviewed_by VARCHAR(50) NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_content_type_id (content_type, content_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHASE 8: SMART ALGORITHMS & ENGAGEMENT
-- ============================================================================

-- User interests and interactions
CREATE TABLE user_interests (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    interest_tags JSON,  -- ["tag1", "tag2", ...]
    interaction_history JSON,  -- {jobs: [...], events: [...], posts: [...]}
    preferred_industries JSON,
    preferred_locations JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Engagement scores
CREATE TABLE engagement_scores (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    total_score INT DEFAULT 0,
    contributions JSON,  -- {profile: 10, mentorship: 20, jobs: 15, events: 10, forum: 15}
    rank_position INT,
    level VARCHAR(50),  -- Beginner, Active, Veteran, Legend
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_total_score (total_score),
    INDEX idx_rank_position (rank_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contribution history
CREATE TABLE contribution_history (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL,
    contribution_type ENUM('profile_update', 'mentorship', 'job_post', 'event_attend', 'forum_post', 'forum_comment', 'help_others') NOT NULL,
    points_earned INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_contribution_type (contribution_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievement badges
CREATE TABLE badges (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(500),
    requirements JSON,  -- {type: 'mentorship', count: 10}
    rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_rarity (rarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User badges
CREATE TABLE user_badges (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL,
    badge_id VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user_id (user_id),
    INDEX idx_earned_at (earned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHASE 9: INNOVATIVE FEATURES
-- ============================================================================

-- Skill graph relationships
CREATE TABLE skill_graph (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    skill_name VARCHAR(100) NOT NULL,
    related_skills JSON,  -- ["skill1", "skill2", ...]
    industry_connections JSON,  -- ["industry1", "industry2", ...]
    alumni_count INT DEFAULT 0,
    job_count INT DEFAULT 0,
    popularity_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_skill (skill_name),
    INDEX idx_skill_name (skill_name),
    INDEX idx_popularity_score (popularity_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Career paths and transitions
CREATE TABLE career_paths (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL,
    from_role VARCHAR(255),
    to_role VARCHAR(255),
    from_company VARCHAR(255),
    to_company VARCHAR(255),
    transition_duration_months INT,  -- How long the transition took
    skills_acquired JSON,  -- Skills gained during transition
    transition_date DATE,
    success_rating INT CHECK (success_rating >= 1 AND success_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_from_role (from_role),
    INDEX idx_to_role (to_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Career predictions
CREATE TABLE career_predictions (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL,
    current_role VARCHAR(255),
    predicted_roles JSON,  -- [{role: "Senior Developer", probability: 0.85, timeframe: "2 years"}]
    recommended_skills JSON,  -- ["skill1", "skill2", ...]
    similar_alumni JSON,  -- [user_ids of alumni with similar career paths]
    confidence_score DECIMAL(3,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Digital Alumni ID Cards
CREATE TABLE alumni_cards (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL UNIQUE,
    card_number VARCHAR(20) NOT NULL UNIQUE,
    qr_code_data TEXT NOT NULL,  -- Encrypted data for QR code
    issue_date DATE NOT NULL,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    verification_count INT DEFAULT 0,
    last_verified TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_card_number (card_number),
    INDEX idx_qr_code_data (qr_code_data(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Geographic data for heatmaps
CREATE TABLE geographic_data (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    location_name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    alumni_count INT DEFAULT 0,
    jobs_count INT DEFAULT 0,
    top_skills JSON,  -- ["skill1", "skill2", ...]
    top_companies JSON,  -- ["company1", "company2", ...]
    top_industries JSON,  -- ["industry1", "industry2", ...]
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_location (location_name),
    INDEX idx_country (country),
    INDEX idx_city (city),
    INDEX idx_coordinates (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Knowledge capsules
CREATE TABLE knowledge_capsules (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(50) NOT NULL,
    category ENUM('technical', 'career', 'entrepreneurship', 'life_lessons', 'industry_insights', 'other') NOT NULL,
    tags JSON,  -- ["tag1", "tag2", ...]
    duration_minutes INT,  -- Estimated reading time
    featured_image VARCHAR(500),
    likes_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    bookmarks_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_author_id (author_id),
    INDEX idx_category (category),
    INDEX idx_is_featured (is_featured),
    INDEX idx_views_count (views_count),
    FULLTEXT idx_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Capsule bookmarks
CREATE TABLE capsule_bookmarks (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    capsule_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (capsule_id) REFERENCES knowledge_capsules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (capsule_id, user_id),
    INDEX idx_capsule_id (capsule_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Capsule likes
CREATE TABLE capsule_likes (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    capsule_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (capsule_id) REFERENCES knowledge_capsules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (capsule_id, user_id),
    INDEX idx_capsule_id (capsule_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ADDITIONAL UTILITY TABLES
-- ============================================================================

-- File uploads tracking
CREATE TABLE file_uploads (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),  -- cv, photo, banner, document
    file_size_kb INT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_file_type (file_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email queue for async sending
CREATE TABLE email_queue (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    template_name VARCHAR(100),
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    error_message TEXT,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System configuration
CREATE TABLE system_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type VARCHAR(50),  -- string, number, boolean, json
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for active alumni with complete profiles
CREATE VIEW active_alumni AS
SELECT 
    u.id,
    u.email,
    u.role,
    ap.name,
    ap.current_company,
    ap.current_role,
    ap.location,
    ap.batch_year,
    ap.skills,
    ap.is_verified,
    ap.profile_completion_percentage
FROM users u
JOIN alumni_profiles ap ON u.id = ap.user_id
WHERE u.is_active = TRUE 
    AND u.role = 'alumni'
    AND ap.profile_completion_percentage >= 70;

-- View for job statistics
CREATE VIEW job_statistics AS
SELECT 
    j.id,
    j.title,
    j.company,
    j.posted_by,
    j.status,
    j.views_count,
    COUNT(ja.id) as total_applications,
    SUM(CASE WHEN ja.status = 'pending' THEN 1 ELSE 0 END) as pending_applications,
    SUM(CASE WHEN ja.status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted_applications,
    j.created_at
FROM jobs j
LEFT JOIN job_applications ja ON j.id = ja.job_id
GROUP BY j.id;

-- View for mentor statistics
CREATE VIEW mentor_statistics AS
SELECT 
    u.id,
    u.email,
    ap.name,
    mp.is_available,
    mp.rating,
    mp.total_sessions,
    mp.current_mentees_count,
    mp.expertise_areas,
    COUNT(DISTINCT mr.id) as total_requests,
    SUM(CASE WHEN mr.status = 'accepted' THEN 1 ELSE 0 END) as accepted_requests
FROM users u
JOIN mentor_profiles mp ON u.id = mp.user_id
JOIN alumni_profiles ap ON u.id = ap.user_id
LEFT JOIN mentorship_requests mr ON u.id = mr.mentor_id
GROUP BY u.id;

-- View for engagement leaderboard
CREATE VIEW engagement_leaderboard AS
SELECT 
    u.id,
    ap.name,
    ap.photo_url,
    u.role,
    es.total_score,
    es.rank_position,
    es.level,
    es.contributions
FROM users u
JOIN alumni_profiles ap ON u.id = ap.user_id
JOIN engagement_scores es ON u.id = es.user_id
WHERE u.is_active = TRUE
ORDER BY es.total_score DESC;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

DELIMITER //

-- Procedure to calculate profile completion percentage
CREATE PROCEDURE calculate_profile_completion(IN p_user_id VARCHAR(50))
BEGIN
    DECLARE completion INT DEFAULT 0;
    DECLARE photo_score INT DEFAULT 0;
    DECLARE bio_score INT DEFAULT 0;
    DECLARE experience_score INT DEFAULT 0;
    DECLARE education_score INT DEFAULT 0;
    DECLARE skills_score INT DEFAULT 0;
    DECLARE cv_score INT DEFAULT 0;
    
    SELECT 
        CASE WHEN photo_url IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN bio IS NOT NULL AND LENGTH(bio) > 50 THEN 15 ELSE 0 END +
        CASE WHEN experience_timeline IS NOT NULL AND JSON_LENGTH(experience_timeline) > 0 THEN 25 ELSE 0 END +
        CASE WHEN education_details IS NOT NULL AND JSON_LENGTH(education_details) > 0 THEN 15 ELSE 0 END +
        CASE WHEN skills IS NOT NULL AND JSON_LENGTH(skills) >= 3 THEN 20 ELSE 0 END +
        CASE WHEN cv_url IS NOT NULL THEN 10 ELSE 0 END
    INTO completion
    FROM alumni_profiles
    WHERE user_id = p_user_id;
    
    UPDATE alumni_profiles 
    SET profile_completion_percentage = completion
    WHERE user_id = p_user_id;
END //

-- Procedure to update engagement score
CREATE PROCEDURE update_engagement_score(IN p_user_id VARCHAR(50))
BEGIN
    DECLARE profile_points INT DEFAULT 0;
    DECLARE mentorship_points INT DEFAULT 0;
    DECLARE job_points INT DEFAULT 0;
    DECLARE event_points INT DEFAULT 0;
    DECLARE forum_points INT DEFAULT 0;
    DECLARE total INT DEFAULT 0;
    
    -- Calculate points from different activities
    SELECT profile_completion_percentage * 0.2 INTO profile_points
    FROM alumni_profiles WHERE user_id = p_user_id;
    
    SELECT COUNT(*) * 10 INTO mentorship_points
    FROM mentorship_sessions ms
    JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
    WHERE (mr.mentor_id = p_user_id OR mr.student_id = p_user_id) 
        AND ms.status = 'completed';
    
    SELECT COUNT(*) * 5 INTO job_points
    FROM job_applications WHERE applicant_id = p_user_id;
    
    SELECT COUNT(*) * 8 INTO event_points
    FROM event_rsvps WHERE user_id = p_user_id AND status = 'attending';
    
    SELECT (COUNT(DISTINCT fp.id) * 5 + COUNT(DISTINCT fc.id) * 2) INTO forum_points
    FROM forum_posts fp
    LEFT JOIN forum_comments fc ON fc.author_id = p_user_id
    WHERE fp.author_id = p_user_id;
    
    SET total = profile_points + mentorship_points + job_points + event_points + forum_points;
    
    -- Update or insert engagement score
    INSERT INTO engagement_scores (user_id, total_score, contributions, last_calculated)
    VALUES (
        p_user_id, 
        total,
        JSON_OBJECT(
            'profile', profile_points,
            'mentorship', mentorship_points,
            'jobs', job_points,
            'events', event_points,
            'forum', forum_points
        ),
        NOW()
    )
    ON DUPLICATE KEY UPDATE
        total_score = total,
        contributions = JSON_OBJECT(
            'profile', profile_points,
            'mentorship', mentorship_points,
            'jobs', job_points,
            'events', event_points,
            'forum', forum_points
        ),
        last_calculated = NOW();
    
    -- Update rank positions
    SET @rank = 0;
    UPDATE engagement_scores
    SET rank_position = (@rank := @rank + 1)
    ORDER BY total_score DESC;
END //

-- Procedure to send notification
CREATE PROCEDURE send_notification(
    IN p_user_id VARCHAR(50),
    IN p_type VARCHAR(50),
    IN p_title VARCHAR(255),
    IN p_message TEXT,
    IN p_link VARCHAR(500),
    IN p_priority VARCHAR(10)
)
BEGIN
    INSERT INTO notifications (user_id, type, title, message, link, priority)
    VALUES (p_user_id, p_type, p_title, p_message, p_link, p_priority);
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger to update job application count
CREATE TRIGGER after_job_application_insert
AFTER INSERT ON job_applications
FOR EACH ROW
BEGIN
    UPDATE jobs 
    SET applications_count = applications_count + 1 
    WHERE id = NEW.job_id;
END //

-- Trigger to update mentor mentees count
CREATE TRIGGER after_mentorship_accept
AFTER UPDATE ON mentorship_requests
FOR EACH ROW
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        UPDATE mentor_profiles 
        SET current_mentees_count = current_mentees_count + 1 
        WHERE user_id = NEW.mentor_id;
    END IF;
END //

-- Trigger to update event attendees count
CREATE TRIGGER after_event_rsvp
AFTER INSERT ON event_rsvps
FOR EACH ROW
BEGIN
    IF NEW.status = 'attending' THEN
        UPDATE events 
        SET current_attendees_count = current_attendees_count + 1 
        WHERE id = NEW.event_id;
    END IF;
END //

-- Trigger to update post likes count
CREATE TRIGGER after_post_like_insert
AFTER INSERT ON post_likes
FOR EACH ROW
BEGIN
    UPDATE forum_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
END //

-- Trigger to update comment count
CREATE TRIGGER after_comment_insert
AFTER INSERT ON forum_comments
FOR EACH ROW
BEGIN
    UPDATE forum_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
END //

-- Trigger to update mentor rating
CREATE TRIGGER after_session_feedback
AFTER UPDATE ON mentorship_sessions
FOR EACH ROW
BEGIN
    IF NEW.rating IS NOT NULL AND OLD.rating IS NULL THEN
        UPDATE mentor_profiles mp
        JOIN mentorship_requests mr ON mr.mentor_id = mp.user_id
        SET 
            mp.rating = (
                SELECT AVG(ms.rating)
                FROM mentorship_sessions ms
                JOIN mentorship_requests mr2 ON ms.mentorship_request_id = mr2.id
                WHERE mr2.mentor_id = mp.user_id AND ms.rating IS NOT NULL
            ),
            mp.total_reviews = mp.total_reviews + 1
        WHERE mr.id = NEW.mentorship_request_id;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default badges
INSERT INTO badges (name, description, rarity, points, requirements) VALUES
('First Login', 'Welcome to the platform!', 'common', 10, '{"type": "login", "count": 1}'),
('Profile Complete', 'Complete your profile 100%', 'common', 50, '{"type": "profile", "completion": 100}'),
('Active Mentor', 'Conduct 10 mentorship sessions', 'rare', 200, '{"type": "mentorship", "sessions": 10}'),
('Job Hunter', 'Apply for 20 jobs', 'common', 100, '{"type": "job_applications", "count": 20}'),
('Community Leader', 'Create 50 forum posts', 'epic', 300, '{"type": "forum_posts", "count": 50}'),
('Event Enthusiast', 'Attend 15 events', 'rare', 150, '{"type": "events", "count": 15}'),
('Knowledge Sharer', 'Create 10 knowledge capsules', 'epic', 250, '{"type": "capsules", "count": 10}'),
('Top Contributor', 'Reach top 10 on leaderboard', 'legendary', 500, '{"type": "leaderboard", "rank": 10}');

-- Insert default system config
INSERT INTO system_config (config_key, config_value, config_type, description, is_public) VALUES
('platform_name', 'AlumUnity', 'string', 'Name of the platform', TRUE),
('max_job_posting_days', '90', 'number', 'Maximum days a job posting remains active', FALSE),
('max_mentees_per_mentor', '5', 'number', 'Default maximum mentees per mentor', FALSE),
('profile_verification_required', 'true', 'boolean', 'Whether profile verification is mandatory', TRUE),
('email_notifications_enabled', 'true', 'boolean', 'Global email notification toggle', FALSE),
('maintenance_mode', 'false', 'boolean', 'Platform maintenance mode', FALSE);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_users_role_verified ON users(role, is_verified);
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at);
CREATE INDEX idx_events_status_start ON events(status, start_date);
CREATE INDEX idx_applications_applicant_status ON job_applications(applicant_id, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_posts_created_pinned ON forum_posts(created_at DESC, is_pinned);

-- ============================================================================
-- GRANT PERMISSIONS (Adjust according to your needs)
-- ============================================================================

-- Create application user (modify username and password as needed)
-- CREATE USER 'alumni_app'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON alumni_portal.* TO 'alumni_app'@'localhost';
-- GRANT EXECUTE ON alumni_portal.* TO 'alumni_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Notes:
-- 1. This schema uses UUID() for primary keys (supported in MySQL 8.0+)
-- 2. JSON data type is used extensively for flexible data storage
-- 3. All tables use InnoDB engine for ACID compliance and foreign key support
-- 4. Indexes are created for frequently queried columns
-- 5. Triggers maintain data consistency automatically
-- 6. Views provide convenient access to complex joined data
-- 7. Stored procedures handle complex business logic
-- 8. Character set is utf8mb4 for full Unicode support including emojis
-- 9. For MariaDB, replace UUID() with UUID_SHORT() or use VARCHAR with application-generated UUIDs
-- 10. Adjust foreign key constraints and ON DELETE behavior based on your requirements

-- ============================================================================
-- ALUMUNITY SYSTEM - AI SYSTEMS DATABASE SCHEMA UPDATES
-- Database: MySQL 8.0+ / MariaDB 10.5+
-- Description: Additional tables for 6 AI Systems + Admin Dataset Upload
-- Version: 2.0 (AI Enhanced)
-- ============================================================================

-- This file contains ONLY the new tables for AI systems.
-- Import the original database_schema.sql first, then this file.

USE AlumUnity;

-- ============================================================================
-- ADMIN DATASET UPLOAD SYSTEM
-- ============================================================================

-- 1. Admin Dataset Upload Tracking
CREATE TABLE dataset_uploads (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    uploaded_by VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type ENUM('alumni', 'job_market', 'educational') NOT NULL,
    file_size_kb INT,
    status ENUM('pending', 'validating', 'cleaning', 'processing', 'completed', 'failed') DEFAULT 'pending',
    total_rows INT,
    valid_rows INT,
    error_rows INT,
    error_log TEXT,
    validation_report JSON,
    processing_start_time TIMESTAMP NULL,
    processing_end_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Dataset Processing Logs
CREATE TABLE dataset_processing_logs (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    upload_id VARCHAR(50) NOT NULL,
    stage ENUM('validation', 'cleaning', 'ai_processing', 'storage') NOT NULL,
    status ENUM('started', 'in_progress', 'completed', 'failed') NOT NULL,
    message TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (upload_id) REFERENCES dataset_uploads(id) ON DELETE CASCADE,
    INDEX idx_upload_id (upload_id),
    INDEX idx_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI SYSTEM 1: SKILL GRAPH AI
-- ============================================================================

-- 3. Skill Embeddings (for semantic similarity)
CREATE TABLE skill_embeddings (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    embedding_vector JSON NOT NULL,  -- 384-dimensional vector from sentence-transformers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_skill_name (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Skill Similarity Matrix (precomputed for fast lookups)
CREATE TABLE skill_similarities (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    skill_1 VARCHAR(100) NOT NULL,
    skill_2 VARCHAR(100) NOT NULL,
    similarity_score DECIMAL(5,4) NOT NULL,  -- 0.0000 to 1.0000
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pair (skill_1, skill_2),
    INDEX idx_skill_1 (skill_1),
    INDEX idx_skill_2 (skill_2),
    INDEX idx_similarity_score (similarity_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI SYSTEM 2: CAREER PATH PREDICTION ENGINE
-- ============================================================================

-- 5. Career Transition Probabilities (ML-calculated)
CREATE TABLE career_transition_matrix (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    from_role VARCHAR(255) NOT NULL,
    to_role VARCHAR(255) NOT NULL,
    transition_count INT DEFAULT 0,
    transition_probability DECIMAL(5,4),  -- ML-calculated probability
    avg_duration_months INT,
    required_skills JSON,  -- Skills needed for transition
    success_rate DECIMAL(5,4),
    college_id VARCHAR(50),  -- Per-college transition data
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_transition (from_role, to_role, college_id),
    INDEX idx_from_role (from_role),
    INDEX idx_to_role (to_role),
    INDEX idx_probability (transition_probability DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI SYSTEM 3: TALENT HEATMAP INTELLIGENCE
-- ============================================================================

-- 6. Talent Clusters (geographic clustering)
CREATE TABLE talent_clusters (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    cluster_name VARCHAR(255) NOT NULL,
    center_latitude DECIMAL(10, 8),
    center_longitude DECIMAL(11, 8),
    radius_km DECIMAL(8, 2),
    alumni_ids JSON,  -- Array of user_ids in this cluster
    dominant_skills JSON,
    dominant_industries JSON,
    cluster_size INT,
    cluster_density DECIMAL(5,2),  -- Alumni per sq km
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cluster_name (cluster_name),
    INDEX idx_coordinates (center_latitude, center_longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI SYSTEM 4: AI-VALIDATED DIGITAL ALUMNI ID
-- ============================================================================

-- 7. Alumni ID Verification Records
CREATE TABLE alumni_id_verifications (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    card_id VARCHAR(50) NOT NULL,
    verified_by VARCHAR(50),
    verification_method ENUM('qr_scan', 'manual', 'api') NOT NULL,
    verification_location VARCHAR(255),
    is_valid BOOLEAN,
    duplicate_check_passed BOOLEAN,
    rule_validations JSON,  -- AI validation results
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES alumni_cards(id) ON DELETE CASCADE,
    INDEX idx_card_id (card_id),
    INDEX idx_verified_at (verified_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI SYSTEM 5: KNOWLEDGE CAPSULES RANKING ENGINE
-- ============================================================================

-- 8. Knowledge Capsule Rankings (AI-driven personalized)
CREATE TABLE capsule_rankings (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    capsule_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,  -- Personalized ranking per user
    relevance_score DECIMAL(5,4),  -- 0.0000 to 1.0000
    engagement_score DECIMAL(5,4),
    skill_match_score DECIMAL(5,4),
    credibility_score DECIMAL(5,4),
    final_rank_score DECIMAL(5,4),  -- Weighted combination
    ranking_factors JSON,  -- Detailed breakdown
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (capsule_id) REFERENCES knowledge_capsules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_capsule (capsule_id, user_id),
    INDEX idx_capsule_id (capsule_id),
    INDEX idx_user_id (user_id),
    INDEX idx_final_rank_score (final_rank_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI SYSTEM 6: ENGAGEMENT SCORING MODEL (already in original schema)
-- Tables: engagement_scores, contribution_history, badges, user_badges
-- No additional tables needed - using existing tables
-- ============================================================================

-- ============================================================================
-- ML MODEL MANAGEMENT
-- ============================================================================

-- 9. ML Model Metadata (for versioning and tracking)
CREATE TABLE ml_models (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    model_type ENUM('clustering', 'classification', 'regression', 'ranking', 'embedding') NOT NULL,
    framework VARCHAR(50),  -- scikit-learn, pytorch, tensorflow, etc.
    model_file_path VARCHAR(500),
    hyperparameters JSON,
    training_metrics JSON,
    accuracy DECIMAL(5,4),
    status ENUM('training', 'active', 'deprecated') DEFAULT 'training',
    trained_at TIMESTAMP,
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_model_version (model_name, model_version),
    INDEX idx_model_name (model_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI PROCESSING QUEUE
-- ============================================================================

-- 10. AI Processing Queue (background job tracking)
CREATE TABLE ai_processing_queue (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    task_type ENUM('skill_graph', 'career_prediction', 'talent_clustering', 'id_validation', 'capsule_ranking', 'engagement_scoring') NOT NULL,
    priority INT DEFAULT 5,  -- 1=highest, 10=lowest
    payload JSON NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    worker_id VARCHAR(100),
    result JSON,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_priority (status, priority),
    INDEX idx_task_type (task_type),
    INDEX idx_scheduled_at (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STORED PROCEDURES FOR AI SYSTEMS
-- ============================================================================

DELIMITER //

-- Procedure to trigger AI pipeline after dataset upload
CREATE PROCEDURE trigger_ai_pipeline(IN p_upload_id VARCHAR(50))
BEGIN
    DECLARE v_file_type VARCHAR(20);
    
    -- Get file type
    SELECT file_type INTO v_file_type
    FROM dataset_uploads
    WHERE id = p_upload_id;
    
    -- Queue appropriate AI tasks based on file type
    IF v_file_type = 'alumni' THEN
        -- Skill Graph Update
        INSERT INTO ai_processing_queue (task_type, priority, payload)
        VALUES ('skill_graph', 5, JSON_OBJECT('upload_id', p_upload_id));
        
        -- Career Path Model Retraining
        INSERT INTO ai_processing_queue (task_type, priority, payload)
        VALUES ('career_prediction', 7, JSON_OBJECT('upload_id', p_upload_id));
        
        -- Talent Heatmap Recalculation
        INSERT INTO ai_processing_queue (task_type, priority, payload)
        VALUES ('talent_clustering', 8, JSON_OBJECT('upload_id', p_upload_id));
        
        -- Engagement Score Recalculation
        INSERT INTO ai_processing_queue (task_type, priority, payload)
        VALUES ('engagement_scoring', 6, JSON_OBJECT('upload_id', p_upload_id));
    END IF;
    
    IF v_file_type = 'job_market' THEN
        -- Skill Graph Update (industry connections)
        INSERT INTO ai_processing_queue (task_type, priority, payload)
        VALUES ('skill_graph', 5, JSON_OBJECT('upload_id', p_upload_id, 'type', 'job_market'));
    END IF;
    
    IF v_file_type = 'educational' THEN
        -- Career Prediction Update
        INSERT INTO ai_processing_queue (task_type, priority, payload)
        VALUES ('career_prediction', 7, JSON_OBJECT('upload_id', p_upload_id));
        
        -- Capsule Ranking Refresh
        INSERT INTO ai_processing_queue (task_type, priority, payload)
        VALUES ('capsule_ranking', 6, JSON_OBJECT('upload_id', p_upload_id));
    END IF;
END //

-- Procedure to calculate personalized capsule rank
CREATE PROCEDURE calculate_capsule_rank(
    IN p_user_id VARCHAR(50),
    IN p_capsule_id VARCHAR(50)
)
BEGIN
    DECLARE v_skill_match DECIMAL(5,4);
    DECLARE v_engagement DECIMAL(5,4);
    DECLARE v_credibility DECIMAL(5,4);
    DECLARE v_recency DECIMAL(5,4);
    DECLARE v_final_score DECIMAL(5,4);
    
    -- Calculate skill match (Jaccard similarity)
    -- This would be calculated by Python backend, stored here
    SET v_skill_match = 0.75;  -- Placeholder
    
    -- Calculate engagement score (normalized)
    SELECT 
        (0.4 * (views_count / (SELECT MAX(views_count) FROM knowledge_capsules)) +
         0.35 * (likes_count / (SELECT MAX(likes_count) FROM knowledge_capsules)) +
         0.25 * (bookmarks_count / (SELECT MAX(bookmarks_count) FROM knowledge_capsules)))
    INTO v_engagement
    FROM knowledge_capsules
    WHERE id = p_capsule_id;
    
    -- Calculate credibility (author's engagement score)
    SELECT IFNULL(total_score / 1000, 0.5) INTO v_credibility
    FROM knowledge_capsules kc
    JOIN engagement_scores es ON kc.author_id = es.user_id
    WHERE kc.id = p_capsule_id;
    
    -- Calculate recency (exponential decay)
    SELECT EXP(-0.01 * DATEDIFF(NOW(), created_at)) INTO v_recency
    FROM knowledge_capsules
    WHERE id = p_capsule_id;
    
    -- Calculate final score (weighted combination)
    SET v_final_score = (
        0.30 * v_skill_match +
        0.25 * v_engagement +
        0.20 * v_credibility +
        0.15 * v_recency +
        0.10 * 0.80  -- Content relevance (from LLM, placeholder)
    );
    
    -- Insert or update ranking
    INSERT INTO capsule_rankings (
        capsule_id, user_id, 
        skill_match_score, engagement_score, credibility_score, 
        final_rank_score, calculated_at
    )
    VALUES (
        p_capsule_id, p_user_id,
        v_skill_match, v_engagement, v_credibility,
        v_final_score, NOW()
    )
    ON DUPLICATE KEY UPDATE
        skill_match_score = v_skill_match,
        engagement_score = v_engagement,
        credibility_score = v_credibility,
        final_rank_score = v_final_score,
        calculated_at = NOW();
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS FOR AI SYSTEMS
-- ============================================================================

DELIMITER //

-- Trigger to queue skill graph update when new alumni added
CREATE TRIGGER after_alumni_profile_insert
AFTER INSERT ON alumni_profiles
FOR EACH ROW
BEGIN
    INSERT INTO ai_processing_queue (task_type, priority, payload)
    VALUES ('skill_graph', 8, JSON_OBJECT('profile_id', NEW.id, 'trigger', 'new_profile'));
END //

-- Trigger to queue career prediction update on career path change
CREATE TRIGGER after_career_path_insert
AFTER INSERT ON career_paths
FOR EACH ROW
BEGIN
    INSERT INTO ai_processing_queue (task_type, priority, payload)
    VALUES ('career_prediction', 7, JSON_OBJECT('path_id', NEW.id, 'trigger', 'new_transition'));
END //

-- Trigger to recalculate engagement score on major activity
CREATE TRIGGER after_contribution_insert
AFTER INSERT ON contribution_history
FOR EACH ROW
BEGIN
    -- Queue engagement score recalculation
    INSERT INTO ai_processing_queue (task_type, priority, payload)
    VALUES ('engagement_scoring', 9, JSON_OBJECT('user_id', NEW.user_id, 'trigger', 'contribution'));
END //

DELIMITER ;

-- ============================================================================
-- VIEWS FOR AI ANALYTICS
-- ============================================================================

-- View for skill popularity and trends
CREATE VIEW skill_popularity_trends AS
SELECT 
    sg.skill_name,
    sg.alumni_count,
    sg.job_count,
    sg.popularity_score,
    COUNT(DISTINCT ap.user_id) as current_alumni_with_skill,
    COUNT(DISTINCT j.id) as current_jobs_requiring_skill
FROM skill_graph sg
LEFT JOIN alumni_profiles ap ON JSON_CONTAINS(ap.skills, JSON_QUOTE(sg.skill_name))
LEFT JOIN jobs j ON JSON_CONTAINS(j.skills_required, JSON_QUOTE(sg.skill_name))
GROUP BY sg.skill_name, sg.alumni_count, sg.job_count, sg.popularity_score;

-- View for career path success analysis
CREATE VIEW career_path_success_analysis AS
SELECT 
    ctm.from_role,
    ctm.to_role,
    ctm.transition_count,
    ctm.transition_probability,
    ctm.avg_duration_months,
    ctm.success_rate,
    COUNT(DISTINCT cp.user_id) as alumni_who_made_transition
FROM career_transition_matrix ctm
LEFT JOIN career_paths cp ON 
    ctm.from_role = cp.from_role AND 
    ctm.to_role = cp.to_role
GROUP BY ctm.from_role, ctm.to_role, ctm.transition_count, 
         ctm.transition_probability, ctm.avg_duration_months, ctm.success_rate;

-- View for talent cluster insights
CREATE VIEW talent_cluster_insights AS
SELECT 
    tc.cluster_name,
    tc.center_latitude,
    tc.center_longitude,
    tc.cluster_size,
    tc.cluster_density,
    JSON_LENGTH(tc.alumni_ids) as actual_alumni_count,
    tc.dominant_skills,
    tc.dominant_industries
FROM talent_clusters tc;

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Additional composite indexes for AI queries
CREATE INDEX idx_alumni_skills ON alumni_profiles((JSON_LENGTH(skills)));
CREATE INDEX idx_job_skills ON jobs((JSON_LENGTH(skills_required)));
CREATE INDEX idx_capsule_engagement ON knowledge_capsules(views_count, likes_count, bookmarks_count);
CREATE INDEX idx_ai_queue_status_scheduled ON ai_processing_queue(status, scheduled_at);

-- ============================================================================
-- INITIAL DATA SEEDING FOR AI SYSTEMS
-- ============================================================================

-- Seed initial ML models
INSERT INTO ml_models (model_name, model_version, model_type, framework, status) VALUES
('skill_embeddings_model', 'v1.0', 'embedding', 'sentence-transformers', 'active'),
('career_predictor', 'v1.0', 'classification', 'scikit-learn', 'active'),
('talent_clustering', 'v1.0', 'clustering', 'scikit-learn', 'active'),
('capsule_ranking', 'v1.0', 'ranking', 'custom', 'active'),
('engagement_calculator', 'v1.0', 'regression', 'custom', 'active');

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

-- Table Comments
ALTER TABLE dataset_uploads COMMENT = 'Tracks admin dataset uploads for AI processing';
ALTER TABLE dataset_processing_logs COMMENT = 'Logs each stage of dataset processing pipeline';
ALTER TABLE skill_embeddings COMMENT = 'Stores 384-dim embeddings for semantic skill matching';
ALTER TABLE skill_similarities COMMENT = 'Precomputed skill similarity matrix for fast lookups';
ALTER TABLE career_transition_matrix COMMENT = 'ML-calculated career transition probabilities';
ALTER TABLE talent_clusters COMMENT = 'Geographic clusters of alumni talent';
ALTER TABLE alumni_id_verifications COMMENT = 'AI-validated digital alumni ID verification records';
ALTER TABLE capsule_rankings COMMENT = 'Personalized knowledge capsule rankings per user';
ALTER TABLE ml_models COMMENT = 'ML model versioning and metadata tracking';
ALTER TABLE ai_processing_queue COMMENT = 'Background AI task queue for async processing';

-- ============================================================================
-- GRANT PERMISSIONS FOR AI PROCESSING
-- ============================================================================

-- Grant permissions to AI processing service user
-- CREATE USER 'ai_processor'@'%' IDENTIFIED BY 'ai_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON alumni_portal.dataset_uploads TO 'ai_processor'@'%';
-- GRANT SELECT, INSERT ON alumni_portal.dataset_processing_logs TO 'ai_processor'@'%';
-- GRANT SELECT, INSERT, UPDATE ON alumni_portal.skill_embeddings TO 'ai_processor'@'%';
-- GRANT SELECT, INSERT, UPDATE ON alumni_portal.skill_similarities TO 'ai_processor'@'%';
-- GRANT SELECT, INSERT, UPDATE ON alumni_portal.career_transition_matrix TO 'ai_processor'@'%';
-- GRANT SELECT, INSERT, UPDATE ON alumni_portal.talent_clusters TO 'ai_processor'@'%';
-- GRANT SELECT, INSERT ON alumni_portal.alumni_id_verifications TO 'ai_processor'@'%';
-- GRANT SELECT, INSERT, UPDATE ON alumni_portal.capsule_rankings TO 'ai_processor'@'%';
-- GRANT SELECT, INSERT, UPDATE ON alumni_portal.ml_models TO 'ai_processor'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON alumni_portal.ai_processing_queue TO 'ai_processor'@'%';
-- GRANT EXECUTE ON alumni_portal.* TO 'ai_processor'@'%';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- END OF AI SYSTEMS SCHEMA
-- ============================================================================

-- Verification queries to ensure schema is correct
-- SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'alumni_portal';
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'alumni_portal' AND table_name LIKE '%ai%';
-- SHOW TABLES LIKE '%dataset%';
-- SHOW TABLES LIKE '%skill%';

-- Notes:
-- 1. This schema adds 10 new tables for AI systems
-- 2. All tables use InnoDB engine for ACID compliance
-- 3. Foreign key relationships maintain data integrity
-- 4. Indexes optimize AI query performance
-- 5. Stored procedures automate AI pipeline triggering
-- 6. Triggers enable real-time AI updates
-- 7. Views provide convenient analytics access
-- 8. JSON columns enable flexible AI metadata storage
-- 9. Compatible with MySQL 8.0+ and MariaDB 10.5+
-- 10. Designed for horizontal scalability with read replicas
