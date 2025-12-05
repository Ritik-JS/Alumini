# 🔧 COMPREHENSIVE BACKEND WORKFLOW - AlumUnity System
## Production-Ready Backend with AI Systems Integration

## Overview
This workflow outlines the complete backend development for AlumUnity, divided into **11 phases** of 4-5 credits each. The workflow now includes **6 AI/ML Systems** and an **Admin Dataset Upload Pipeline** for intelligent features.

## 🗄️ Database Schema
**IMPORTANT**: A comprehensive MySQL 8.0 / MariaDB 10.5+ compatible database schema is available in `/app/database_schema.sql`. This schema includes **all base tables + AI system tables** and must be imported before starting backend development.

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
- ✅ 50+ normalized tables covering all features + AI systems
- ✅ Foreign key relationships and constraints
- ✅ Optimized indexes for query performance
- ✅ JSON columns for flexible data storage
- ✅ Triggers for automatic data updates
- ✅ Stored procedures for complex operations
- ✅ Views for common complex queries
- ✅ Initial data seeding for badges and config
- ✅ **AI System Tables**: skill_embeddings, career_transition_matrix, talent_clusters, etc.
- ✅ **Dataset Upload Tables**: dataset_uploads, dataset_processing_logs, ai_processing_queue

## 🛠️ Technology Stack

### Backend Core
```python
FastAPI==0.110.1          # Modern async web framework
uvicorn==0.25.0           # ASGI server
aiomysql==0.2.0           # Async MySQL driver
redis==5.0.0              # Redis client for caching
celery==5.3.4             # Background task queue
```

### AI/ML Stack (Phase 10)
```python
# Python ML Libraries
scikit-learn==1.4.0       # ML algorithms (clustering, classification)
pandas==2.2.0             # Data manipulation
numpy==1.26.0             # Numerical computing
scipy==1.12.0             # Scientific computing

# Embeddings & Similarity
sentence-transformers==2.3.1  # Text embeddings for skill matching
faiss-cpu==1.7.4          # Fast similarity search

# LLM Integration (via Emergent LLM Key)
openai==1.10.0            # For GPT models
anthropic==0.18.0         # For Claude models
google-generativeai==0.3.2  # For Gemini models
```

### Data Processing
```python
python-multipart==0.0.9   # File upload handling
openpyxl==3.1.2          # Excel file processing
xlrd==2.0.1              # Legacy Excel support
```

### Security & Auth
```python
python-jose==3.3.0        # JWT tokens
passlib==1.7.4           # Password hashing
bcrypt==4.1.3            # Secure hashing
pyjwt==2.10.1            # JWT implementation
```

---

## 📋 PHASE 1: Core Authentication & User Management System (4-5 credits)
**STATUS**: ✅ COMPLETED

### Implementation Notes
**Database**: Database `AlumUnity` must be already created with schema from `/app/database_schema.sql` imported.
**Email Service**: Mock email service implemented (logs to console). To enable SendGrid, add `SENDGRID_API_KEY` to `.env` file.
**Rate Limiting**: In-memory rate limiter implemented. For production, migrate to Redis-based rate limiting.
**JWT Secret**: Using existing placeholder. Generate secure key for production.
**Testing**: Manual testing with curl commands (see examples below).

### Objectives
- ✅ Implement secure JWT-based authentication
- ✅ Create user registration and login flows
- ✅ Set up role-based access control (Student, Alumni, Recruiter, Admin)
- ✅ Implement password reset functionality

### Tasks
1. **Database Models & Schema** ✅
   - **Tables**: `users`, `email_verifications`, `password_resets` (already defined in `/app/database_schema.sql`)
   - User fields: id (UUID), email, password_hash, role, is_verified, is_active, last_login, timestamps
   - EmailVerification fields: id, user_id, otp_code, expires_at, is_used
   - PasswordReset fields: id, user_id, reset_token, expires_at, is_used
   - **Note**: All primary keys use UUID format for better distribution
   - **Implementation**: Pydantic models created in `/app/backend/database/models.py`

2. **Authentication Endpoints** ✅
   - POST `/api/auth/register` - User registration with email verification
   - POST `/api/auth/login` - Login with JWT token generation
   - POST `/api/auth/verify-email` - OTP verification
   - POST `/api/auth/forgot-password` - Request password reset
   - POST `/api/auth/reset-password` - Reset password with token
   - GET `/api/auth/me` - Get current user info (protected)
   - POST `/api/auth/logout` - Logout (token invalidation)
   - POST `/api/auth/resend-verification` - Resend OTP (bonus endpoint)
   - **Implementation**: All routes in `/app/backend/routes/auth.py`

3. **Security Implementation** ✅
   - Password hashing with bcrypt - `/app/backend/utils/security.py`
   - JWT token generation and validation - `/app/backend/utils/security.py`
   - Role-based middleware decorators - `/app/backend/middleware/auth_middleware.py`
   - Email service integration (Mock + SendGrid ready) - `/app/backend/services/email_service.py`
   - Rate limiting for sensitive endpoints - `/app/backend/middleware/rate_limit.py`
     - Strict: 5 req/min (auth endpoints)
     - Moderate: 30 req/min (standard endpoints)
     - Relaxed: 100 req/min (read-only endpoints)

4. **Testing with cURL**
   ```bash
   # 1. Register a new user
   curl -X POST http://localhost:8001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "student@example.com",
       "password": "SecurePass123",
       "role": "student"
     }'
   
   # 2. Verify email (check console logs for OTP)
   curl -X POST http://localhost:8001/api/auth/verify-email \
     -H "Content-Type: application/json" \
     -d '{
       "email": "student@example.com",
       "otp_code": "123456"
     }'
   
   # 3. Login
   curl -X POST http://localhost:8001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "student@example.com",
       "password": "SecurePass123"
     }'
   
   # 4. Get current user (use token from login response)
   curl -X GET http://localhost:8001/api/auth/me \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   
   # 5. Forgot password
   curl -X POST http://localhost:8001/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{
       "email": "student@example.com"
     }'
   
   # 6. Reset password (check console logs for reset token)
   curl -X POST http://localhost:8001/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{
       "reset_token": "RESET_TOKEN_FROM_EMAIL",
       "new_password": "NewSecurePass456"
     }'
   
   # 7. Logout
   curl -X POST http://localhost:8001/api/auth/logout \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Deliverables
- ✅ Authentication routes module (`/app/backend/routes/auth.py`)
- ✅ User models with proper validations (`/app/backend/database/models.py`)
- ✅ JWT middleware for protected routes (`/app/backend/middleware/auth_middleware.py`)
- ✅ Email service for OTP and notifications (`/app/backend/services/email_service.py`)
- ✅ Security middleware (rate limiting, CORS) (`/app/backend/middleware/rate_limit.py`)
- ✅ User service for database operations (`/app/backend/services/user_service.py`)
- ✅ Authentication service with business logic (`/app/backend/services/auth_service.py`)
- ✅ Security utilities (password hashing, JWT) (`/app/backend/utils/security.py`)
- ✅ Input validators (`/app/backend/utils/validators.py`)
- ✅ Database connection management (`/app/backend/database/connection.py`)

### File Structure Created
```
/app/backend/
├── server.py (updated with auth routes)
├── .env (updated with AlumUnity database and email config)
├── requirements.txt (updated with sendgrid)
├── database/
│   ├── __init__.py
│   ├── connection.py
│   └── models.py
├── services/
│   ├── __init__.py
│   ├── auth_service.py
│   ├── user_service.py
│   └── email_service.py
├── routes/
│   ├── __init__.py
│   └── auth.py
├── middleware/
│   ├── __init__.py
│   ├── auth_middleware.py
│   └── rate_limit.py
└── utils/
    ├── __init__.py
    ├── security.py
    └── validators.py
