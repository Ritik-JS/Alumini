# 🔌 Backend API Specification for AlumUnity

## Overview
This document provides complete API endpoint specifications needed to implement the backend for AlumUnity. The frontend is already configured to toggle between mock data and these backend APIs using the `.env` configuration.

## 🔧 Configuration

### Environment Setup
The frontend expects the backend to run on the URL specified in `REACT_APP_BACKEND_URL` (default: `http://localhost:8001`).

All API routes must be prefixed with `/api` to match Kubernetes ingress rules.

### CORS Configuration
Enable CORS with the following settings:
- Allow credentials: `true`
- Allow origins: Frontend URL
- Allow methods: `["GET", "POST", "PUT", "DELETE", "PATCH"]`
- Allow headers: `["*"]`

---

## 📚 API Endpoints by Module

## 1. Authentication API (`/api/auth`)

### POST `/api/auth/login`
User login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "alumni",
    "isVerified": true
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "student",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for verification."
}
```

---

### POST `/api/auth/forgot-password`
Request password reset link.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email."
}
```

---

### POST `/api/auth/reset-password`
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully."
}
```

---

### POST `/api/auth/google-signin`
Google OAuth sign-in.

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user-uuid",
    "email": "user@gmail.com",
    "role": "alumni",
    "isVerified": true
  }
}
```

---

## 2. Job API (`/api/jobs`)

### GET `/api/jobs`
Get all jobs with optional filters.

**Query Parameters:**
- `status` (optional): Filter by job status
- `company` (optional): Filter by company name
- `location` (optional): Filter by location
- `job_type` (optional): Filter by job type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "job-uuid",
      "title": "Senior Software Engineer",
      "description": "Job description...",
      "company": "Google",
      "location": "San Francisco, CA",
      "job_type": "full-time",
      "experience_required": "5+ years",
      "skills_required": ["Python", "React", "Node.js"],
      "salary_range": "$150,000 - $200,000",
      "apply_link": "https://example.com/apply",
      "posted_by": "user-uuid",
      "application_deadline": "2025-12-31T23:59:59Z",
      "status": "active",
      "views_count": 150,
      "applications_count": 25,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 10
}
```

---

### GET `/api/jobs/:jobId`
Get job details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job-uuid",
    "title": "Senior Software Engineer",
    "description": "Full job description...",
    "company": "Google",
    "location": "San Francisco, CA",
    "job_type": "full-time",
    "experience_required": "5+ years",
    "skills_required": ["Python", "React", "Node.js"],
    "salary_range": "$150,000 - $200,000",
    "apply_link": "https://example.com/apply",
    "posted_by": "user-uuid",
    "application_deadline": "2025-12-31T23:59:59Z",
    "status": "active",
    "views_count": 150,
    "applications_count": 25,
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

---

### POST `/api/jobs`
Create a new job posting.

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "description": "Job description...",
  "company": "Google",
  "location": "San Francisco, CA",
  "job_type": "full-time",
  "experience_required": "5+ years",
  "skills_required": ["Python", "React", "Node.js"],
  "salary_range": "$150,000 - $200,000",
  "apply_link": "https://example.com/apply",
  "application_deadline": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job-uuid",
    "title": "Senior Software Engineer",
    "status": "active",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

---

### PUT `/api/jobs/:jobId`
Update an existing job.

**Request Body:** (Same as POST, all fields optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job-uuid",
    "updated_at": "2025-01-15T11:00:00Z"
  }
}
```

---

### DELETE `/api/jobs/:jobId`
Delete a job posting.

**Response:**
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

---

### POST `/api/jobs/:jobId/apply`
Apply for a job.

**Request Body:**
```json
{
  "applicant_id": "user-uuid",
  "cv_url": "https://example.com/cv.pdf",
  "cover_letter": "I am interested in this position..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "application-uuid",
    "job_id": "job-uuid",
    "applicant_id": "user-uuid",
    "status": "pending",
    "applied_at": "2025-01-15T10:00:00Z"
  }
}
```

---

