# 🔧 BACKEND WORKFLOW - Alumni Portal System

## Overview
This workflow outlines the complete backend development for the Alumni Portal, divided into phases of 4-5 credits each. Each phase builds upon the previous one and includes testing checkpoints.

## 🗄️ Database Schema
**IMPORTANT**: A comprehensive MySQL 8.0 / MariaDB 10.5+ compatible database schema is available in `/app/database_schema.sql`. This schema covers all phases and must be imported before starting backend development.

### Database Setup Instructions
1. **Using MySQL 8.0 CLI**:
   ```bash
   mysql -u root -p < /app/database_schema.sql
   ```

2. **Using MariaDB CLI**:
   ```bash
   mariadb -u root -p < /app/database_schema.sql
   ```

3. **Connection Configuration**:
   - Database Name: `alumni_portal`
   - Default Character Set: `utf8mb4`
   - Collation: `utf8mb4_unicode_ci`
   - Update your backend `.env` file with MySQL/MariaDB connection string

### Schema Overview
The database schema includes:
- ✅ 40+ normalized tables covering all features
- ✅ Foreign key relationships and constraints
- ✅ Optimized indexes for query performance
- ✅ JSON columns for flexible data storage
- ✅ Triggers for automatic data updates
- ✅ Stored procedures for complex operations
- ✅ Views for common complex queries
- ✅ Initial data seeding for badges and config

### Note for LLM API Integration
When using MySQL/MariaDB with the backend:
- Replace MongoDB connection code with MySQL connector (e.g., `mysql-connector-python` or `aiomysql` for async)
- Use SQL queries instead of MongoDB queries
- Leverage stored procedures for complex operations
- JSON columns support flexible schemas similar to MongoDB documents

---

## 📋 PHASE 1: Core Authentication & User Management System (4-5 credits)

### Objectives
- Implement secure JWT-based authentication
- Create user registration and login flows
- Set up role-based access control (Student, Alumni, Recruiter, Admin)
- Implement password reset functionality

### Tasks
1. **Database Models & Schema**
   - **Tables**: `users`, `email_verifications`, `password_resets` (already defined in `/app/database_schema.sql`)
   - User fields: id (UUID), email, password_hash, role, is_verified, is_active, last_login, timestamps
   - EmailVerification fields: id, user_id, otp_code, expires_at, is_used
   - PasswordReset fields: id, user_id, reset_token, expires_at, is_used
   - **Note**: All primary keys use UUID format for better distribution

2. **Authentication Endpoints**
   - POST `/api/auth/register` - User registration with email verification
   - POST `/api/auth/login` - Login with JWT token generation
   - POST `/api/auth/verify-email` - OTP verification
   - POST `/api/auth/forgot-password` - Request password reset
   - POST `/api/auth/reset-password` - Reset password with token
   - GET `/api/auth/me` - Get current user info (protected)
   - POST `/api/auth/logout` - Logout (token invalidation)

3. **Security Implementation**
   - Password hashing with bcrypt
   - JWT token generation and validation
   - Role-based middleware decorators
   - Email service integration (SMTP/SendGrid)
   - Rate limiting for sensitive endpoints

4. **Testing Checkpoints**
   - Test registration flow with email verification
   - Test login with valid/invalid credentials
   - Test password reset flow
   - Verify JWT token validation
   - Test role-based access control

### Deliverables
- Authentication routes module
- User models with proper validations
- JWT middleware for protected routes
- Email service for OTP and notifications
- Security middleware (rate limiting, CORS)

---

## 📋 PHASE 2: Alumni Profile System & Advanced Search (4-5 credits)

### Objectives
- Implement comprehensive alumni profile management
- Create profile completion tracking
- Build advanced search and filtering system
- Implement admin verification workflow