```

### Next Phase
**PHASE 2**: Alumni Profile System & Advanced Search

---

## 📋 PHASE 2: Alumni Profile System & Advanced Search (4-5 credits)
**STATUS**: ✅ COMPLETED

### Implementation Notes
**Services Created**: Profile management service with full CRUD operations, admin verification service
**Models**: Comprehensive Pydantic models for profiles, verification, search and filters
**Routes**: Profile routes (`/app/backend/routes/profiles.py`) and admin routes (`/app/backend/routes/admin.py`)
**Profile Completion**: Utilizes stored procedure `calculate_profile_completion(user_id)` from database
**File Upload**: Placeholder implementation ready for S3/storage integration
**Search**: Advanced search with multiple filters (name, company, skills, location, batch year, verified status)
**Testing**: Manual testing recommended with curl commands (see examples below)

### Objectives
- ✅ Implement comprehensive alumni profile management
- ✅ Create profile completion tracking
- ✅ Build advanced search and filtering system
- ✅ Implement admin verification workflow

### Tasks
1. **Database Models** ✅
   - **Tables**: `alumni_profiles`, `profile_verification_requests` (already defined in `/app/database_schema.sql`)
   - AlumniProfile fields include:
     - Basic: photo_url, name, bio, headline
     - Professional: current_company, current_role, location, batch_year, experience_timeline (JSON)
     - Educational: education_details (JSON)
     - Additional: skills (JSON array), achievements (JSON array), social_links (JSON object)
     - Metadata: profile_completion_percentage, is_verified, verified_by, verified_at
   - ProfileVerificationRequest fields: id, user_id, status, rejection_reason, reviewed_by, reviewed_at
   - **Stored Procedure**: Use `calculate_profile_completion(user_id)` to auto-calculate completion %
   - **Implementation**: All models defined in `/app/backend/database/models.py`

2. **Profile Management Endpoints** ✅
   - POST `/api/profiles/create` - Create alumni profile ✅
   - GET `/api/profiles/{user_id}` - Get profile by user ID ✅
   - PUT `/api/profiles/{user_id}` - Update profile ✅
   - DELETE `/api/profiles/{user_id}` - Delete profile (admin only) ✅
   - GET `/api/profiles/me` - Get current user's profile ✅
   - POST `/api/profiles/upload-cv` - Upload CV file (placeholder for S3 integration) ✅
   - **Implementation**: `/app/backend/routes/profiles.py`

3. **Search & Filter Endpoints** ✅
   - GET `/api/profiles/search` - Advanced search with query params ✅
   - GET `/api/profiles/filters/options` - Get filter options ✅
   - GET `/api/profiles/directory` - Paginated alumni directory ✅
   - **Implementation**: Full-text search with multiple filter combinations

4. **Admin Verification System** ✅
   - POST `/api/admin/profiles/verify/{user_id}` - Approve profile verification ✅
   - POST `/api/admin/profiles/reject/{user_id}` - Reject verification with reason ✅
   - GET `/api/admin/profiles/pending` - Get pending verification requests ✅
   - GET `/api/admin/profiles/verification-requests` - Get all verification requests with status filter ✅
   - GET `/api/admin/profiles/verification-status/{user_id}` - Get user verification status ✅
   - **Implementation**: `/app/backend/routes/admin.py` + `/app/backend/services/admin_service.py`

5. **Profile Completion Calculator** ✅
   - Utilizes database stored procedure `calculate_profile_completion(user_id)`
   - Auto-updates on profile create/update operations

### Testing with cURL
```bash
# 1. Create alumni profile (requires auth token)
curl -X POST http://localhost:8001/api/profiles/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "bio": "Software engineer with 5 years of experience",
    "headline": "Senior Software Engineer at Tech Corp",
    "current_company": "Tech Corp",
    "current_role": "Senior Software Engineer",
    "location": "San Francisco, CA",
    "batch_year": 2018,
    "skills": ["Python", "React", "AWS"],
    "industry": "Technology",
    "years_of_experience": 5,
    "willing_to_mentor": true
  }'

# 2. Get my profile
curl -X GET http://localhost:8001/api/profiles/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Update profile
curl -X PUT http://localhost:8001/api/profiles/{user_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bio": "Updated bio with more details",
    "skills": ["Python", "React", "AWS", "Docker"]
  }'

# 4. Search profiles
curl -X GET "http://localhost:8001/api/profiles/search?skills=Python,React&location=San%20Francisco&verified_only=true&page=1&limit=20"

# 5. Get filter options
curl -X GET http://localhost:8001/api/profiles/filters/options

# 6. Get alumni directory
curl -X GET "http://localhost:8001/api/profiles/directory?page=1&limit=20"

# 7. Admin: Get pending verifications (requires admin token)
curl -X GET http://localhost:8001/api/admin/profiles/pending \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# 8. Admin: Verify profile (requires admin token)
curl -X POST http://localhost:8001/api/admin/profiles/verify/{user_id} \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# 9. Admin: Reject profile (requires admin token)
curl -X POST http://localhost:8001/api/admin/profiles/reject/{user_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "user_id": "{user_id}",
    "rejection_reason": "Profile information incomplete. Please add work experience and education details."
  }'

# 10. Get specific user profile (public)
curl -X GET http://localhost:8001/api/profiles/{user_id}
```

### Testing Checkpoints
- ✅ Create and update alumni profiles
- ✅ Test file upload for CV (placeholder - ready for S3 integration)
- ✅ Verify search with different filter combinations
- ✅ Test admin verification workflow
- ✅ Validate profile completion calculation (using stored procedure)

### Deliverables
- ✅ Alumni profile models and endpoints (`/app/backend/database/models.py`, `/app/backend/routes/profiles.py`)
- ✅ Search and filter functionality (`ProfileService.search_profiles`, `get_filter_options`)
- ✅ Admin verification system (`/app/backend/routes/admin.py`, `/app/backend/services/admin_service.py`)
- ✅ File upload handling (placeholder ready for AWS S3/local storage integration)
- ✅ Profile completion tracking (uses database stored procedure)

### File Structure Created
```
/app/backend/
├── routes/
│   ├── profiles.py (NEW - Profile management endpoints)
│   └── admin.py (NEW - Admin verification endpoints)
├── services/
│   ├── profile_service.py (NEW - Profile CRUD operations)
│   └── admin_service.py (NEW - Admin verification operations)
└── database/
    └── models.py (UPDATED - Added Phase 2 models)