### GET `/api/applications/user/:userId`
Get all applications by a user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "application-uuid",
      "job_id": "job-uuid",
      "applicant_id": "user-uuid",
      "cv_url": "https://example.com/cv.pdf",
      "cover_letter": "Cover letter text...",
      "status": "pending",
      "viewed_at": null,
      "response_message": null,
      "applied_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/jobs/:jobId/applications`
Get all applications for a specific job (for recruiters).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "application-uuid",
      "job_id": "job-uuid",
      "applicant_id": "user-uuid",
      "status": "pending",
      "applied_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### PUT `/api/applications/:applicationId`
Update application status (for recruiters).

**Request Body:**
```json
{
  "status": "shortlisted",
  "response_message": "We would like to schedule an interview..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "application-uuid",
    "status": "shortlisted",
    "updated_at": "2025-01-15T11:00:00Z"
  }
}
```

---

### GET `/api/jobs/user/:userId`
Get all jobs posted by a specific user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "job-uuid",
      "title": "Senior Software Engineer",
      "company": "Google",
      "status": "active",
      "applications_count": 25,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

## 3. Event API (`/api/events`)

### GET `/api/events`
Get all events with optional filters.

**Query Parameters:**
- `type` (optional): Filter by event type (workshop, webinar, conference, networking)
- `status` (optional): Filter by status (upcoming, past)
- `search` (optional): Search in title and description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "title": "Tech Career Workshop",
      "description": "Event description...",
      "event_type": "workshop",
      "location": "Main Campus Hall",
      "is_virtual": false,
      "meeting_link": null,
      "start_date": "2025-02-15T14:00:00Z",
      "end_date": "2025-02-15T17:00:00Z",
      "registration_deadline": "2025-02-10T23:59:59Z",
      "max_attendees": 100,
      "current_attendees_count": 45,
      "banner_image": "https://example.com/banner.jpg",
      "created_by": "user-uuid",
      "status": "published",
      "views_count": 200,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/events/:eventId`
Get event details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "title": "Tech Career Workshop",
    "description": "Full event description...",
    "event_type": "workshop",
    "location": "Main Campus Hall",
    "is_virtual": false,
    "meeting_link": null,
    "start_date": "2025-02-15T14:00:00Z",
    "end_date": "2025-02-15T17:00:00Z",
    "registration_deadline": "2025-02-10T23:59:59Z",
    "max_attendees": 100,
    "current_attendees_count": 45,
    "banner_image": "https://example.com/banner.jpg",
    "created_by": "user-uuid",
    "status": "published",
    "rsvps": [
      {
        "id": "rsvp-uuid",
        "event_id": "event-uuid",
        "user_id": "user-uuid",
        "status": "attending",
        "rsvp_date": "2025-01-20T10:00:00Z"
      }
    ]
  }
}
```

---

### POST `/api/events`
Create a new event.

**Request Body:**
```json
{
  "title": "Tech Career Workshop",
  "description": "Event description...",
  "event_type": "workshop",
  "location": "Main Campus Hall",
  "is_virtual": false,
  "meeting_link": null,
  "start_date": "2025-02-15T14:00:00Z",
  "end_date": "2025-02-15T17:00:00Z",
  "registration_deadline": "2025-02-10T23:59:59Z",
  "max_attendees": 100,
  "banner_image": "https://example.com/banner.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "title": "Tech Career Workshop",
    "status": "published",
    "created_at": "2025-01-15T10:00:00Z"
  },
  "message": "Event created successfully"
}
```

---

### PUT `/api/events/:eventId`
Update an existing event.

**Request Body:** (Same as POST, all fields optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "updated_at": "2025-01-15T11:00:00Z"
  },
  "message": "Event updated successfully"
}
```

---

### DELETE `/api/events/:eventId`
Delete an event.

**Response:**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

---

### POST `/api/events/:eventId/rsvp`
RSVP to an event.

**Request Body:**
```json
{
  "status": "attending"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rsvp-uuid",
    "event_id": "event-uuid",
    "user_id": "user-uuid",
    "status": "attending",
    "rsvp_date": "2025-01-15T10:00:00Z"
  },
  "message": "RSVP successful"
}
```

---

### GET `/api/events/:eventId/my-rsvp`
Get current user's RSVP for an event.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rsvp-uuid",
    "event_id": "event-uuid",
    "user_id": "user-uuid",
    "status": "attending",
    "rsvp_date": "2025-01-15T10:00:00Z"
  }
}
```