### Tasks
1. **Database Models**
   - **Tables**: `alumni_profiles`, `profile_verification_requests` (already defined in `/app/database_schema.sql`)
   - AlumniProfile fields include:
     - Basic: photo_url, name, bio, headline
     - Professional: current_company, current_role, location, batch_year, experience_timeline (JSON)
     - Educational: education_details (JSON)
     - Additional: skills (JSON array), achievements (JSON array), social_links (JSON object)
     - Metadata: profile_completion_percentage, is_verified, verified_by, verified_at
   - ProfileVerificationRequest fields: id, user_id, status, rejection_reason, reviewed_by, reviewed_at
   - **Stored Procedure**: Use `calculate_profile_completion(user_id)` to auto-calculate completion %

2. **Profile Management Endpoints**
   - POST `/api/profiles/create` - Create alumni profile
   - GET `/api/profiles/{user_id}` - Get profile by user ID
   - PUT `/api/profiles/{user_id}` - Update profile
   - DELETE `/api/profiles/{user_id}` - Delete profile (admin only)
   - GET `/api/profiles/me` - Get current user's profile
   - POST `/api/profiles/upload-cv` - Upload CV file (with file storage)

3. **Search & Filter Endpoints**
   - GET `/api/profiles/search` - Advanced search with query params:
     - name, company, skills, batch_year, job_role, location
     - verified_only (boolean filter)
   - GET `/api/profiles/filters/options` - Get filter options (unique companies, skills, locations)
   - GET `/api/profiles/directory` - Paginated alumni directory

4. **Admin Verification System**
   - POST `/api/admin/profiles/verify/{user_id}` - Approve profile verification
   - POST `/api/admin/profiles/reject/{user_id}` - Reject verification with reason
   - GET `/api/admin/profiles/pending` - Get pending verification requests

5. **Profile Completion Calculator**
   - Implement logic to calculate profile completion percentage
   - Auto-update on profile changes

### Testing Checkpoints
- Create and update alumni profiles
- Test file upload for CV and photos
- Verify search with different filter combinations
- Test admin verification workflow
- Validate profile completion calculation

### Deliverables
- Alumni profile models and endpoints
- Search and filter functionality
- Admin verification system
- File upload handling (AWS S3/local storage)
- Profile completion tracking

---

## 📋 PHASE 3: Jobs & Career Management Module (4-5 credits)

### Objectives
- Implement job posting and management
- Create application tracking system
- Build recruiter dashboard functionality

### Tasks
1. **Database Models**
   - **Tables**: `jobs`, `job_applications` (already defined in `/app/database_schema.sql`)
   - Job fields: id, title, description, company, location, job_type (ENUM), experience_required, skills_required (JSON), salary_range, apply_link, posted_by, application_deadline, status, views_count, applications_count
   - JobApplication fields: id, job_id, applicant_id, cv_url, cover_letter, status (ENUM: pending, reviewed, shortlisted, rejected, accepted), viewed_at, response_message, applied_at
   - **Triggers**: `after_job_application_insert` automatically updates applications_count
   - **View**: `job_statistics` provides aggregated job performance metrics
   - **Note**: Unique constraint on (job_id, applicant_id) prevents duplicate applications

2. **Job Management Endpoints**
   - POST `/api/jobs/create` - Create job posting (Alumni/Recruiter only)
   - GET `/api/jobs` - List all active jobs with filters (company, location, skills)
   - GET `/api/jobs/{job_id}` - Get job details
   - PUT `/api/jobs/{job_id}` - Update job (poster only)
   - DELETE `/api/jobs/{job_id}` - Delete job (poster/admin only)
   - POST `/api/jobs/{job_id}/close` - Close job posting

3. **Application Management Endpoints**
   - POST `/api/jobs/{job_id}/apply` - Apply for job (Student only)
   - GET `/api/jobs/{job_id}/applications` - Get all applications (poster only)
   - GET `/api/applications/my-applications` - Get user's applications
   - PUT `/api/applications/{app_id}/status` - Update application status
   - GET `/api/applications/{app_id}` - Get application details