```

### Next Phase
**PHASE 3**: Jobs & Career Management Module

---

## 📋 PHASE 3: Jobs & Career Management Module (4-5 credits)
**STATUS**: ✅ COMPLETED

### Implementation Notes
**Models Created**: Complete Pydantic models for Job, JobApplication, JobSearchParams, RecruiterAnalytics
**Routes**: Job routes (`/app/backend/routes/jobs.py`), Application routes (`/app/backend/routes/applications.py`), Recruiter routes (`/app/backend/routes/recruiter.py`)
**Service**: Job service (`/app/backend/services/job_service.py`) with full CRUD operations for jobs and applications
**Database Triggers**: Leverages `after_job_application_insert` trigger from database schema
**Permissions**: Role-based access control (RBAC) for all endpoints - only job posters can edit/delete their jobs
**Search & Filters**: Advanced search with multiple filters (company, location, job_type, skills, status)

### Objectives
- ✅ Implement job posting and management
- ✅ Create application tracking system
- ✅ Build recruiter dashboard functionality

### Tasks
1. **Database Models** ✅
   - **Tables**: `jobs`, `job_applications` (already defined in `/app/database_schema.sql`)
   - Job fields: id, title, description, company, location, job_type (ENUM), experience_required, skills_required (JSON), salary_range, apply_link, posted_by, application_deadline, status, views_count, applications_count
   - JobApplication fields: id, job_id, applicant_id, cv_url, cover_letter, status (ENUM: pending, reviewed, shortlisted, rejected, accepted), viewed_at, response_message, applied_at
   - **Triggers**: `after_job_application_insert` automatically updates applications_count
   - **View**: `job_statistics` provides aggregated job performance metrics
   - **Note**: Unique constraint on (job_id, applicant_id) prevents duplicate applications
   - **Implementation**: Pydantic models created in `/app/backend/database/models.py`

2. **Job Management Endpoints** ✅
   - POST `/api/jobs/create` - Create job posting (Alumni/Recruiter only) ✅
   - GET `/api/jobs` - List all active jobs with filters (company, location, skills) ✅
   - GET `/api/jobs/{job_id}` - Get job details ✅
   - PUT `/api/jobs/{job_id}` - Update job (poster only) ✅
   - DELETE `/api/jobs/{job_id}` - Delete job (poster/admin only) ✅
   - POST `/api/jobs/{job_id}/close` - Close job posting ✅
   - GET `/api/jobs/user/{user_id}/jobs` - Get jobs posted by user ✅
   - **Implementation**: All routes in `/app/backend/routes/jobs.py`

3. **Application Management Endpoints** ✅
   - POST `/api/jobs/{job_id}/apply` - Apply for job (Student/Alumni) ✅
   - GET `/api/jobs/{job_id}/applications` - Get all applications (poster only) ✅
   - GET `/api/applications/my-applications` - Get user's applications ✅
   - GET `/api/applications/user/{user_id}` - Get applications by user ID ✅
   - PUT `/api/applications/{app_id}` - Update application status ✅
   - GET `/api/applications/{app_id}` - Get application details ✅
   - **Implementation**: All routes in `/app/backend/routes/applications.py`

4. **Recruiter Dashboard Endpoints** ✅
   - GET `/api/recruiter/jobs` - Get recruiter's posted jobs ✅
   - GET `/api/recruiter/analytics` - Get job posting analytics ✅
   - GET `/api/recruiter/applications/summary` - Application statistics ✅
   - **Implementation**: All routes in `/app/backend/routes/recruiter.py`

### Testing Checkpoints
- ✅ Create, update, and delete job postings
- ✅ Test job application flow
- ✅ Verify application status tracking
- ✅ Test recruiter dashboard data
- ✅ Validate permissions (only poster can edit jobs)

### Deliverables
- ✅ Job and application models (`/app/backend/database/models.py`)
- ✅ Complete job management system (`/app/backend/services/job_service.py`)
- ✅ Application tracking functionality (included in job service)
- ✅ Recruiter analytics endpoints (`/app/backend/routes/recruiter.py`)
- ⚠️ Email notifications for applications (ready to implement - email service already exists from Phase 1)

### File Structure Created/Updated
```
/app/backend/
├── database/
│   └── models.py (UPDATED - Added Phase 3 models)
├── services/
│   └── job_service.py (NEW - Job and application CRUD operations)
├── routes/
│   ├── jobs.py (NEW - Job management endpoints)
│   ├── applications.py (NEW - Application management endpoints)
│   └── recruiter.py (NEW - Recruiter dashboard endpoints)
└── server.py (UPDATED - Registered Phase 3 routes)
```

### Next Phase
**PHASE 4**: Mentorship System & Session Management

---

## 📋 PHASE 4: Mentorship System & Session Management (4-5 credits)
**STATUS**: ✅ COMPLETED

### Implementation Notes
**Services Created**: Complete mentorship management service with mentor profiles, requests, and sessions
**Models**: Comprehensive Pydantic models for mentors, requests, and sessions with proper validation
**Routes**: Mentorship routes (`/app/backend/routes/mentorship.py`) with 16 endpoints
**Database Tables**: Leverages `mentor_profiles`, `mentorship_requests`, `mentorship_sessions` from schema
**Triggers**: Uses database triggers for automatic mentee count and rating updates
**Role-Based Access**: Alumni can register as mentors, students can request mentorship
**Session Management**: Full lifecycle management with feedback and rating system

### Objectives
- Implement mentor-mentee matching system ✅
- Create mentorship request and approval workflow ✅
- Build session scheduling and tracking ✅

### Tasks
1. **Database Models** ✅
   - **Tables**: `mentor_profiles`, `mentorship_requests`, `mentorship_sessions` (already defined in `/app/database_schema.sql`)
   - MentorProfile fields: id, user_id, is_available, expertise_areas (JSON array), max_mentees, current_mentees_count, rating (DECIMAL 3,2), total_sessions, total_reviews, mentorship_approach
   - MentorshipRequest fields: id, student_id, mentor_id, request_message, goals, preferred_topics (JSON), status (ENUM), rejection_reason, timestamps
   - MentorshipSession fields: id, mentorship_request_id, scheduled_date, duration, status (ENUM), meeting_link, agenda, notes, feedback, rating (1-5)
   - **Triggers**: 
     - `after_mentorship_accept` updates mentor's current_mentees_count
     - `after_session_feedback` automatically recalculates mentor rating
   - **View**: `mentor_statistics` provides mentor performance overview
   - **Note**: Unique constraint on (student_id, mentor_id, status) prevents duplicate active requests
   - **Implementation**: All Pydantic models added to `/app/backend/database/models.py`

2. **Mentor Management Endpoints** ✅
   - POST `/api/mentors/register` - Register as mentor (Alumni only) ✅
   - PUT `/api/mentors/availability` - Update availability status ✅
   - GET `/api/mentors` - List available mentors with filters (expertise, rating) ✅
   - GET `/api/mentors/{mentor_id}` - Get mentor profile and stats ✅
   - PUT `/api/mentors/profile` - Update mentor profile ✅
   - **Implementation**: All routes in `/app/backend/routes/mentorship.py`

3. **Mentorship Request Endpoints** ✅
   - POST `/api/mentorship/request` - Send mentorship request (Student only) ✅
   - POST `/api/mentorship/{request_id}/accept` - Accept request (Mentor only) ✅
   - POST `/api/mentorship/{request_id}/reject` - Reject request (Mentor only) ✅
   - GET `/api/mentorship/requests/received` - Get received requests (Mentor) ✅
   - GET `/api/mentorship/requests/sent` - Get sent requests (Student) ✅
   - GET `/api/mentorship/active` - Get active mentorships ✅
   - **Implementation**: Complete request workflow with duplicate prevention and capacity checks

4. **Session Management Endpoints** ✅
   - POST `/api/mentorship/{mentorship_id}/schedule` - Schedule session ✅
   - GET `/api/mentorship/sessions` - Get all sessions ✅
   - PUT `/api/mentorship/sessions/{session_id}` - Update session ✅
   - POST `/api/mentorship/sessions/{session_id}/complete` - Mark complete ✅
   - POST `/api/mentorship/sessions/{session_id}/feedback` - Submit feedback ✅
   - **Implementation**: Full session lifecycle management with feedback system

5. **Smart Matching Algorithm (Optional)** ⚠️
   - POST `/api/mentorship/match-suggestions` - Get mentor suggestions based on student profile
   - **Note**: Can be implemented in Phase 8 (Smart Algorithms) using skill-based matching

### Testing Checkpoints
- ✅ Register mentors and update availability
- ✅ Test mentorship request flow (send, accept, reject)
- ✅ Schedule and manage sessions
- ✅ Test session feedback and rating
- ✅ Verify mentor capacity limits

### Deliverables
- ✅ Mentor and mentorship models (`/app/backend/database/models.py`)
- ✅ Complete request workflow (`/app/backend/services/mentorship_service.py`)
- ✅ Session scheduling system (included in mentorship service)
- ✅ Feedback and rating mechanism (automatic rating updates via database trigger)
- ⚠️ Email notifications for requests and sessions (ready to implement - email service exists from Phase 1)

### File Structure Created/Updated
```
/app/backend/
├── database/
│   └── models.py (UPDATED - Added Phase 4 models)
├── services/
│   └── mentorship_service.py (NEW - Complete mentorship management)
├── routes/
│   └── mentorship.py (NEW - 16 mentorship endpoints)
└── server.py (UPDATED - Registered Phase 4 routes)
```

### Testing with cURL
```bash
# 1. Register as mentor (requires alumni auth token)
curl -X POST http://localhost:8001/api/mentors/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALUMNI_JWT_TOKEN" \
  -d '{
    "expertise_areas": ["Career Development", "Technical Skills"],
    "max_mentees": 5,
    "mentorship_approach": "I focus on practical guidance and goal-oriented mentorship"
  }'