---

### GET `/api/events/:eventId/attendees`
Get all attendees for an event.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rsvp-uuid",
      "event_id": "event-uuid",
      "user_id": "user-uuid",
      "status": "attending",
      "rsvp_date": "2025-01-15T10:00:00Z",
      "user": {
        "id": "user-uuid",
        "email": "user@example.com",
        "role": "alumni"
      },
      "profile": {
        "name": "John Doe",
        "photo_url": "https://example.com/photo.jpg"
      }
    }
  ]
}
```

---

### GET `/api/events/my-events`
Get events created by current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "title": "Tech Career Workshop",
      "status": "published",
      "current_attendees_count": 45,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

## 4. Mentorship API (`/api/mentorship`)

### GET `/api/mentors`
Get all mentors with filters.

**Query Parameters:**
- `expertise` (optional): Filter by expertise area
- `available` (optional): Filter by availability

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mentor-uuid",
      "user_id": "user-uuid",
      "is_available": true,
      "expertise_areas": ["Software Engineering", "Career Development"],
      "max_mentees": 5,
      "current_mentees_count": 3,
      "rating": 4.8,
      "total_sessions": 50,
      "total_reviews": 15,
      "mentorship_approach": "Approach description...",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/mentors/:userId`
Get mentor profile by user ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "mentor-uuid",
    "user_id": "user-uuid",
    "is_available": true,
    "expertise_areas": ["Software Engineering", "Career Development"],
    "max_mentees": 5,
    "current_mentees_count": 3,
    "rating": 4.8,
    "total_sessions": 50,
    "total_reviews": 15,
    "mentorship_approach": "Approach description..."
  }
}
```

---

### POST `/api/mentorship/requests`
Create a mentorship request.

**Request Body:**
```json
{
  "mentor_id": "user-uuid",
  "request_message": "I would like mentorship in...",
  "goals": "My goals are...",
  "preferred_topics": ["Career Development", "Technical Skills"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "request-uuid",
    "student_id": "user-uuid",
    "mentor_id": "mentor-uuid",
    "status": "pending",
    "requested_at": "2025-01-15T10:00:00Z"
  },
  "message": "Mentorship request sent successfully"
}
```

---

### GET `/api/mentorship/my-requests`
Get mentorship requests sent by current user (as student).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "request-uuid",
      "student_id": "user-uuid",
      "mentor_id": "mentor-uuid",
      "request_message": "Request message...",
      "goals": "Goals...",
      "preferred_topics": ["Topic1", "Topic2"],
      "status": "pending",
      "requested_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/mentorship/received-requests`
Get mentorship requests received by current user (as mentor).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "request-uuid",
      "student_id": "user-uuid",
      "mentor_id": "mentor-uuid",
      "request_message": "Request message...",
      "status": "pending",
      "requested_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### PUT `/api/mentorship/requests/:requestId/accept`
Accept a mentorship request.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "request-uuid",
    "status": "accepted",
    "accepted_at": "2025-01-15T11:00:00Z"
  },
  "message": "Mentorship request accepted"
}
```

---

### PUT `/api/mentorship/requests/:requestId/reject`
Reject a mentorship request.

**Request Body:**
```json
{
  "reason": "Reason for rejection..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "request-uuid",
    "status": "rejected",
    "rejection_reason": "Reason...",
    "rejected_at": "2025-01-15T11:00:00Z"
  },
  "message": "Mentorship request rejected"
}
```

---

### GET `/api/mentorship/sessions`
Get all mentorship sessions for current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session-uuid",
      "mentorship_request_id": "request-uuid",
      "scheduled_date": "2025-02-01T15:00:00Z",
      "duration": 60,
      "status": "scheduled",
      "meeting_link": "https://meet.google.com/xxx",
      "agenda": "Session agenda...",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/mentorship/sessions/:sessionId`
Get session details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "mentorship_request_id": "request-uuid",
    "scheduled_date": "2025-02-01T15:00:00Z",
    "duration": 60,
    "status": "scheduled",
    "meeting_link": "https://meet.google.com/xxx",
    "agenda": "Session agenda...",
    "notes": null,
    "feedback": null,
    "rating": null,
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