4. **Recruiter Dashboard Endpoints**
   - GET `/api/recruiter/jobs` - Get recruiter's posted jobs
   - GET `/api/recruiter/analytics` - Get job posting analytics
   - GET `/api/recruiter/applications/summary` - Application statistics

### Testing Checkpoints
- Create, update, and delete job postings
- Test job application flow
- Verify application status tracking
- Test recruiter dashboard data
- Validate permissions (only poster can edit jobs)

### Deliverables
- Job and application models
- Complete job management system
- Application tracking functionality
- Recruiter analytics endpoints
- Email notifications for applications

---

## 📋 PHASE 4: Mentorship System & Session Management (4-5 credits)

### Objectives
- Implement mentor-mentee matching system
- Create mentorship request and approval workflow
- Build session scheduling and tracking

### Tasks
1. **Database Models**
   - **Tables**: `mentor_profiles`, `mentorship_requests`, `mentorship_sessions` (already defined in `/app/database_schema.sql`)
   - MentorProfile fields: id, user_id, is_available, expertise_areas (JSON array), max_mentees, current_mentees_count, rating (DECIMAL 3,2), total_sessions, total_reviews, mentorship_approach
   - MentorshipRequest fields: id, student_id, mentor_id, request_message, goals, preferred_topics (JSON), status (ENUM), rejection_reason, timestamps
   - MentorshipSession fields: id, mentorship_request_id, scheduled_date, duration, status (ENUM), meeting_link, agenda, notes, feedback, rating (1-5)
   - **Triggers**: 
     - `after_mentorship_accept` updates mentor's current_mentees_count
     - `after_session_feedback` automatically recalculates mentor rating
   - **View**: `mentor_statistics` provides mentor performance overview
   - **Note**: Unique constraint on (student_id, mentor_id, status) prevents duplicate active requests

2. **Mentor Management Endpoints**
   - POST `/api/mentors/register` - Register as mentor (Alumni only)
   - PUT `/api/mentors/availability` - Update availability status
   - GET `/api/mentors` - List available mentors with filters (expertise, rating)
   - GET `/api/mentors/{mentor_id}` - Get mentor profile and stats
   - PUT `/api/mentors/profile` - Update mentor profile

3. **Mentorship Request Endpoints**
   - POST `/api/mentorship/request` - Send mentorship request (Student only)
   - POST `/api/mentorship/{request_id}/accept` - Accept request (Mentor only)
   - POST `/api/mentorship/{request_id}/reject` - Reject request (Mentor only)
   - GET `/api/mentorship/requests/received` - Get received requests (Mentor)
   - GET `/api/mentorship/requests/sent` - Get sent requests (Student)
   - GET `/api/mentorship/active` - Get active mentorships

4. **Session Management Endpoints**
   - POST `/api/mentorship/{mentorship_id}/schedule` - Schedule session
   - GET `/api/mentorship/sessions` - Get all sessions
   - PUT `/api/mentorship/sessions/{session_id}` - Update session
   - POST `/api/mentorship/sessions/{session_id}/complete` - Mark complete
   - POST `/api/mentorship/sessions/{session_id}/feedback` - Submit feedback

5. **Smart Matching Algorithm (Optional)**
   - POST `/api/mentorship/match-suggestions` - Get mentor suggestions based on student profile

### Testing Checkpoints
- Register mentors and update availability
- Test mentorship request flow (send, accept, reject)
- Schedule and manage sessions
- Test session feedback and rating
- Verify mentor capacity limits

### Deliverables
- Mentor and mentorship models
- Complete request workflow
- Session scheduling system
- Feedback and rating mechanism
- Email notifications for requests and sessions

---

## 📋 PHASE 5: Events & Community Engagement (4-5 credits)

### Objectives
- Implement event creation and management
- Build RSVP and attendance tracking
- Create community forums and discussions