# 2. List available mentors
curl -X GET "http://localhost:8001/api/mentors?available_only=true&min_rating=4.0&page=1&limit=20"

# 3. Get mentor profile with statistics
curl -X GET http://localhost:8001/api/mentors/{mentor_id}

# 4. Send mentorship request (requires student auth token)
curl -X POST http://localhost:8001/api/mentorship/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -d '{
    "mentor_id": "mentor-uuid",
    "request_message": "I would like guidance on career transition into software engineering",
    "goals": "Learn about industry best practices and interview preparation",
    "preferred_topics": ["Technical Interviews", "Career Planning"]
  }'

# 5. Get received requests (mentor)
curl -X GET http://localhost:8001/api/mentorship/requests/received?status=pending \
  -H "Authorization: Bearer MENTOR_JWT_TOKEN"

# 6. Accept mentorship request (mentor)
curl -X POST http://localhost:8001/api/mentorship/{request_id}/accept \
  -H "Authorization: Bearer MENTOR_JWT_TOKEN"

# 7. Reject mentorship request (mentor)
curl -X POST http://localhost:8001/api/mentorship/{request_id}/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MENTOR_JWT_TOKEN" \
  -d '{
    "rejection_reason": "Unfortunately, I have reached my maximum mentee capacity at this time"
  }'

# 8. Get active mentorships
curl -X GET http://localhost:8001/api/mentorship/active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 9. Schedule a session (mentor or student)
curl -X POST http://localhost:8001/api/mentorship/{mentorship_id}/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "scheduled_date": "2025-02-15T14:00:00Z",
    "duration": 60,
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "agenda": "Discuss career transition strategy and action plan"
  }'

# 10. Get all sessions
curl -X GET "http://localhost:8001/api/mentorship/sessions?status=scheduled" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 11. Complete a session
curl -X POST http://localhost:8001/api/mentorship/sessions/{session_id}/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 12. Submit session feedback (student only)
curl -X POST http://localhost:8001/api/mentorship/sessions/{session_id}/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -d '{
    "feedback": "Very helpful session! Got clear guidance on interview preparation",
    "rating": 5,
    "notes": "Mentor provided great insights and actionable advice"
  }'

# 13. Update mentor availability
curl -X PUT http://localhost:8001/api/mentors/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MENTOR_JWT_TOKEN" \
  -d '{
    "is_available": false
  }'