---

### POST `/api/mentorship/sessions`
Schedule a new mentorship session.

**Request Body:**
```json
{
  "mentorship_request_id": "request-uuid",
  "scheduled_date": "2025-02-01T15:00:00Z",
  "duration": 60,
  "meeting_link": "https://meet.google.com/xxx",
  "agenda": "Session agenda..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "scheduled_date": "2025-02-01T15:00:00Z",
    "status": "scheduled"
  },
  "message": "Session scheduled successfully"
}
```

---

### PUT `/api/mentorship/sessions/:sessionId`
Update a mentorship session.

**Request Body:** (All fields optional)
```json
{
  "scheduled_date": "2025-02-01T16:00:00Z",
  "duration": 90,
  "meeting_link": "https://meet.google.com/yyy",
  "agenda": "Updated agenda..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "updated_at": "2025-01-15T11:00:00Z"
  },
  "message": "Session updated successfully"
}
```

---

### PUT `/api/mentorship/sessions/:sessionId/complete`
Mark a session as completed with feedback.

**Request Body:**
```json
{
  "notes": "Session notes...",
  "feedback": "Great session!",
  "rating": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "status": "completed",
    "completed_at": "2025-02-01T16:30:00Z"
  },
  "message": "Session completed successfully"
}
```

---

## 5. Forum API (`/api/forum`)

### GET `/api/forum/posts`
Get all forum posts with filters.

**Query Parameters:**
- `search` (optional): Search in title and content
- `tags` (optional): Filter by tags
- `sort` (optional): Sort by (recent, popular, trending)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "post-uuid",
      "title": "Post Title",
      "content": "Post content...",
      "author_id": "user-uuid",
      "tags": ["career", "advice"],
      "likes_count": 15,
      "comments_count": 8,
      "views_count": 120,
      "is_pinned": false,
      "is_deleted": false,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/forum/posts/:postId`
Get post details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "post-uuid",
    "title": "Post Title",
    "content": "Full post content...",
    "author_id": "user-uuid",
    "tags": ["career", "advice"],
    "likes_count": 15,
    "comments_count": 8,
    "views_count": 120,
    "is_pinned": false,
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

---

### POST `/api/forum/posts`
Create a new forum post.

**Request Body:**
```json
{
  "title": "Post Title",
  "content": "Post content...",
  "tags": ["career", "advice"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "post-uuid",
    "title": "Post Title",
    "created_at": "2025-01-15T10:00:00Z"
  },
  "message": "Post created successfully"
}
```

---

### PUT `/api/forum/posts/:postId`
Update a forum post.

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "tags": ["career", "advice", "tech"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "post-uuid",
    "updated_at": "2025-01-15T11:00:00Z"
  },
  "message": "Post updated successfully"
}
```

---

### DELETE `/api/forum/posts/:postId`
Delete a forum post.

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

### POST `/api/forum/posts/:postId/like`
Like/unlike a post.

**Response:**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likes_count": 16
  },
  "message": "Post liked successfully"
}
```

---

### GET `/api/forum/posts/:postId/comments`
Get all comments for a post.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment-uuid",
      "post_id": "post-uuid",
      "author_id": "user-uuid",
      "parent_comment_id": null,
      "content": "Comment content...",
      "likes_count": 5,
      "is_deleted": false,
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z"
    }
  ]
}
```

---

### POST `/api/forum/posts/:postId/comments`
Add a comment to a post.

**Request Body:**
```json
{
  "content": "Comment content...",
  "parent_comment_id": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "comment-uuid",
    "post_id": "post-uuid",
    "content": "Comment content...",
    "created_at": "2025-01-15T11:00:00Z"
  },
  "message": "Comment added successfully"
}
```

---

### PUT `/api/forum/comments/:commentId`
Update a comment.

**Request Body:**
```json
{
  "content": "Updated comment content..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "comment-uuid",
    "updated_at": "2025-01-15T11:30:00Z"
  },
  "message": "Comment updated successfully"
}
```

---