### Tasks
1. **Database Models**
   - **Tables**: `events`, `event_rsvps`, `forum_posts`, `forum_comments`, `post_likes`, `comment_likes` (already defined in `/app/database_schema.sql`)
   - Event fields: id, title, description, event_type (ENUM), location, is_virtual, meeting_link, start_date, end_date, registration_deadline, max_attendees, current_attendees_count, banner_image, created_by, status (ENUM), views_count
   - EventRSVP fields: id, event_id, user_id, status (ENUM: attending, maybe, not_attending), rsvp_date
   - ForumPost fields: id, title, content, author_id, tags (JSON array), likes_count, comments_count, views_count, is_pinned, is_deleted, timestamps
   - ForumComment fields: id, post_id, author_id, parent_comment_id, content, likes_count, is_deleted, timestamps
   - **Triggers**: 
     - `after_event_rsvp` updates event's current_attendees_count
     - `after_post_like_insert` updates post likes_count
     - `after_comment_insert` updates post comments_count
   - **Note**: 
     - Unique constraints on RSVP (event_id, user_id) and likes prevent duplicates
     - parent_comment_id enables nested comment threads
     - FULLTEXT indexes on title/content for better search performance

2. **Event Management Endpoints**
   - POST `/api/events/create` - Create event (Admin/Alumni only)
   - GET `/api/events` - List all events (upcoming/past filter)
   - GET `/api/events/{event_id}` - Get event details
   - PUT `/api/events/{event_id}` - Update event (creator/admin only)
   - DELETE `/api/events/{event_id}` - Delete event (creator/admin only)
   - POST `/api/events/{event_id}/rsvp` - RSVP to event
   - GET `/api/events/{event_id}/attendees` - Get event attendees
   - GET `/api/events/my-events` - Get user's registered events

3. **Forum Endpoints**
   - POST `/api/forum/posts` - Create forum post
   - GET `/api/forum/posts` - List posts with filters (tags, author)
   - GET `/api/forum/posts/{post_id}` - Get post with comments
   - PUT `/api/forum/posts/{post_id}` - Update post (author/admin only)
   - DELETE `/api/forum/posts/{post_id}` - Delete post (author/admin only)
   - POST `/api/forum/posts/{post_id}/like` - Like/unlike post
   - POST `/api/forum/posts/{post_id}/comments` - Add comment
   - PUT `/api/forum/comments/{comment_id}` - Update comment
   - DELETE `/api/forum/comments/{comment_id}` - Delete comment
   - POST `/api/forum/comments/{comment_id}/like` - Like/unlike comment

4. **Event Reminder System**
   - Implement background job/cron for event reminders
   - Send email notifications 24 hours before event

### Testing Checkpoints
- Create and manage events
- Test RSVP functionality
- Verify attendee limits
- Create forum posts and comments
- Test like functionality
- Verify event reminder system

### Deliverables
- Event management system
- RSVP and attendance tracking
- Community forum with comments
- Event reminder service
- Email notifications

---

## 📋 PHASE 6: Notifications & Real-time Updates (4-5 credits)

### Objectives
- Implement comprehensive notification system
- Create real-time notification delivery
- Build notification preferences

### Tasks
1. **Database Models**
   - **Tables**: `notifications`, `notification_preferences`, `email_queue` (already defined in `/app/database_schema.sql`)
   - Notification fields: id, user_id, type (ENUM: profile, mentorship, job, event, forum, system, verification), title, message, link, is_read, priority (ENUM: low, medium, high), metadata (JSON), read_at, created_at
   - NotificationPreference fields: id, user_id, email_notifications, push_notifications, notification_types (JSON object), notification_frequency (ENUM: instant, daily, weekly), quiet_hours_start, quiet_hours_end
   - EmailQueue fields: id, recipient_email, subject, body, template_name, status (ENUM), retry_count, error_message, scheduled_at, sent_at
   - **Stored Procedure**: `send_notification(user_id, type, title, message, link, priority)` for consistent notification creation
   - **Indexes**: Composite index on (user_id, is_read, created_at) for efficient unread queries
   - **Note**: email_queue table enables async email processing with retry logic