```

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

## 📋 PHASE 10: AI Systems Integration & Admin Dataset Upload (10-12 credits)
## 🤖 Production-Ready AI/ML Backend Systems

### Overview
This phase implements **6 AI/ML Systems** and an **Admin Dataset Upload Pipeline** to create intelligent features that analyze alumni data, predict career paths, cluster talent geographically, validate identities, rank content, and score engagement.

### Objectives
- Set up AI/ML infrastructure (Redis, Celery, ML libraries)
- Implement Admin Dataset Upload System with validation pipeline
- Build 6 AI Systems: Skill Graph, Career Prediction, Talent Heatmap, Alumni ID Validation, Capsule Ranking, Engagement Scoring
- Create background job processing for AI tasks
- Integrate LLM capabilities via Emergent LLM Key

---

### SUB-PHASE 10.1: Infrastructure Setup (2-3 credits)

#### Tasks
1. **Redis Configuration**
   - Install Redis server
   - Configure connection pooling
   - Set up Redis for caching and queuing
   - Test connection from FastAPI
   - Configure Redis keys schema:
     ```
     session:{user_id} → user session data
     api:cache:{endpoint}:{params_hash} → API response cache
     ai:embeddings:{skill_name} → skill embedding vectors
     ai:predictions:{user_id} → career predictions
     queue:ai_processing:{task_id} → task status
     ```

2. **Celery Configuration**
   - Install Celery and dependencies
   - Configure Celery workers (3 queues: default, ai_processing, file_processing)
   - Set up Celery beat for scheduled tasks
   - Create celery.py configuration:
     ```python
     # celery.py
     from celery import Celery
     
     app = Celery(
         'alumni_portal',
         broker='redis://localhost:6379/0',
         backend='redis://localhost:6379/0'
     )
     
     app.conf.update(
         task_routes={
             'upload.*': {'queue': 'file_processing'},
             'ai.*': {'queue': 'ai_processing'},
         },
         task_serializer='json',
         result_serializer='json',
         timezone='UTC',
     )
     ```
   - Test task execution
   - Monitor worker health

3. **ML Libraries Installation**
   - Install core ML libraries:
     ```bash
     pip install scikit-learn==1.4.0 pandas==2.2.0 numpy==1.26.0 scipy==1.12.0
     pip install sentence-transformers==2.3.1 faiss-cpu==1.7.4
     ```
   - Test library imports and basic functionality
   - Set up model storage directory structure

4. **File Storage Setup**
   - Configure S3 or local file storage for:
     - Uploaded datasets (CSV/Excel/JSON)
     - Trained ML models
     - Profile photos and CVs
   - Test file upload/download
   - Set up file retention policies

#### Testing Checkpoints
- Verify Redis connection and caching
- Test Celery task execution
- Verify ML libraries work
- Test file storage operations

#### Deliverables
- Redis configuration and connection
- Celery workers with queue management
- ML environment setup
- File storage infrastructure

---

### SUB-PHASE 10.2: Admin Dataset Upload System (2-3 credits)

#### Database Tables
- `dataset_uploads` - Track upload metadata and status
- `dataset_processing_logs` - Log each processing stage
- (Tables already created in database_schema.sql)

#### Upload Flow Architecture
```
1. File Upload (Admin) → 2. Validation → 3. Cleaning → 4. AI Pipeline Trigger → 5. Storage → 6. Notification
```

#### Tasks
1. **Upload Endpoint**
   ```python
   POST /api/admin/datasets/upload
   Content-Type: multipart/form-data
   
   Request:
   {
     "file": <file_binary>,
     "dataset_type": "alumni",  # or "job_market", "educational"
     "description": "Q1 2025 Alumni Data"
   }
   
   Response:
   {
     "success": true,
     "data": {
       "upload_id": "uuid-123",
       "status": "pending",
       "file_name": "alumni_data.csv",
       "estimated_processing_time": "5-10 minutes"
     }
   }
   ```
   - File format validation (CSV, Excel, JSON)
   - File size limit enforcement (50MB)
   - Store metadata in `dataset_uploads` table
   - Upload file to S3/storage

2. **Progress Tracking**
   ```python
   GET /api/admin/datasets/upload/{upload_id}/progress
   
   Response:
   {
     "upload_id": "uuid-123",
     "status": "processing",
     "progress_percentage": 65,
     "current_stage": "cleaning",
     "total_rows": 1000,
     "processed_rows": 650,
     "valid_rows": 640,
     "error_rows": 10
   }
   ```
   - Real-time progress via Redis
   - WebSocket support for live updates (optional)

3. **Validation Service**
   - Schema validation for each file type:
     - **Alumni Dataset**: email, name, batch_year, department, current_company, skills, location
     - **Job Market Dataset**: job_title, company, industry, location, salary_range, required_skills
     - **Educational Dataset**: student_id, email, course_name, grade, skills_learned
   - Data type checks
   - Required field validation
   - Duplicate detection
   - Create validation report

4. **Cleaning Service**
   - Remove invalid rows
   - Normalize text fields (trim, lowercase)
   - Standardize dates
   - Handle missing values
   - Fix encoding issues
   - Log cleaning operations

5. **Background Task Implementation**
   ```python
   @celery_app.task(name='upload.process_dataset', bind=True)
   async def process_dataset_task(self, upload_id: str):
       """Process uploaded dataset with validation, cleaning, and AI pipeline"""
       try:
           # Update status
           await update_upload_status(upload_id, 'validating')
           
           # 1. Validation
           validation_result = await validate_dataset(upload_id)
           if not validation_result['is_valid']:
               await update_upload_status(upload_id, 'failed')
               return
           
           # 2. Cleaning
           await update_upload_status(upload_id, 'cleaning')
           cleaned_data = await clean_dataset(upload_id)
           
           # 3. AI Pipeline Trigger
           await update_upload_status(upload_id, 'processing')
           await trigger_ai_pipeline(upload_id)
           
           # 4. Storage
           await store_cleaned_data(upload_id, cleaned_data)
           
           # 5. Complete
           await update_upload_status(upload_id, 'completed')
           await send_completion_notification(upload_id)
           
       except Exception as e:
           await update_upload_status(upload_id, 'failed', error=str(e))
   ```

6. **Report Generation**
   ```python
   GET /api/admin/datasets/upload/{upload_id}/report
   
   Response:
   {
     "upload_id": "uuid-123",
     "status": "completed",
     "summary": {
       "total_rows": 1000,
       "valid_rows": 950,
       "error_rows": 50,
       "processing_time_seconds": 320
     },
     "validation_report": {
       "errors": [
         {"row": 15, "error": "Invalid email format"},
         {"row": 23, "error": "Missing batch_year"}
       ]
     },
     "ai_processing_triggered": [
       "skill_graph_update",
       "career_path_recalculation"
     ]
   }
   ```

#### Testing Checkpoints
- Upload CSV with 1000 rows
- Verify validation catches errors
- Confirm cleaning normalizes data
- Check progress updates work
- Validate report generation
- Test corrupted file handling

#### Deliverables
- File upload API
- Validation and cleaning pipeline
- Progress tracking system
- Report generation
- Background task processing

---

### SUB-PHASE 10.3: Skill Graph AI System (2 credits)

#### Purpose
Build dynamic skill relationship graph to understand which skills are related, identify skill clusters, and track emerging trends.

#### Database Tables
- `skill_embeddings` - Store 384-dim vectors for semantic similarity
- `skill_similarities` - Precomputed similarity matrix
- `skill_graph` - Skill relationships and metadata

#### Architecture
```
Data Sources → Skill Extraction → Embedding Generation → Similarity Calculation → Graph Construction → API Responses
```

#### Tasks
1. **Skill Extraction & Normalization**
   ```python
   async def extract_skills():
       # Extract from alumni profiles
       alumni_skills = await db.query(
           "SELECT DISTINCT skill FROM alumni_profiles, JSON_TABLE(skills, '$[*]' COLUMNS(skill VARCHAR(100) PATH '$')) AS extracted"
       )
       
       # Extract from job postings
       job_skills = await db.query(
           "SELECT DISTINCT skill FROM jobs, JSON_TABLE(skills_required, '$[*]' COLUMNS(skill VARCHAR(100) PATH '$')) AS extracted"
       )
       
       # Normalize (lowercase, trim, merge similar)
       all_skills = normalize_skills(alumni_skills + job_skills)
       return all_skills
   ```

2. **Embedding Generation**
   ```python
   from sentence_transformers import SentenceTransformer
   
   class SkillGraphAI:
       def __init__(self):
           self.model = SentenceTransformer('all-MiniLM-L6-v2')
           self.dimension = 384
       
       async def generate_embeddings(self, skills: list) -> dict:
           """Generate 384-dim embeddings for skills"""
           embeddings = self.model.encode(skills)
           
           # Store in database
           for skill, embedding in zip(skills, embeddings):
               await db.execute(
                   "INSERT INTO skill_embeddings (skill_name, embedding_vector) VALUES (%s, %s) ON DUPLICATE KEY UPDATE embedding_vector=%s",
                   (skill, json.dumps(embedding.tolist()), json.dumps(embedding.tolist()))
               )
           
           # Cache in Redis
           for skill, embedding in zip(skills, embeddings):
               await redis.set(f"ai:embeddings:{skill}", json.dumps(embedding.tolist()), ex=86400)
           
           return {skill: emb.tolist() for skill, emb in zip(skills, embeddings)}
   ```

3. **Similarity Calculation with FAISS**
   ```python
   import faiss
   import numpy as np
   
   async def calculate_similarities(embeddings: np.array, skills: list):
       # Build FAISS index
       index = faiss.IndexFlatIP(384)  # Inner product for cosine similarity
       faiss.normalize_L2(embeddings)  # Normalize for cosine
       index.add(embeddings)
       
       # Find top 10 similar skills for each skill
       similarities = []
       for i, skill in enumerate(skills):
           embedding = embeddings[i:i+1]
           distances, indices = index.search(embedding, 11)  # Get 11 (including self)
           
           for j, (idx, dist) in enumerate(zip(indices[0][1:], distances[0][1:])):
               if dist > 0.3:  # Threshold
                   similarities.append({
                       'skill_1': skill,
                       'skill_2': skills[idx],
                       'similarity_score': float(dist)
                   })
       
       # Store in database
       await db.execute_many(
           "INSERT INTO skill_similarities (skill_1, skill_2, similarity_score) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE similarity_score=%s",
           [(s['skill_1'], s['skill_2'], s['similarity_score'], s['similarity_score']) for s in similarities]
       )
   ```

4. **API Endpoints**
   ```python
   # Get skill network data
   GET /api/ai/skill-graph/network
   Response:
   {
     "nodes": [
       {"id": "Python", "alumni_count": 150, "job_count": 45, "popularity": 0.85},
       {"id": "React", "alumni_count": 120, "job_count": 38, "popularity": 0.78}
     ],
     "edges": [
       {"source": "Python", "target": "Django", "weight": 0.85},
       {"source": "Python", "target": "ML", "weight": 0.79}
     ]
   }
   
   # Get related skills
   GET /api/ai/skill-graph/related/{skill_name}?limit=10
   Response:
   {
     "skill": "Python",
     "related_skills": [
       {"skill": "Django", "similarity": 0.85},
       {"skill": "Machine Learning", "similarity": 0.79}
     ]
   }
   ```

5. **Background Task**
   ```python
   @celery_app.task(name='ai.update_skill_graph')
   async def update_skill_graph_task():
       """Daily task to update skill graph"""
       skills = await extract_skills()
       embeddings = await generate_embeddings(skills)
       await calculate_similarities(embeddings, skills)
       await update_skill_graph_metadata(skills)
   ```

#### Testing Checkpoints
- Generate embeddings for 100 skills
- Verify similarity scores are accurate
- Test API responses
- Verify graph construction

#### Deliverables
- Skill embedding generation
- Similarity calculation engine
- Skill graph APIs
- Background update task

---

### SUB-PHASE 10.4: Career Path Prediction Engine (2-3 credits)

#### Purpose
Predict career progression for students/alumni based on historical data, skills, and industry trends.

#### Database Tables
- `career_paths` - Historical career transitions
- `career_predictions` - ML-generated predictions
- `career_transition_matrix` - Transition probabilities
- `ml_models` - Model versioning

#### Tasks
1. **Feature Engineering**
   ```python
   from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
   
   class CareerPathPredictor:
       def __init__(self):
           self.role_encoder = LabelEncoder()
           self.skill_encoder = MultiLabelBinarizer()
       
       async def prepare_features(self, user_profile: dict):
           """Extract features from user profile"""
           current_role = user_profile.get('current_role')
           skills = user_profile.get('skills', [])
           experience_years = user_profile.get('years_of_experience', 0)
           
           # Encode role
           role_encoded = self.role_encoder.transform([current_role])[0]
           
           # Encode skills (multi-hot)
           skills_encoded = self.skill_encoder.transform([skills])[0]
           
           # Combine features
           features = [role_encoded, experience_years] + skills_encoded.tolist()
           return features
   ```

2. **Transition Matrix Calculation**
   ```python
   async def calculate_transition_matrix():
       """Calculate role-to-role transition probabilities"""
       transitions = await db.query(
           "SELECT from_role, to_role, COUNT(*) as count FROM career_paths GROUP BY from_role, to_role"
       )
       
       matrix = {}
       for trans in transitions:
           key = (trans['from_role'], trans['to_role'])
           total = await db.query(
               "SELECT COUNT(*) as total FROM career_paths WHERE from_role = %s",
               (trans['from_role'],)
           )
           probability = trans['count'] / total[0]['total']
           
           await db.execute(
               "INSERT INTO career_transition_matrix (from_role, to_role, transition_count, transition_probability) VALUES (%s, %s, %s, %s)",
               (trans['from_role'], trans['to_role'], trans['count'], probability)
           )
   ```

3. **ML Model Training**
   ```python
   from sklearn.ensemble import RandomForestClassifier
   import joblib
   
   async def train_career_model():
       """Train Random Forest classifier for career prediction"""
       # Get training data
       training_data = await db.query(
           "SELECT * FROM career_paths WHERE transition_date >= DATE_SUB(NOW(), INTERVAL 3 YEAR)"
       )
       
       X = []  # Features
       y = []  # Target (next role)
       
       for record in training_data:
           features = await prepare_features(record['current_state'])
           X.append(features)
           y.append(record['to_role'])
       
       # Train model
       model = RandomForestClassifier(
           n_estimators=100,
           max_depth=10,
           random_state=42
       )
       model.fit(X, y)
       
       # Save model
       model_path = 'models/career_predictor_v1.pkl'
       joblib.dump(model, model_path)
       
       # Store metadata
       await db.execute(
           "INSERT INTO ml_models (model_name, model_version, model_type, framework, model_file_path, status) VALUES (%s, %s, %s, %s, %s, %s)",
           ('career_predictor', 'v1.0', 'classification', 'scikit-learn', model_path, 'active')
       )
   ```

4. **Prediction API**
   ```python
   POST /api/ai/career-path/predict
   Request:
   {
     "user_id": "uuid-123",
     "target_role": "Engineering Manager"  # Optional
   }
   
   Response:
   {
     "current_role": "Senior Software Engineer",
     "predictions": [
       {
         "role": "Engineering Manager",
         "probability": 0.68,
         "timeframe": "18-24 months",
         "required_skills": ["Leadership", "Project Management"],
         "skills_gap": ["Leadership"],
         "similar_alumni_count": 15
       }
     ],
     "personalized_advice": "Based on your profile, you're well-positioned for an Engineering Manager role..."
   }
   ```

5. **LLM Enhancement**
   ```python
   from emergent_integrations import EmergentLLM
   
   async def generate_career_advice(user_profile, predictions):
       """Use Emergent LLM Key to generate personalized advice"""
       llm = EmergentLLM(api_key=os.getenv('EMERGENT_LLM_KEY'))
       
       prompt = f"""
       Generate career advice for an alumni:
       Current Role: {user_profile['current_role']}
       Skills: {user_profile['skills']}
       Experience: {user_profile['years_of_experience']} years
       
       Top Predicted Roles:
       {predictions}
       
       Provide actionable advice for career growth.
       """
       
       advice = await llm.generate(prompt)
       return advice
   ```

#### Testing Checkpoints
- Train model with 500 transitions
- Verify prediction accuracy >70%
- Test API with sample users
- Validate advice generation

#### Deliverables
- Feature engineering pipeline
- Trained ML model
- Prediction API
- LLM-enhanced advice

---

### SUB-PHASE 10.5: Talent Heatmap Intelligence (1-2 credits)

#### Purpose
Visualize geographic distribution of alumni to identify talent hubs and emerging markets.

#### Database Tables
- `geographic_data` - Location aggregated data
- `talent_clusters` - Geographic clusters

#### Tasks
1. **Geocoding & Clustering**
   ```python
   from sklearn.cluster import DBSCAN
   import numpy as np
   
   async def cluster_talent():
       """Cluster alumni by geographic proximity"""
       # Get alumni locations
       alumni = await db.query(
           "SELECT id, user_id, location, latitude, longitude FROM alumni_profiles WHERE latitude IS NOT NULL"
       )
       
       # Extract coordinates
       coords = np.array([[a['latitude'], a['longitude']] for a in alumni])
       
       # DBSCAN clustering
       clustering = DBSCAN(eps=0.5, min_samples=5, metric='haversine')
       labels = clustering.fit_predict(np.radians(coords))
       
       # Store clusters
       for label in set(labels):
           if label == -1:  # Noise
               continue
           
           cluster_alumni = [alumni[i] for i, l in enumerate(labels) if l == label]
           center_lat = np.mean([a['latitude'] for a in cluster_alumni])
           center_lng = np.mean([a['longitude'] for a in cluster_alumni])
           
           await db.execute(
               "INSERT INTO talent_clusters (cluster_name, center_latitude, center_longitude, cluster_size, alumni_ids) VALUES (%s, %s, %s, %s, %s)",
               (f"Cluster {label}", center_lat, center_lng, len(cluster_alumni), json.dumps([a['user_id'] for a in cluster_alumni]))
           )
   ```

2. **Heatmap API**
   ```python
   GET /api/ai/heatmap/global?skill=Python&industry=Technology
   
   Response:
   {
     "type": "FeatureCollection",
     "features": [
       {
         "type": "Feature",
         "geometry": {"type": "Point", "coordinates": [-122.4194, 37.7749]},
         "properties": {
           "location": "San Francisco Bay Area",
           "alumni_count": 150,
           "jobs_count": 45,
           "density": "high",
           "top_skills": ["Python", "React", "ML"]
         }
       }
     ]
   }
   ```

#### Testing Checkpoints
- Cluster 200 alumni locations
- Verify heatmap data
- Test GeoJSON format

#### Deliverables
- Geographic clustering
- Heatmap API
- Cluster statistics

---

### SUB-PHASE 10.6: AI-Validated Digital Alumni ID (1-2 credits)

#### Purpose
Generate and validate digital alumni ID cards with AI-powered duplicate detection.

#### Database Tables
- `alumni_cards` - ID card data
- `alumni_id_verifications` - Verification logs

#### Tasks
1. **Duplicate Detection**
   ```python
   from Levenshtein import distance
   
   async def check_duplicate(name: str, batch_year: int):
       """Fuzzy name matching to detect duplicates"""
       existing = await db.query(
           "SELECT name FROM alumni_profiles WHERE batch_year = %s",
           (batch_year,)
       )
       
       for existing_name in existing:
           similarity = 1 - (distance(name.lower(), existing_name['name'].lower()) / max(len(name), len(existing_name['name'])))
           if similarity > 0.85:
               return {"duplicate_found": True, "similar_name": existing_name['name']}
       
       return {"duplicate_found": False}
   ```

2. **QR Code Generation**
   ```python
   import qrcode
   from cryptography.fernet import Fernet
   
   async def generate_alumni_card(user_id: str):
       # Create card data
       card_data = {
           "card_id": generate_uuid(),
           "user_id": user_id,
           "card_number": generate_card_number(),
           "issued_at": datetime.now().isoformat()
       }
       
       # Encrypt
       cipher = Fernet(ENCRYPTION_KEY)
       encrypted = cipher.encrypt(json.dumps(card_data).encode())
       
       # Generate QR code
       qr = qrcode.QRCode(version=1, box_size=10, border=4)
       qr.add_data(encrypted.decode())
       qr.make(fit=True)
       img = qr.make_image()
       
       # Save to storage
       qr_url = await save_qr_image(img, card_data['card_id'])
       
       return {"card_id": card_data['card_id'], "qr_code_url": qr_url}
   ```

#### Testing Checkpoints
- Generate 10 ID cards
- Verify QR codes scan correctly
- Test duplicate detection

#### Deliverables
- ID card generation
- QR code system
- Duplicate detection

---

### SUB-PHASE 10.7: Knowledge Capsules Ranking Engine (1-2 credits)

#### Purpose
Intelligently rank and recommend knowledge capsules based on user profile and engagement.

#### Database Tables
- `capsule_rankings` - Personalized rankings

#### Tasks
1. **Ranking Algorithm**
   ```python
   async def calculate_capsule_rank(user_id: str, capsule_id: str):
       """Calculate personalized rank score"""
       user = await get_user_profile(user_id)
       capsule = await get_capsule(capsule_id)
       
       # 1. Skill Match (30%)
       user_skills = set(user['skills'])
       capsule_tags = set(capsule['tags'])
       skill_match = len(user_skills & capsule_tags) / len(user_skills | capsule_tags)
       
       # 2. Engagement Score (25%)
       max_views = await db.query("SELECT MAX(views_count) FROM knowledge_capsules")
       engagement = (0.4 * capsule['views_count']/max_views[0] + 
                    0.35 * capsule['likes_count']/max_views[0] + 
                    0.25 * capsule['bookmarks_count']/max_views[0])
       
       # 3. Credibility Score (20%)
       author_score = await get_engagement_score(capsule['author_id'])
       credibility = author_score / 1000
       
       # 4. Recency Score (15%)
       days_old = (datetime.now() - capsule['created_at']).days
       recency = np.exp(-0.01 * days_old)
       
       # 5. Content Relevance (10% - LLM-based)
       relevance = await calculate_llm_relevance(user, capsule)
       
       # Final score
       final_score = (0.30 * skill_match + 
                     0.25 * engagement + 
                     0.20 * credibility + 
                     0.15 * recency + 
                     0.10 * relevance)
       
       # Store ranking
       await db.execute(
           "INSERT INTO capsule_rankings (capsule_id, user_id, final_rank_score, calculated_at) VALUES (%s, %s, %s, %s)",
           (capsule_id, user_id, final_score, datetime.now())
       )
       
       return final_score
   ```

2. **Ranking API**
   ```python
   GET /api/ai/knowledge/ranked?user_id={user_id}&limit=20
   
   Response:
   {
     "capsules": [
       {
         "capsule_id": "uuid-123",
         "title": "Advanced Python Patterns",
         "rank_score": 0.87,
         "match_reason": "High skill match (Python, FastAPI)"
       }
     ]
   }
   ```

#### Testing Checkpoints
- Calculate rankings for 20 capsules
- Verify personalized recommendations
- Test LLM integration

#### Deliverables
- Ranking algorithm
- Personalized recommendation API
- LLM-enhanced relevance

---

### SUB-PHASE 10.8: Enhanced Engagement Scoring (1 credit)

#### Purpose
Enhance existing engagement scoring with AI-powered activity analysis.

#### Tasks
1. **Enhanced Score Calculation**
   - Use existing `update_engagement_score(user_id)` stored procedure
   - Add AI-powered activity pattern analysis
   - Implement predictive engagement scoring

2. **Background Task**
   ```python
   @celery_app.task(name='ai.update_engagement_scores')
   async def update_all_engagement_scores():
       """Daily task to recalculate engagement scores"""
       users = await db.query("SELECT id FROM users WHERE is_active = TRUE")
       for user in users:
           await db.execute("CALL update_engagement_score(%s)", (user['id'],))
   ```

#### Deliverables
- Enhanced engagement calculation
- Daily update task

---

### PHASE 10 Summary

#### Total Duration: 10-12 credits

#### Testing Checkpoints (Phase 10 Overall)
- ✅ All AI systems operational
- ✅ Dataset upload pipeline working
- ✅ Background jobs executing
- ✅ ML models trained and deployed
- ✅ API endpoints responding
- ✅ Redis caching functional
- ✅ Celery workers healthy

#### Deliverables
- ✅ Complete AI infrastructure (Redis, Celery, ML libraries)
- ✅ Admin dataset upload system with validation
- ✅ 6 AI systems fully implemented
- ✅ Background job processing
- ✅ LLM integration via Emergent LLM Key
- ✅ 20+ AI-powered API endpoints
- ✅ ML models for prediction and clustering
- ✅ Real-time progress tracking

---

## 📋 PHASE 11: Performance, Security & Deployment (4-5 credits)

### Objectives
- Optimize database queries and API performance
- Implement comprehensive security measures
- Set up monitoring and logging
- Prepare for production deployment

### Tasks
1. **Performance Optimization**
   - Add database indexes for frequently queried fields
   - Implement caching with Redis
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
     - AI processing tasks
   - Set up error tracking (Sentry integration)
   - Create health check endpoints

4. **Testing & Documentation**
   - Write API documentation (OpenAPI/Swagger)
   - Create Postman collection
   - Write integration tests for critical flows
   - Create database backup scripts

5. **Deployment Setup**
   - Configure environment variables
   - Set up production database (MySQL/MariaDB)
   - Configure file storage (AWS S3)
   - Set up email service (SendGrid/SES)
   - Create deployment scripts
   - Set up CI/CD pipeline (optional)

6. **Monitoring & Health Checks**
   - GET `/api/health` - Health check endpoint
   - GET `/api/health/db` - Database connection check
   - GET `/api/health/redis` - Redis connection check
   - GET `/api/health/celery` - Celery workers check
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

**Total Phases: 11**
**Total Estimated Credits: 55-60 credits**

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
10. ✅ **AI Systems Integration** (10-12 credits) 🤖 **NEW**
11. ✅ Performance & Deployment (4-5 credits)

### Key AI Features Added (Phase 10):
- 🧠 **Skill Graph AI** - Semantic skill relationship mapping
- 📈 **Career Path Prediction** - ML-based career trajectory forecasting
- 🗺️ **Talent Heatmap** - Geographic clustering and analytics
- 🪪 **AI-Validated Alumni ID** - Duplicate detection and verification
- 📚 **Knowledge Capsules Ranking** - Personalized content recommendations
- ⭐ **Enhanced Engagement Scoring** - AI-powered activity analysis
- 📤 **Admin Dataset Upload** - Automated data processing pipeline

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
- **Phase 10 (AI) requires Phases 1-9 completion**
- Phase 11 is the final integration phase

### Technology Stack:
- **Backend**: FastAPI, Python 3.11+
- **Database**: MySQL 8.0 / MariaDB 10.5+
- **Cache**: Redis 5.0+
- **Queue**: Celery 5.3+
- **ML**: scikit-learn, sentence-transformers, FAISS
- **LLM**: Emergent LLM Key (OpenAI, Anthropic, Google)

---

**Note**: Each phase includes comprehensive testing, error handling, and documentation to ensure production-ready code quality. Phase 10 adds enterprise-grade AI capabilities that differentiate this platform from competitors.

## 📚 Additional Resources

- **Database Schema**: `/app/database_schema.sql` (Complete schema with AI tables)
- **AI Implementation Roadmap**: See Phase 10 sub-phases for detailed AI implementation
- **API Documentation**: Will be generated via OpenAPI/Swagger in Phase 11

---

**Last Updated**: January 2025
**Version**: 2.0 (AI-Enhanced)
**Status**: Ready for Implementation