### DELETE `/api/forum/comments/:commentId`
Delete a comment.

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

### POST `/api/forum/comments/:commentId/like`
Like/unlike a comment.

**Response:**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likes_count": 6
  },
  "message": "Comment liked successfully"
}
```

---

## 6. Profile API (`/api/profiles`)

### GET `/api/profiles/:userId`
Get user profile by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "user_id": "user-uuid",
    "photo_url": "https://example.com/photo.jpg",
    "name": "John Doe",
    "bio": "Software Engineer at Google",
    "headline": "Senior Software Engineer",
    "current_company": "Google",
    "current_role": "Senior Software Engineer",
    "location": "San Francisco, CA",
    "batch_year": "2018",
    "experience_timeline": [...],
    "education_details": [...],
    "skills": ["Python", "React", "Node.js"],
    "achievements": [...],
    "social_links": {...},
    "cv_url": "https://example.com/cv.pdf",
    "profile_completion_percentage": 100,
    "is_verified": true
  }
}
```

---

### GET `/api/profiles/me`
Get current user's profile.

**Response:** (Same as GET `/api/profiles/:userId`)

---

### PUT `/api/profiles/:userId`
Update user profile.

**Request Body:** (All fields optional)
```json
{
  "name": "John Doe",
  "bio": "Updated bio...",
  "headline": "Senior Software Engineer",
  "current_company": "Google",
  "current_role": "Senior Software Engineer",
  "location": "San Francisco, CA",
  "batch_year": "2018",
  "skills": ["Python", "React", "Node.js"],
  "social_links": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "updated_at": "2025-01-15T11:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

---

### POST `/api/profiles/:userId/photo`
Upload profile photo.

**Request:** multipart/form-data with file field "photo"

**Response:**
```json
{
  "success": true,
  "data": {
    "photo_url": "https://example.com/photo.jpg"
  },
  "message": "Photo uploaded successfully"
}
```

---

### POST `/api/profiles/:userId/cv`
Upload CV.

**Request:** multipart/form-data with file field "cv"

**Response:**
```json
{
  "success": true,
  "data": {
    "cv_url": "https://example.com/cv.pdf"
  },
  "message": "CV uploaded successfully"
}
```

---

## 7. Directory API (`/api/directory`)

### GET `/api/directory/alumni`
Get all alumni with filters.

**Query Parameters:**
- `search` (optional): Search by name, company, role
- `batch_year` (optional): Filter by batch year
- `company` (optional): Filter by company
- `location` (optional): Filter by location
- `skills` (optional): Filter by skills

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "profile-uuid",
      "user_id": "user-uuid",
      "photo_url": "https://example.com/photo.jpg",
      "name": "John Doe",
      "headline": "Senior Software Engineer",
      "current_company": "Google",
      "current_role": "Senior Software Engineer",
      "location": "San Francisco, CA",
      "batch_year": "2018",
      "skills": ["Python", "React"],
      "is_verified": true
    }
  ]
}
```

---

### GET `/api/directory/search`
Search alumni by query.

**Query Parameters:**
- `q` (required): Search query

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "profile-uuid",
      "name": "John Doe",
      "headline": "Senior Software Engineer",
      "current_company": "Google",
      "photo_url": "https://example.com/photo.jpg"
    }
  ]
}
```

---

### GET `/api/directory/batch/:batchYear`
Get alumni by batch year.

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

---

### GET `/api/directory/company/:company`
Get alumni by company.

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

---

### GET `/api/directory/filters`
Get available filter options.

**Response:**
```json
{
  "success": true,
  "data": {
    "batch_years": ["2015", "2016", "2017", "2018"],
    "companies": ["Google", "Amazon", "Microsoft"],
    "locations": ["San Francisco", "New York", "Seattle"],
    "skills": ["Python", "React", "Node.js"]
  }
}
```

---

## 8. Notification API (`/api/notifications`)

### GET `/api/notifications`
Get all notifications for current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification-uuid",
      "user_id": "user-uuid",
      "type": "job_application",
      "title": "Application Update",
      "message": "Your application was reviewed",
      "link": "/jobs/job-uuid",
      "is_read": false,
      "priority": "high",
      "metadata": {},
      "read_at": null,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/notifications/unread-count`