2. **Notification Endpoints**
   - GET `/api/notifications` - Get user's notifications (paginated)
   - GET `/api/notifications/unread-count` - Get unread count
   - PUT `/api/notifications/{notification_id}/read` - Mark as read
   - PUT `/api/notifications/read-all` - Mark all as read
   - DELETE `/api/notifications/{notification_id}` - Delete notification
   - GET `/api/notifications/preferences` - Get user preferences
   - PUT `/api/notifications/preferences` - Update preferences

3. **Notification Triggers**
   - Profile verification approval/rejection
   - Mentorship request received/accepted/rejected
   - Job application status update
   - New job posting matching user skills
   - Event reminder (24 hours before)
   - Forum post reply/comment
   - New follower/connection (if implemented)

4. **Notification Service**
   - Create centralized notification service
   - Implement email notification dispatch
   - Add in-app notification storage
   - Create notification templates

5. **Real-time Features (Optional)**
   - WebSocket connection for real-time notifications
   - Server-Sent Events (SSE) endpoint for live updates

### Testing Checkpoints
- Test notification creation for various triggers
- Verify email notification delivery
- Test notification preferences
- Verify unread count accuracy
- Test mark as read functionality

### Deliverables
- Notification models and endpoints
- Centralized notification service
- Email notification templates
- Notification preference system
- Real-time notification delivery (optional)

---

## 📋 PHASE 7: Admin Dashboard & Analytics (5 credits)

### Objectives
- Build comprehensive admin dashboard
- Implement analytics and reporting
- Create data visualization endpoints
- Develop admin management tools

### Tasks
1. **Database Models**
   - **Tables**: `admin_actions`, `system_metrics`, `content_flags`, `system_config` (already defined in `/app/database_schema.sql`)
   - AdminAction fields: id, admin_id, action_type (ENUM), target_type, target_id, description, metadata (JSON), ip_address, timestamp
   - SystemMetric fields: id, metric_name, metric_value (DECIMAL), metric_unit, category, recorded_at
   - ContentFlags fields: id, content_type (ENUM), content_id, flagged_by, reason, status (ENUM), reviewed_by, reviewed_at
   - SystemConfig fields: id, config_key (UNIQUE), config_value, config_type, description, is_public, updated_by
   - **Note**: 
     - admin_actions provides complete audit trail of all admin operations
     - system_metrics stores time-series data for analytics dashboards
     - Initial system config values are seeded automatically

2. **Admin Dashboard Endpoints**
   - GET `/api/admin/dashboard/metrics` - Get key metrics:
     - Total users (by role), verified alumni, pending verifications
     - Total jobs posted, active jobs, total applications
     - Total events, upcoming events, total RSVPs
     - Total mentorship requests, active mentorships
     - Forum posts count, comments count
   - GET `/api/admin/dashboard/charts` - Get chart data:
     - User growth over time
     - Job postings trend
     - Event participation trend
     - Mentorship activity
   - GET `/api/admin/audit-log` - Get admin action history

3. **Analytics Endpoints**
   - GET `/api/analytics/skills` - Top skills distribution
   - GET `/api/analytics/locations` - Alumni by location (with coordinates)
   - GET `/api/analytics/companies` - Top companies where alumni work
   - GET `/api/analytics/batches` - Alumni distribution by batch/year
   - GET `/api/analytics/job-trends` - Job posting trends by category
   - GET `/api/analytics/mentorship-stats` - Mentorship program statistics
   - GET `/api/analytics/event-participation` - Event participation rates
   - GET `/api/analytics/engagement` - User engagement metrics

4. **User Management Endpoints**
   - GET `/api/admin/users` - List all users with filters
   - GET `/api/admin/users/{user_id}` - Get user details
   - PUT `/api/admin/users/{user_id}` - Update user (role, status)
   - DELETE `/api/admin/users/{user_id}` - Delete user (soft delete)
   - POST `/api/admin/users/{user_id}/suspend` - Suspend user
   - POST `/api/admin/users/{user_id}/activate` - Activate user