Get unread notification count.

**Response:**
```json
{
  "success": true,
  "count": 5
}
```

---

### PUT `/api/notifications/:notificationId/read`
Mark notification as read.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "notification-uuid",
    "is_read": true,
    "read_at": "2025-01-15T11:00:00Z"
  },
  "message": "Notification marked as read"
}
```

---

### PUT `/api/notifications/read-all`
Mark all notifications as read.

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### DELETE `/api/notifications/:notificationId`
Delete a notification.

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

### GET `/api/notifications/preferences`
Get notification preferences.

**Response:**
```json
{
  "success": true,
  "data": {
    "email_notifications": true,
    "push_notifications": true,
    "job_alerts": true,
    "event_reminders": true,
    "mentorship_updates": true,
    "forum_replies": true
  }
}
```

---

### PUT `/api/notifications/preferences`
Update notification preferences.

**Request Body:**
```json
{
  "email_notifications": true,
  "push_notifications": false,
  "job_alerts": true,
  "event_reminders": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Preferences updated successfully"
}
```

---

## 9. Leaderboard API (`/api/leaderboard`)

### GET `/api/leaderboard`
Get leaderboard data.

**Query Parameters:**
- `limit` (optional): Number of results (default: 50)
- `timeframe` (optional): all_time, monthly, weekly

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "score-uuid",
      "user_id": "user-uuid",
      "total_score": 1250,
      "contributions": 45,
      "rank_position": 1,
      "level": "Expert",
      "last_calculated": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/leaderboard/user/:userId`
Get user engagement score.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "score-uuid",
    "user_id": "user-uuid",
    "total_score": 1250,
    "contributions": 45,
    "rank_position": 1,
    "level": "Expert",
    "breakdown": {
      "posts": 20,
      "comments": 15,
      "mentorship": 10
    }
  }
}
```

---

### GET `/api/badges`
Get all available badges.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "badge-uuid",
      "name": "First Post",
      "description": "Created your first forum post",
      "icon_url": "https://example.com/badge.png",
      "requirements": "Create 1 forum post",
      "rarity": "common",
      "points": 10
    }
  ]
}
```

---

### GET `/api/badges/user/:userId`
Get badges earned by a user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-badge-uuid",
      "user_id": "user-uuid",
      "badge_id": "badge-uuid",
      "earned_at": "2025-01-15T10:00:00Z",
      "badge": {
        "name": "First Post",
        "icon_url": "https://example.com/badge.png"
      }
    }
  ]
}
```

---

## 10. Alumni Card API (`/api/alumni-card`)

### GET `/api/alumni-card/:userId`
Get alumni card for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card-uuid",
    "user_id": "user-uuid",
    "card_number": "ALM-2025-001234",
    "qr_code_data": "encrypted_data",
    "issue_date": "2025-01-01T00:00:00Z",
    "expiry_date": "2026-01-01T00:00:00Z",
    "is_active": true,
    "verification_count": 5,
    "last_verified": "2025-01-15T10:00:00Z"
  }
}
```

---

### GET `/api/alumni-card/me`
Get current user's alumni card.

**Response:** (Same as GET `/api/alumni-card/:userId`)

---

### POST `/api/alumni-card/verify`
Verify an alumni card with QR code.

**Request Body:**
```json
{
  "qr_code_data": "encrypted_data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "card_holder": "John Doe",
    "batch_year": "2018",
    "verified_at": "2025-01-15T10:00:00Z"
  },
  "message": "Card verified successfully"
}
```

---

### POST `/api/alumni-card/:userId/generate`
Generate a new alumni card.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card-uuid",
    "card_number": "ALM-2025-001234",
    "qr_code_data": "encrypted_data",
    "issue_date": "2025-01-15T10:00:00Z"
  },
  "message": "Card generated successfully"
}
```

---

## 11. Career Paths API (`/api/career-paths`)

### GET `/api/career-paths`
Get all career paths with filters.

**Query Parameters:**
- `from_role` (optional): Filter by starting role
- `to_role` (optional): Filter by target role
- `industry` (optional): Filter by industry

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "path-uuid",
      "from_role": "Software Engineer",
      "to_role": "Engineering Manager",
      "steps": [
        {
          "title": "Senior Software Engineer",
          "duration_years": 2,
          "skills_needed": ["Leadership", "Architecture"]
        }
      ],
      "average_duration_years": 5,
      "success_stories_count": 12
    }
  ]
}
```