5. **Content Moderation Endpoints**
   - GET `/api/admin/content/flagged` - Get flagged content
   - POST `/api/admin/content/moderate` - Moderate content (approve/reject)
   - DELETE `/api/admin/content/{type}/{id}` - Remove content

6. **System Configuration**
   - GET `/api/admin/settings` - Get system settings
   - PUT `/api/admin/settings` - Update system settings

### Testing Checkpoints
- Verify all metrics calculations
- Test analytics endpoints for data accuracy
- Validate user management operations
- Test content moderation workflow
- Verify admin audit logging

### Deliverables
- Admin dashboard with key metrics
- Analytics endpoints with data visualization data
- User management system
- Content moderation tools
- Admin audit logging
- System configuration management

---

## 📋 PHASE 8: Advanced Features - Smart Algorithms (4-5 credits)

### Objectives
- Implement skill-based mentor matching
- Create smart job recommendations
- Build interest-based content recommendations
- Develop engagement scoring system

### Tasks
1. **Database Models**
   - **Tables**: `user_interests`, `engagement_scores`, `contribution_history`, `badges`, `user_badges` (already defined in `/app/database_schema.sql`)
   - UserInterest fields: id, user_id, interest_tags (JSON), interaction_history (JSON), preferred_industries (JSON), preferred_locations (JSON), last_updated
   - EngagementScore fields: id, user_id, total_score, contributions (JSON object with breakdown), rank_position, level (string), last_calculated
   - ContributionHistory fields: id, user_id, contribution_type (ENUM), points_earned, description, created_at
   - Badges fields: id, name (UNIQUE), description, icon_url, requirements (JSON), rarity (ENUM), points
   - UserBadges fields: id, user_id, badge_id, earned_at
   - **Stored Procedure**: `update_engagement_score(user_id)` calculates and updates engagement metrics automatically
   - **View**: `engagement_leaderboard` provides ranked list of top contributors
   - **Note**: 
     - 8 default badges are pre-seeded in the database
     - Engagement score updates can be triggered after significant user actions

2. **Smart Matching Endpoints**
   - POST `/api/matching/mentor-suggestions` - Get mentor suggestions:
     - Algorithm: Match student skills/interests with mentor expertise
     - Consider: mentor availability, rating, capacity
   - POST `/api/matching/job-recommendations` - Get job recommendations:
     - Algorithm: Match user skills with job requirements
     - Consider: user experience, preferences, location
   - POST `/api/matching/alumni-connections` - Suggest alumni to connect:
     - Algorithm: Similar skills, companies, locations, batch years

3. **Recommendation System Endpoints**
   - GET `/api/recommendations/events` - Recommend events based on interests
   - GET `/api/recommendations/posts` - Recommend forum posts
   - GET `/api/recommendations/alumni` - Recommend alumni to follow

4. **Engagement Scoring System**
   - POST `/api/engagement/calculate` - Calculate user engagement score:
     - Factors: profile completeness, mentorship participation
     - Job applications, event attendance, forum activity
     - Time since last login, contributions
   - GET `/api/engagement/leaderboard` - Get engagement leaderboard
   - GET `/api/engagement/my-score` - Get current user's score

5. **Algorithm Implementation**
   - Cosine similarity for skill matching
   - Collaborative filtering for recommendations
   - Weighted scoring for engagement calculation
   - Ranking algorithm for search results

### Testing Checkpoints
- Test mentor matching accuracy
- Verify job recommendations relevance
- Test engagement score calculation
- Validate recommendation quality
- Test leaderboard rankings

### Deliverables
- Smart matching algorithms
- Recommendation engine
- Engagement scoring system
- Leaderboard functionality
- Algorithm optimization

---

## 📋 PHASE 9: Innovative Features Implementation (5 credits)

### Objectives
- Implement unique differentiating features
- Create data visualization structures
- Build advanced career analytics
- Develop community intelligence features

### Tasks
1. **Skill Graph Engine**
   - **Tables**: `skill_graph` (already defined in `/app/database_schema.sql`)
   - SkillGraph fields: id, skill_name (UNIQUE), related_skills (JSON array), industry_connections (JSON array), alumni_count, job_count, popularity_score
   - Endpoints:
     - GET `/api/skill-graph/network` - Get skill network data
     - GET `/api/skill-graph/paths` - Find career paths by skill
     - GET `/api/skill-graph/clusters` - Get skill clusters
   - **Note**: Skill graph auto-populates from alumni profiles and job postings

2. **Career Path Predictor**
   - **Tables**: `career_paths`, `career_predictions` (already defined in `/app/database_schema.sql`)
   - CareerPath fields: id, user_id, from_role, to_role, from_company, to_company, transition_duration_months, skills_acquired (JSON), transition_date, success_rating (1-5), notes
   - CareerPrediction fields: id, user_id, current_role, predicted_roles (JSON array with probability), recommended_skills (JSON), similar_alumni (JSON), confidence_score
   - Endpoints:
     - POST `/api/career/predict` - Predict career trajectory using ML algorithms
     - GET `/api/career/paths/{skill}` - Common paths for skill
     - GET `/api/career/transitions` - Popular career transitions
   - **Note**: Predictions based on historical career path data from alumni

3. **Alumni Engagement Score (AES)**
   - **Tables**: `engagement_scores`, `contribution_history`, `badges`, `user_badges` (already defined)
   - Use existing engagement system with stored procedure `update_engagement_score(user_id)`
   - Endpoints:
     - GET `/api/aes/rankings` - Get AES leaderboard (can use `engagement_leaderboard` view)
     - GET `/api/aes/user/{user_id}` - Get user AES details
     - GET `/api/aes/badges` - Get achievement badges
   - **Note**: Engagement scores auto-calculate from profile, mentorship, jobs, events, and forum activity

4. **Digital Alumni ID Card**
   - **Tables**: `alumni_cards` (already defined in `/app/database_schema.sql`)
   - AlumniCard fields: id, user_id (UNIQUE), card_number (UNIQUE), qr_code_data (encrypted), issue_date, expiry_date, is_active, verification_count, last_verified
   - Endpoints:
     - POST `/api/alumni-card/generate` - Generate digital ID with QR code
     - GET `/api/alumni-card/{user_id}` - Get alumni card
     - POST `/api/alumni-card/verify` - Verify card via QR code scan
   - **Note**: QR code contains encrypted verification data; card_number format: ALM-YYYY-XXXXX

5. **Talent & Opportunity Heatmap**
   - **Tables**: `geographic_data` (already defined in `/app/database_schema.sql`)
   - GeographicData fields: id, location_name (UNIQUE), country, city, latitude, longitude, alumni_count, jobs_count, top_skills (JSON), top_companies (JSON), top_industries (JSON), last_updated
   - Endpoints:
     - GET `/api/heatmap/talent` - Talent distribution by location with coordinates
     - GET `/api/heatmap/opportunities` - Job opportunities by location
     - GET `/api/heatmap/industries` - Industry distribution
   - **Note**: Data aggregated from alumni profiles and job locations; includes lat/long for map visualization

6. **Knowledge Capsules System**
   - **Tables**: `knowledge_capsules`, `capsule_bookmarks`, `capsule_likes` (already defined in `/app/database_schema.sql`)
   - KnowledgeCapsule fields: id, title, content, author_id, category (ENUM), tags (JSON), duration_minutes, featured_image, likes_count, views_count, bookmarks_count, is_featured
   - Endpoints:
     - POST `/api/capsules/create` - Create capsule (Alumni only)
     - GET `/api/capsules` - List capsules with filters (category, tags, featured)
     - GET `/api/capsules/{capsule_id}` - Get capsule details
     - POST `/api/capsules/{capsule_id}/like` - Like/unlike capsule
     - POST `/api/capsules/{capsule_id}/bookmark` - Bookmark capsule
     - GET `/api/capsules/trending` - Get trending capsules (by views/likes)
   - **Note**: 
     - FULLTEXT index on title/content enables powerful search
     - Separate tables for likes and bookmarks with unique constraints