---

### GET `/api/career-paths/:pathId`
Get career path details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "path-uuid",
    "from_role": "Software Engineer",
    "to_role": "Engineering Manager",
    "steps": [...],
    "average_duration_years": 5,
    "success_stories": [...]
  }
}
```

---

### GET `/api/career-paths/transitions`
Get career transition data.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "from_role": "Software Engineer",
      "to_role": "Product Manager",
      "alumni_count": 8,
      "average_years": 4
    }
  ]
}
```

---

### GET `/api/career-paths/recommended/:userId`
Get recommended career paths for a user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "path-uuid",
      "from_role": "Software Engineer",
      "to_role": "Engineering Manager",
      "relevance_score": 0.85
    }
  ]
}
```

---

## 12. Heatmap API (`/api/heatmap`)

### GET `/api/heatmap/geographic`
Get geographic data for heatmap.

**Query Parameters:**
- `metric` (optional): alumni_count, job_count, both

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "location-uuid",
      "location_name": "San Francisco Bay Area",
      "country": "United States",
      "city": "San Francisco",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "alumni_count": 150,
      "jobs_count": 45,
      "top_skills": ["Python", "React", "AWS"],
      "top_companies": ["Google", "Meta", "Apple"],
      "top_industries": ["Technology", "Finance"],
      "last_updated": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/heatmap/alumni-distribution`
Get alumni distribution by location.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "location": "San Francisco Bay Area",
      "count": 150,
      "percentage": 15.5
    }
  ]
}
```

---

### GET `/api/heatmap/job-distribution`
Get job distribution by location.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "location": "San Francisco Bay Area",
      "count": 45,
      "percentage": 12.3
    }
  ]
}
```

---

### GET `/api/heatmap/location/:locationId`
Get detailed location data.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "location-uuid",
    "location_name": "San Francisco Bay Area",
    "alumni_count": 150,
    "jobs_count": 45,
    "top_skills": ["Python", "React", "AWS"],
    "top_companies": ["Google", "Meta", "Apple"],
    "alumni_profiles": [...],
    "available_jobs": [...]
  }
}
```

---

## 13. Skill Graph API (`/api/skills`)

### GET `/api/skills/graph`
Get skill graph data with relationships.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "skill-uuid",
      "skill_name": "React",
      "related_skills": ["JavaScript", "Redux", "Next.js"],
      "industry_connections": ["Technology", "Startups"],
      "alumni_count": 120,
      "job_count": 45,
      "popularity_score": 0.85
    }
  ]
}
```

---

### GET `/api/skills/:skillName`
Get details for a specific skill.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "skill-uuid",
    "skill_name": "React",
    "related_skills": ["JavaScript", "Redux", "Next.js"],
    "industry_connections": ["Technology", "Startups"],
    "alumni_count": 120,
    "job_count": 45,
    "popularity_score": 0.85,
    "trending": true
  }
}
```

---

### GET `/api/skills/:skillName/related`
Get related skills.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "skill_name": "JavaScript",
      "relationship_strength": 0.95
    },
    {
      "skill_name": "Redux",
      "relationship_strength": 0.78
    }
  ]
}
```

---

### GET `/api/skills/trending`
Get trending skills.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "skill_name": "AI/ML",
      "growth_rate": 1.45,
      "alumni_count": 85,
      "job_count": 32
    }
  ]
}
```

---

### GET `/api/skills/search`
Search skills by query.

**Query Parameters:**
- `q` (required): Search query

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "skill_name": "React",
      "alumni_count": 120,
      "job_count": 45
    }
  ]
}
```

---

## 14. Knowledge Capsules API (`/api/knowledge`)

### GET `/api/knowledge/capsules`
Get all knowledge capsules with filters.

**Query Parameters:**
- `category` (optional): Filter by category
- `tags` (optional): Filter by tags
- `featured` (optional): Filter featured capsules

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "capsule-uuid",
      "title": "Introduction to React Hooks",
      "content": "Article content...",
      "author_id": "user-uuid",
      "category": "Technology",
      "tags": ["React", "JavaScript", "Frontend"],
      "duration_minutes": 10,
      "featured_image": "https://example.com/image.jpg",
      "likes_count": 45,
      "views_count": 320,
      "bookmarks_count": 28,
      "is_featured": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/knowledge/capsules/:capsuleId`
Get capsule details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "capsule-uuid",
    "title": "Introduction to React Hooks",
    "content": "Full article content...",
    "author_id": "user-uuid",
    "category": "Technology",
    "tags": ["React", "JavaScript", "Frontend"],
    "duration_minutes": 10,
    "featured_image": "https://example.com/image.jpg",
    "likes_count": 45,
    "views_count": 320,
    "bookmarks_count": 28,
    "is_featured": true,
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

---

### POST `/api/knowledge/capsules`
Create a new knowledge capsule.

**Request Body:**
```json
{
  "title": "Introduction to React Hooks",
  "content": "Article content...",
  "category": "Technology",
  "tags": ["React", "JavaScript"],
  "duration_minutes": 10,
  "featured_image": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "capsule-uuid",
    "title": "Introduction to React Hooks",
    "created_at": "2025-01-15T10:00:00Z"
  },
  "message": "Capsule created successfully"
}
```

---

### PUT `/api/knowledge/capsules/:capsuleId`
Update a knowledge capsule.

**Request Body:** (All fields optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "capsule-uuid",
    "updated_at": "2025-01-15T11:00:00Z"
  },
  "message": "Capsule updated successfully"
}
```

---

### DELETE `/api/knowledge/capsules/:capsuleId`
Delete a knowledge capsule.

**Response:**
```json
{
  "success": true,
  "message": "Capsule deleted successfully"
}
```

---

### POST `/api/knowledge/capsules/:capsuleId/like`
Like/unlike a capsule.

**Response:**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likes_count": 46
  },
  "message": "Capsule liked successfully"
}
```

---

### POST `/api/knowledge/capsules/:capsuleId/bookmark`
Bookmark/unbookmark a capsule.

**Response:**
```json
{
  "success": true,
  "data": {
    "bookmarked": true,
    "bookmarks_count": 29
  },
  "message": "Capsule bookmarked successfully"
}
```

---

### GET `/api/knowledge/bookmarks`
Get bookmarked capsules for current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "capsule-uuid",
      "title": "Introduction to React Hooks",
      "category": "Technology",
      "bookmarked_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

## 🔐 Authentication & Authorization

### JWT Token Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Role-Based Access Control
Different endpoints require different roles:
- **Admin**: Full access to all endpoints
- **Alumni**: Can post jobs, create events, mentor students
- **Student**: Can apply for jobs, request mentorship, attend events
- **Recruiter**: Can post jobs, view applications

---

## 📝 Notes for Backend Implementation

1. **Database**: Use MySQL/MariaDB with schema provided in `/app/database_schema.sql`
2. **All routes must be prefixed with `/api`** to match Kubernetes ingress configuration
3. **CORS**: Enable CORS for frontend URL from environment variable
4. **Error Handling**: Return consistent error format with `success: false` and descriptive `message`
5. **Validation**: Validate all inputs on the server side
6. **Pagination**: Implement pagination for list endpoints (especially jobs, events, alumni)
7. **Rate Limiting**: Implement rate limiting to prevent abuse
8. **File Uploads**: Handle file uploads for photos, CVs, and documents
9. **Search**: Implement full-text search for relevant endpoints
10. **Filtering & Sorting**: Support query parameters for filtering and sorting
11. **Caching**: Consider implementing caching for frequently accessed data
12. **Logging**: Log all API requests and errors for debugging

---

## 🧪 Testing the API

Once backend is implemented, test the toggle by:

1. Set `REACT_APP_USE_MOCK_DATA=false` in `/app/frontend/.env`
2. Restart the frontend server
3. Verify all features work with backend API
4. Check console for "Service Mode: BACKEND API" message

---

**End of API Specification Document**