### Testing Checkpoints
- Test skill graph data generation
- Verify career prediction accuracy
- Test AES calculation and rankings
- Validate digital ID card generation
- Test heatmap data aggregation
- Verify knowledge capsules CRUD

### Deliverables
- Skill graph visualization data
- Career prediction engine
- Enhanced engagement scoring
- Digital ID card system
- Geographic heatmap data
- Knowledge capsules platform

---

## 📋 PHASE 10: Performance, Security & Deployment (4-5 credits)

### Objectives
- Optimize database queries and API performance
- Implement comprehensive security measures
- Set up monitoring and logging
- Prepare for production deployment

### Tasks
1. **Performance Optimization**
   - Add database indexes for frequently queried fields
   - Implement caching with Redis (optional)
   - Optimize complex queries (aggregations, joins)
   - Add pagination for all list endpoints
   - Implement request throttling
   - Add response compression

2. **Security Enhancements**
   - Implement rate limiting per endpoint
   - Add input validation and sanitization
   - Set up CSRF protection
   - Implement API key authentication for external services
   - Add SQL injection prevention
   - Set up security headers
   - Implement file upload validation (size, type)

3. **Error Handling & Logging**
   - Standardize error responses
   - Implement comprehensive logging:
     - API requests/responses
     - Database queries
     - Authentication attempts
     - Admin actions
   - Set up error tracking (Sentry integration)
   - Create health check endpoints

4. **Testing & Documentation**
   - Write API documentation (OpenAPI/Swagger)
   - Create Postman collection
   - Write integration tests for critical flows
   - Create database backup scripts

5. **Deployment Setup**
   - Configure environment variables
   - Set up production database (MongoDB Atlas)
   - Configure file storage (AWS S3)
   - Set up email service (SendGrid/SES)
   - Create deployment scripts
   - Set up CI/CD pipeline (optional)

6. **Monitoring & Health Checks**
   - GET `/api/health` - Health check endpoint
   - GET `/api/health/db` - Database connection check
   - GET `/api/metrics` - Performance metrics
   - Set up application monitoring

### Testing Checkpoints
- Load test critical endpoints
- Verify rate limiting works
- Test error handling for edge cases
- Validate security measures
- Test health check endpoints
- Verify deployment configuration

### Deliverables
- Optimized and indexed database
- Comprehensive security implementation
- Complete API documentation
- Production-ready deployment configuration
- Monitoring and logging setup
- Test coverage for critical flows

---

## 🎯 Summary

**Total Phases: 10**
**Total Estimated Credits: 45-50 credits**

### Phase Overview:
1. ✅ Core Authentication (4-5 credits)
2. ✅ Alumni Profiles & Search (4-5 credits)
3. ✅ Jobs & Career Module (4-5 credits)
4. ✅ Mentorship System (4-5 credits)
5. ✅ Events & Community (4-5 credits)
6. ✅ Notifications System (4-5 credits)
7. ✅ Admin Dashboard & Analytics (5 credits)
8. ✅ Smart Algorithms (4-5 credits)
9. ✅ Innovative Features (5 credits)
10. ✅ Performance & Deployment (4-5 credits)

### Execution Strategy:
- Each phase is independently testable
- Phases build upon previous functionality
- Can be executed sequentially or with minor parallelization
- Regular testing checkpoints ensure quality
- Documentation created alongside development

### Dependencies:
- Phase 1 must complete before all others
- Phase 2 required before Phase 3, 4, 7, 8
- Phase 6 can run parallel to Phases 3-5
- Phase 9 requires Phases 2-4 completion
- Phase 10 is the final integration phase

---

**Note**: Each phase includes comprehensive testing, error handling, and documentation to ensure production-ready code quality.
