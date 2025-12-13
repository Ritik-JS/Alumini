"""Pydantic models for database entities"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    STUDENT = "student"
    ALUMNI = "alumni"
    RECRUITER = "recruiter"
    ADMIN = "admin"


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.STUDENT


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    password_hash: str
    is_verified: bool = False
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    is_verified: bool
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class EmailVerificationRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str = Field(..., min_length=8)


class EmailVerification(BaseModel):
    id: str
    user_id: str
    otp_code: str
    expires_at: datetime
    is_used: bool = False
    created_at: datetime


class PasswordReset(BaseModel):
    id: str
    user_id: str
    reset_token: str
    expires_at: datetime
    is_used: bool = False
    created_at: datetime


# ============================================================================
# PHASE 2: ALUMNI PROFILE MODELS
# ============================================================================

class SocialLinks(BaseModel):
    """Social media links"""
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None


class ExperienceItem(BaseModel):
    """Work experience item"""
    company: str
    role: str
    start_date: str  # YYYY-MM format
    end_date: Optional[str] = None  # YYYY-MM format or None for current
    description: Optional[str] = None


class EducationItem(BaseModel):
    """Education item"""
    institution: str
    degree: str
    field: str
    start_year: int
    end_year: int
    achievements: Optional[list[str]] = None


class AlumniProfileCreate(BaseModel):
    """Create alumni profile request"""
    name: str = Field(..., min_length=2, max_length=255)
    bio: Optional[str] = None
    headline: Optional[str] = Field(None, max_length=500)
    current_company: Optional[str] = Field(None, max_length=255)
    current_role: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    batch_year: Optional[int] = Field(None, ge=1950, le=2030)
    experience_timeline: Optional[list[ExperienceItem]] = None
    education_details: Optional[list[EducationItem]] = None
    skills: Optional[list[str]] = None
    achievements: Optional[list[str]] = None
    social_links: Optional[SocialLinks] = None
    industry: Optional[str] = Field(None, max_length=255)
    years_of_experience: Optional[int] = Field(None, ge=0)
    willing_to_mentor: bool = False
    willing_to_hire: bool = False


class AlumniProfileUpdate(BaseModel):
    """Update alumni profile request"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    bio: Optional[str] = None
    headline: Optional[str] = Field(None, max_length=500)
    current_company: Optional[str] = Field(None, max_length=255)
    current_role: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    batch_year: Optional[int] = Field(None, ge=1950, le=2030)
    experience_timeline: Optional[list[ExperienceItem]] = None
    education_details: Optional[list[EducationItem]] = None
    skills: Optional[list[str]] = None
    achievements: Optional[list[str]] = None
    social_links: Optional[SocialLinks] = None
    industry: Optional[str] = Field(None, max_length=255)
    years_of_experience: Optional[int] = Field(None, ge=0)
    willing_to_mentor: Optional[bool] = None
    willing_to_hire: Optional[bool] = None


class AlumniProfileResponse(BaseModel):
    """Alumni profile response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    photo_url: Optional[str] = None
    name: str
    bio: Optional[str] = None
    headline: Optional[str] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    batch_year: Optional[int] = None
    experience_timeline: Optional[list] = None
    education_details: Optional[list] = None
    skills: Optional[list] = None
    achievements: Optional[list] = None
    social_links: Optional[dict] = None
    cv_url: Optional[str] = None
    industry: Optional[str] = None
    years_of_experience: Optional[int] = None
    willing_to_mentor: bool = False
    willing_to_hire: bool = False
    profile_completion_percentage: int = 0
    is_verified: bool = False
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ProfileSearchParams(BaseModel):
    """Search parameters for alumni profiles"""
    name: Optional[str] = None
    company: Optional[str] = None
    skills: Optional[list[str]] = None
    batch_year: Optional[int] = None
    job_role: Optional[str] = None
    location: Optional[str] = None
    verified_only: bool = False
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


class ProfileFilterOptions(BaseModel):
    """Available filter options"""
    companies: list[str]
    skills: list[str]
    locations: list[str]
    batch_years: list[int]
    industries: list[str]


class VerificationStatus(str, Enum):
    """Profile verification status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ProfileVerificationRequest(BaseModel):
    """Profile verification request"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    status: VerificationStatus
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class VerifyProfileRequest(BaseModel):
    """Admin verify profile request"""
    user_id: str


class RejectProfileRequest(BaseModel):
    """Admin reject profile request"""
    user_id: str
    rejection_reason: str = Field(..., min_length=10)


# ============================================================================
# PHASE 3: JOBS & CAREER MANAGEMENT MODELS
# ============================================================================

class JobType(str, Enum):
    """Job type enum"""
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    INTERNSHIP = "internship"
    CONTRACT = "contract"
    REMOTE = "remote"


class JobStatus(str, Enum):
    """Job status enum"""
    ACTIVE = "active"
    CLOSED = "closed"
    DRAFT = "draft"


class ApplicationStatus(str, Enum):
    """Application status enum"""
    PENDING = "pending"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"
    ACCEPTED = "accepted"


class JobCreate(BaseModel):
    """Create job posting request"""
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=50)
    company: str = Field(..., min_length=2, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    job_type: JobType
    experience_required: Optional[str] = Field(None, max_length=100)
    skills_required: Optional[list[str]] = None
    salary_range: Optional[str] = Field(None, max_length=100)
    apply_link: Optional[str] = Field(None, max_length=500)
    application_deadline: Optional[datetime] = None
    status: JobStatus = JobStatus.ACTIVE


class JobUpdate(BaseModel):
    """Update job posting request"""
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    description: Optional[str] = Field(None, min_length=50)
    company: Optional[str] = Field(None, min_length=2, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    job_type: Optional[JobType] = None
    experience_required: Optional[str] = Field(None, max_length=100)
    skills_required: Optional[list[str]] = None
    salary_range: Optional[str] = Field(None, max_length=100)
    apply_link: Optional[str] = Field(None, max_length=500)
    application_deadline: Optional[datetime] = None
    status: Optional[JobStatus] = None


class JobResponse(BaseModel):
    """Job response model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    description: str
    company: str
    location: Optional[str] = None
    job_type: str
    experience_required: Optional[str] = None
    skills_required: Optional[list] = None
    salary_range: Optional[str] = None
    apply_link: Optional[str] = None
    posted_by: str
    application_deadline: Optional[datetime] = None
    status: str
    views_count: int = 0
    applications_count: int = 0
    created_at: datetime
    updated_at: datetime


class JobSearchParams(BaseModel):
    """Job search parameters"""
    status: Optional[JobStatus] = None
    company: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    skills: Optional[list[str]] = None
    search: Optional[str] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


class JobApplicationCreate(BaseModel):
    """Create job application request"""
    cv_url: Optional[str] = Field(None, max_length=500)
    cover_letter: Optional[str] = None


class JobApplicationUpdate(BaseModel):
    """Update job application request (for recruiters)"""
    status: ApplicationStatus
    response_message: Optional[str] = None


class JobApplicationResponse(BaseModel):
    """Job application response model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    job_id: str
    applicant_id: str
    cv_url: Optional[str] = None
    cover_letter: Optional[str] = None
    status: str
    viewed_at: Optional[datetime] = None
    response_message: Optional[str] = None
    applied_at: datetime
    updated_at: datetime


class RecruiterAnalytics(BaseModel):
    """Recruiter analytics model"""
    total_jobs_posted: int
    active_jobs: int
    closed_jobs: int
    total_applications: int
    pending_applications: int
    shortlisted_applications: int
    recent_applications: list[JobApplicationResponse]


class ApplicationsSummary(BaseModel):
    """Applications summary for recruiter"""
    pending: int
    reviewed: int
    shortlisted: int
    rejected: int
    accepted: int
    total: int


# ============================================================================
# PHASE 4: MENTORSHIP SYSTEM MODELS
# ============================================================================

class MentorshipRequestStatus(str, Enum):
    """Mentorship request status enum"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class MentorshipSessionStatus(str, Enum):
    """Mentorship session status enum"""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    MISSED = "missed"


class MentorProfileCreate(BaseModel):
    """Create mentor profile request"""
    expertise_areas: list[str] = Field(..., min_items=1)
    max_mentees: int = Field(5, ge=1, le=20)
    mentorship_approach: Optional[str] = None


class MentorProfileUpdate(BaseModel):
    """Update mentor profile request"""
    is_available: Optional[bool] = None
    expertise_areas: Optional[list[str]] = Field(None, min_items=1)
    max_mentees: Optional[int] = Field(None, ge=1, le=20)
    mentorship_approach: Optional[str] = None


class MentorProfileResponse(BaseModel):
    """Mentor profile response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    is_available: bool
    expertise_areas: Optional[list] = None
    max_mentees: int
    current_mentees_count: int
    rating: float
    total_sessions: int
    total_reviews: int
    mentorship_approach: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class MentorWithProfile(BaseModel):
    """Mentor with user and alumni profile details"""
    id: str
    user_id: str
    name: str
    email: str
    photo_url: Optional[str] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    batch_year: Optional[int] = None
    is_available: bool
    expertise_areas: Optional[list] = None
    max_mentees: int
    current_mentees_count: int
    rating: float
    total_sessions: int
    total_reviews: int
    mentorship_approach: Optional[str] = None


class MentorSearchParams(BaseModel):
    """Mentor search parameters"""
    expertise: Optional[str] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    available_only: bool = True
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


class MentorshipRequestCreate(BaseModel):
    """Create mentorship request"""
    mentor_id: str
    request_message: str = Field(..., min_length=20, max_length=1000)
    goals: Optional[str] = Field(None, max_length=2000)
    preferred_topics: Optional[list[str]] = None


class MentorshipRequestResponse(BaseModel):
    """Mentorship request response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    student_id: str
    mentor_id: str
    request_message: str
    goals: Optional[str] = None
    preferred_topics: Optional[list] = None
    status: str
    rejection_reason: Optional[str] = None
    requested_at: datetime
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    updated_at: datetime


class MentorshipRequestWithDetails(BaseModel):
    """Mentorship request with user details"""
    id: str
    student_id: str
    student_name: str
    student_email: str
    student_photo: Optional[str] = None
    mentor_id: str
    mentor_name: str
    mentor_email: str
    mentor_photo: Optional[str] = None
    request_message: str
    goals: Optional[str] = None
    preferred_topics: Optional[list] = None
    status: str
    rejection_reason: Optional[str] = None
    requested_at: datetime
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None


class AcceptMentorshipRequest(BaseModel):
    """Accept mentorship request"""
    pass  # No additional fields needed


class RejectMentorshipRequest(BaseModel):
    """Reject mentorship request"""
    rejection_reason: str = Field(..., min_length=10, max_length=500)


class MentorshipSessionCreate(BaseModel):
    """Create mentorship session"""
    scheduled_date: datetime
    duration: int = Field(60, ge=15, le=300)  # 15 min to 5 hours
    meeting_link: Optional[str] = Field(None, max_length=500)
    agenda: Optional[str] = Field(None, max_length=2000)


class MentorshipSessionUpdate(BaseModel):
    """Update mentorship session"""
    scheduled_date: Optional[datetime] = None
    duration: Optional[int] = Field(None, ge=15, le=300)
    status: Optional[MentorshipSessionStatus] = None
    meeting_link: Optional[str] = Field(None, max_length=500)
    agenda: Optional[str] = Field(None, max_length=2000)
    notes: Optional[str] = Field(None, max_length=5000)


class MentorshipSessionFeedback(BaseModel):
    """Submit session feedback"""
    feedback: str = Field(..., min_length=10, max_length=2000)
    rating: int = Field(..., ge=1, le=5)
    notes: Optional[str] = Field(None, max_length=5000)


class MentorshipSessionResponse(BaseModel):
    """Mentorship session response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    mentorship_request_id: str
    scheduled_date: datetime
    duration: int
    status: str
    meeting_link: Optional[str] = None
    agenda: Optional[str] = None
    notes: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class MentorshipSessionWithDetails(BaseModel):
    """Mentorship session with mentor and student details"""
    id: str
    mentorship_request_id: str
    student_id: str
    student_name: str
    student_email: str
    mentor_id: str
    mentor_name: str
    mentor_email: str
    scheduled_date: datetime
    duration: int
    status: str
    meeting_link: Optional[str] = None
    agenda: Optional[str] = None
    notes: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = None
    created_at: datetime


class MentorStatistics(BaseModel):
    """Mentor statistics"""
    mentor_id: str
    mentor_name: str
    total_requests: int
    accepted_requests: int
    rejected_requests: int
    pending_requests: int
    total_sessions: int
    completed_sessions: int
    upcoming_sessions: int
    average_rating: float
    current_mentees: int
    max_mentees: int
    is_available: bool



# ============================================================================
# PHASE 5: EVENTS & COMMUNITY ENGAGEMENT MODELS
# ============================================================================

class EventType(str, Enum):
    """Event type enum"""
    WORKSHOP = "workshop"
    WEBINAR = "webinar"
    MEETUP = "meetup"
    CONFERENCE = "conference"
    NETWORKING = "networking"
    OTHER = "other"


class EventStatus(str, Enum):
    """Event status enum"""
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class RSVPStatus(str, Enum):
    """RSVP status enum"""
    ATTENDING = "attending"
    MAYBE = "maybe"
    NOT_ATTENDING = "not_attending"


class EventCreate(BaseModel):
    """Event creation model"""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=10)
    event_type: EventType
    location: Optional[str] = Field(None, max_length=255)
    is_virtual: bool = False
    meeting_link: Optional[str] = Field(None, max_length=500)
    start_date: datetime
    end_date: datetime
    registration_deadline: Optional[datetime] = None
    max_attendees: Optional[int] = Field(None, gt=0)
    banner_image: Optional[str] = Field(None, max_length=500)
    status: EventStatus = EventStatus.PUBLISHED
    
    @field_validator('meeting_link', 'banner_image', 'location', mode='before')
    @classmethod
    def empty_string_to_none(cls, v):
        """Convert empty strings to None for optional fields"""
        if isinstance(v, str) and v.strip() == '':
            return None
        return v
    
    @field_validator('registration_deadline', mode='before')
    @classmethod
    def empty_string_deadline_to_none(cls, v):
        """Convert empty string to None for registration_deadline"""
        if isinstance(v, str) and v.strip() == '':
            return None
        return v
    
    @field_validator('title', 'description', mode='after')
    @classmethod
    def strip_whitespace(cls, v):
        """Strip whitespace from string fields"""
        if isinstance(v, str):
            return v.strip()
        return v
    
    def model_post_init(self, __context):
        """Validate model after all fields are initialized"""
        # Validate end_date
        if self.end_date < self.start_date:
            raise ValueError('end_date must be after start_date')
        
        # Validate registration_deadline
        if self.registration_deadline and self.registration_deadline > self.start_date:
            raise ValueError('registration_deadline must be before start_date')
        
        # Validate virtual event
        if self.is_virtual and not self.meeting_link:
            raise ValueError('meeting_link is required for virtual events')
        
        # Validate physical event
        if not self.is_virtual and not self.location:
            raise ValueError('location is required for non-virtual events')


class EventUpdate(BaseModel):
    """Event update model"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    location: Optional[str] = Field(None, max_length=255)
    is_virtual: Optional[bool] = None
    meeting_link: Optional[str] = Field(None, max_length=500)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    max_attendees: Optional[int] = Field(None, gt=0)
    banner_image: Optional[str] = Field(None, max_length=500)
    status: Optional[EventStatus] = None


class EventResponse(BaseModel):
    """Event response model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    description: Optional[str] = None
    event_type: str
    location: Optional[str] = None
    is_virtual: bool
    meeting_link: Optional[str] = None
    start_date: datetime
    end_date: datetime
    registration_deadline: Optional[datetime] = None
    max_attendees: Optional[int] = None
    current_attendees_count: int
    banner_image: Optional[str] = None
    created_by: str
    status: str
    views_count: int
    created_at: datetime
    updated_at: datetime


class EventRSVPCreate(BaseModel):
    """Event RSVP creation model"""
    status: RSVPStatus = RSVPStatus.ATTENDING


class EventRSVPUpdate(BaseModel):
    """Event RSVP update model"""
    status: RSVPStatus


class EventRSVPResponse(BaseModel):
    """Event RSVP response model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    event_id: str
    user_id: str
    status: str
    rsvp_date: datetime
    updated_at: datetime


class EventWithRSVP(BaseModel):
    """Event with user RSVP status"""
    event: EventResponse
    user_rsvp: Optional[EventRSVPResponse] = None


class EventAttendeeUser(BaseModel):
    """User details for event attendee"""
    id: str
    email: str
    role: str
    is_verified: bool
    is_active: bool


class EventAttendeeProfile(BaseModel):
    """Profile details for event attendee"""
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
    """Event attendee details with nested user and profile"""
    id: str
    event_id: str
    user_id: str
    status: str
    rsvp_date: datetime
    user: EventAttendeeUser
    profile: Optional[EventAttendeeProfile] = None


# Forum Models

class ForumPostCreate(BaseModel):
    """Forum post creation model"""
    title: Optional[str] = Field(None, max_length=255)
    content: str = Field(..., min_length=1)
    tags: Optional[list[str]] = None


class ForumPostUpdate(BaseModel):
    """Forum post update model"""
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[list[str]] = None
    is_pinned: Optional[bool] = None


class ForumPostResponse(BaseModel):
    """Forum post response model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: Optional[str] = None
    content: str
    author_id: str
    tags: Optional[list] = None
    likes_count: int
    comments_count: int
    views_count: int
    is_pinned: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class ForumPostWithAuthor(BaseModel):
    """Forum post with author details"""
    id: str
    title: Optional[str] = None
    content: str
    author_id: str
    author_name: str
    author_email: str
    author_photo_url: Optional[str] = None
    author_role: str = "user"
    tags: Optional[list] = None
    likes_count: int
    comments_count: int
    views_count: int
    is_pinned: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    user_has_liked: bool = False


class ForumCommentCreate(BaseModel):
    """Forum comment creation model"""
    content: str = Field(..., min_length=1)
    parent_comment_id: Optional[str] = None


class ForumCommentUpdate(BaseModel):
    """Forum comment update model"""
    content: str = Field(..., min_length=1)


class ForumCommentResponse(BaseModel):
    """Forum comment response model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    post_id: str
    author_id: str
    parent_comment_id: Optional[str] = None
    content: str
    likes_count: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class ForumCommentWithAuthor(BaseModel):
    """Forum comment with author details"""
    id: str
    post_id: str
    author_id: str
    author_name: str
    author_email: str
    author_photo_url: Optional[str] = None
    author_role: str = "user"
    parent_comment_id: Optional[str] = None
    content: str
    likes_count: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    user_has_liked: bool = False
    replies: list["ForumCommentWithAuthor"] = []


class PostLikeResponse(BaseModel):
    """Post like response"""
    id: str
    post_id: str
    user_id: str
    created_at: datetime


class CommentLikeResponse(BaseModel):
    """Comment like response"""
    id: str
    comment_id: str
    user_id: str
    created_at: datetime


class LikeToggleResponse(BaseModel):
    """Like toggle response"""
    liked: bool
    likes_count: int


# ============================================================================
# PHASE 6: NOTIFICATIONS & REAL-TIME UPDATES MODELS
# ============================================================================

class NotificationType(str, Enum):
    """Notification types"""
    PROFILE = "profile"
    MENTORSHIP = "mentorship"
    JOB = "job"
    EVENT = "event"
    FORUM = "forum"
    SYSTEM = "system"
    VERIFICATION = "verification"


class NotificationPriority(str, Enum):
    """Notification priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class NotificationFrequency(str, Enum):
    """Notification frequency settings"""
    INSTANT = "instant"
    DAILY = "daily"
    WEEKLY = "weekly"


class NotificationBase(BaseModel):
    """Base notification model"""
    user_id: str
    type: NotificationType
    title: str = Field(..., max_length=255)
    message: str
    link: Optional[str] = Field(None, max_length=500)
    priority: NotificationPriority = NotificationPriority.MEDIUM
    metadata: Optional[dict] = None


class NotificationCreate(NotificationBase):
    """Create notification request"""
    pass


class NotificationInDB(NotificationBase):
    """Notification in database"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    is_read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime


class NotificationResponse(NotificationInDB):
    """Notification response"""
    pass


class NotificationListResponse(BaseModel):
    """Paginated notification list response"""
    notifications: list[NotificationResponse]
    total: int
    page: int
    limit: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    """Unread notification count response"""
    unread_count: int


class MarkReadResponse(BaseModel):
    """Mark notification as read response"""
    success: bool
    message: str


# Notification Preferences Models

class ProfileVisibility(str, Enum):
    """Profile visibility settings"""
    PUBLIC = "public"
    ALUMNI = "alumni"
    CONNECTIONS = "connections"
    PRIVATE = "private"


class NotificationPreferencesBase(BaseModel):
    """Base notification preferences"""
    email_notifications: bool = True
    push_notifications: bool = True
    notification_types: dict = Field(
        default_factory=lambda: {
            "profile": True,
            "mentorship": True,
            "job": True,
            "event": True,
            "forum": True,
            "system": True,
            "verification": True
        }
    )
    notification_frequency: NotificationFrequency = NotificationFrequency.INSTANT
    quiet_hours_start: Optional[str] = None  # Time in HH:MM format
    quiet_hours_end: Optional[str] = None    # Time in HH:MM format


class NotificationPreferencesUpdate(NotificationPreferencesBase):
    """Update notification preferences request"""
    pass


class NotificationPreferencesInDB(NotificationPreferencesBase):
    """Notification preferences in database"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class NotificationPreferencesResponse(NotificationPreferencesInDB):
    """Notification preferences response"""
    pass


# Privacy Settings Models

class PrivacySettingsBase(BaseModel):
    """Base privacy settings"""
    profile_visibility: ProfileVisibility = ProfileVisibility.PUBLIC
    show_email: bool = False
    show_phone: bool = False
    allow_messages: bool = True
    allow_mentorship_requests: bool = True
    show_in_directory: bool = True
    show_activity: bool = True


class PrivacySettingsUpdate(PrivacySettingsBase):
    """Update privacy settings request"""
    pass


class PrivacySettingsInDB(PrivacySettingsBase):
    """Privacy settings in database"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class PrivacySettingsResponse(PrivacySettingsInDB):
    """Privacy settings response"""
    pass


# Email Queue Models

class EmailStatus(str, Enum):
    """Email queue status"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class EmailQueueBase(BaseModel):
    """Base email queue model"""
    recipient_email: EmailStr
    subject: str = Field(..., max_length=255)
    body: str
    template_name: Optional[str] = Field(None, max_length=100)


class EmailQueueCreate(EmailQueueBase):
    """Create email queue entry"""
    pass


class EmailQueueInDB(EmailQueueBase):
    """Email queue in database"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    status: EmailStatus = EmailStatus.PENDING
    retry_count: int = 0
    error_message: Optional[str] = None
    scheduled_at: datetime
    sent_at: Optional[datetime] = None
    created_at: datetime


class EmailQueueResponse(EmailQueueInDB):
    """Email queue response"""
    pass


# ============================================================================
# PHASE 7: ADMIN DASHBOARD & ANALYTICS MODELS
# ============================================================================

# Admin Action Models

class AdminActionType(str, Enum):
    """Admin action types"""
    USER_MANAGEMENT = "user_management"
    CONTENT_MODERATION = "content_moderation"
    VERIFICATION = "verification"
    SYSTEM_CONFIG = "system_config"
    OTHER = "other"


class AdminActionCreate(BaseModel):
    """Create admin action"""
    admin_id: str
    action_type: AdminActionType
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    description: str
    metadata: Optional[dict] = None
    ip_address: Optional[str] = None


class AdminActionResponse(BaseModel):
    """Admin action response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    admin_id: str
    action_type: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    description: str
    metadata: Optional[dict] = None
    ip_address: Optional[str] = None
    timestamp: datetime


# Dashboard Metrics Models

class DashboardMetrics(BaseModel):
    """Admin dashboard key metrics"""
    total_users: int
    users_by_role: dict  # {student: 10, alumni: 20, recruiter: 5, admin: 2}
    verified_alumni: int
    pending_verifications: int
    total_jobs_posted: int
    active_jobs: int
    total_applications: int
    total_events: int
    upcoming_events: int
    total_rsvps: int
    total_mentorship_requests: int
    active_mentorships: int
    forum_posts_count: int
    forum_comments_count: int


class UserGrowthData(BaseModel):
    """User growth chart data"""
    date: str
    total_users: int
    new_users: int


class JobTrendData(BaseModel):
    """Job posting trend data"""
    date: str
    jobs_posted: int
    applications: int


class EventParticipationData(BaseModel):
    """Event participation trend data"""
    date: str
    events: int
    attendees: int


class MentorshipActivityData(BaseModel):
    """Mentorship activity data"""
    date: str
    requests: int
    sessions: int


class DashboardCharts(BaseModel):
    """Dashboard chart data"""
    user_growth: list[UserGrowthData]
    job_trends: list[JobTrendData]
    event_participation: list[EventParticipationData]
    mentorship_activity: list[MentorshipActivityData]


# Analytics Models

class SkillDistribution(BaseModel):
    """Skill distribution analytics"""
    skill: str
    count: int
    percentage: float


class LocationDistribution(BaseModel):
    """Location distribution with coordinates"""
    location: str
    country: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    alumni_count: int
    jobs_count: int


class CompanyDistribution(BaseModel):
    """Company distribution analytics"""
    company: str
    alumni_count: int
    percentage: float


class BatchDistribution(BaseModel):
    """Batch year distribution"""
    batch_year: int
    count: int


class JobTrendsByCategory(BaseModel):
    """Job trends by job type"""
    job_type: str
    count: int
    percentage: float


class MentorshipStats(BaseModel):
    """Mentorship program statistics"""
    total_mentors: int
    active_mentors: int
    total_mentees: int
    total_requests: int
    accepted_requests: int
    rejected_requests: int
    pending_requests: int
    total_sessions: int
    completed_sessions: int
    average_rating: float


class EventParticipationStats(BaseModel):
    """Event participation statistics"""
    total_events: int
    upcoming_events: int
    past_events: int
    total_rsvps: int
    average_attendance_rate: float
    events_by_type: dict  # {workshop: 10, webinar: 5, ...}


class EngagementMetrics(BaseModel):
    """User engagement metrics"""
    total_active_users: int
    average_engagement_score: float
    top_contributors: list[dict]  # [{user_id, name, score}, ...]
    engagement_by_level: dict  # {beginner: 50, active: 30, veteran: 15, legend: 5}


# User Management Models

class UserListParams(BaseModel):
    """User list query parameters"""
    role: Optional[UserRole] = None
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None
    search: Optional[str] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


class UserDetailResponse(BaseModel):
    """Detailed user information for admin"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    role: str
    is_verified: bool
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    profile: Optional[dict] = None  # Alumni profile if exists


class UserUpdateRequest(BaseModel):
    """Admin update user request"""
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserSuspendRequest(BaseModel):
    """Suspend user request"""
    reason: str = Field(..., min_length=10, max_length=500)


# Content Moderation Models

class ContentType(str, Enum):
    """Content types for moderation"""
    POST = "post"
    COMMENT = "comment"
    JOB = "job"
    EVENT = "event"
    PROFILE = "profile"


class ContentFlagStatus(str, Enum):
    """Content flag status"""
    PENDING = "pending"
    APPROVED = "approved"
    REMOVED = "removed"


class ContentFlagCreate(BaseModel):
    """Create content flag"""
    content_type: ContentType
    content_id: str
    reason: str = Field(..., min_length=10, max_length=1000)


class ContentFlagResponse(BaseModel):
    """Content flag response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    content_type: str
    content_id: str
    flagged_by: str
    reason: str
    status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class ContentModerateRequest(BaseModel):
    """Content moderation decision"""
    flag_id: str
    action: Literal["approve", "remove"]
    admin_notes: Optional[str] = None


class FlaggedContentListParams(BaseModel):
    """Flagged content list parameters"""
    content_type: Optional[ContentType] = None
    status: Optional[ContentFlagStatus] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


# System Configuration Models

class SystemConfigType(str, Enum):
    """System configuration types"""
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    JSON = "json"


class SystemConfigUpdate(BaseModel):
    """Update system configuration"""
    config_key: str
    config_value: str
    description: Optional[str] = None


class SystemConfigResponse(BaseModel):
    """System configuration response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    config_key: str
    config_value: str
    config_type: str
    description: Optional[str] = None
    is_public: bool
    updated_by: Optional[str] = None
    updated_at: datetime


class SystemConfigListResponse(BaseModel):
    """List of system configurations"""
    configs: list[SystemConfigResponse]
    total: int


# System Metrics Models

class SystemMetricCreate(BaseModel):
    """Create system metric"""
    metric_name: str
    metric_value: float
    metric_unit: Optional[str] = None
    category: Optional[str] = None


class SystemMetricResponse(BaseModel):
    """System metric response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    metric_name: str
    metric_value: float
    metric_unit: Optional[str] = None
    category: Optional[str] = None
    recorded_at: datetime


# ============================================================================
# PHASE 8: SMART ALGORITHMS & MATCHING MODELS
# ============================================================================

# User Interests Models

class UserInterestsBase(BaseModel):
    """Base user interests model"""
    interest_tags: Optional[list[str]] = None
    interaction_history: Optional[dict] = None  # {jobs: [...], events: [...], posts: [...]}
    preferred_industries: Optional[list[str]] = None
    preferred_locations: Optional[list[str]] = None


class UserInterestsUpdate(UserInterestsBase):
    """Update user interests"""
    pass


class UserInterestsResponse(UserInterestsBase):
    """User interests response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    last_updated: datetime


# Engagement Score Models

class ContributionType(str, Enum):
    """Contribution types"""
    PROFILE_UPDATE = "profile_update"
    MENTORSHIP = "mentorship"
    JOB_POST = "job_post"
    EVENT_ATTEND = "event_attend"
    FORUM_POST = "forum_post"
    FORUM_COMMENT = "forum_comment"
    HELP_OTHERS = "help_others"


class ContributionHistoryCreate(BaseModel):
    """Create contribution history entry"""
    user_id: str
    contribution_type: ContributionType
    points_earned: int
    description: Optional[str] = None


class ContributionHistoryResponse(BaseModel):
    """Contribution history response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    contribution_type: str
    points_earned: int
    description: Optional[str] = None
    created_at: datetime


class EngagementScoreResponse(BaseModel):
    """Engagement score response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    total_score: int
    contributions: Optional[dict] = None  # Breakdown by type
    rank_position: Optional[int] = None
    level: Optional[str] = None
    last_calculated: datetime


class LeaderboardEntry(BaseModel):
    """Leaderboard entry"""
    user_id: str
    name: str
    photo_url: Optional[str] = None
    role: str
    total_score: int
    rank_position: int
    level: str
    contributions: Optional[dict] = None


class LeaderboardResponse(BaseModel):
    """Leaderboard response"""
    entries: list[LeaderboardEntry]
    total_users: int
    user_rank: Optional[int] = None


# Badge Models

class BadgeRarity(str, Enum):
    """Badge rarity levels"""
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class BadgeResponse(BaseModel):
    """Badge response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    requirements: Optional[dict] = None
    rarity: str
    points: int
    created_at: datetime


class UserBadgeResponse(BaseModel):
    """User badge response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    badge_id: str
    earned_at: datetime
    badge: Optional[BadgeResponse] = None


# Matching Models

class MentorSuggestionRequest(BaseModel):
    """Request for mentor suggestions"""
    user_skills: Optional[list[str]] = None
    interest_areas: Optional[list[str]] = None
    preferred_industries: Optional[list[str]] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    limit: int = Field(10, ge=1, le=50)


class MentorSuggestion(BaseModel):
    """Mentor suggestion with match score"""
    mentor_id: str
    user_id: str
    name: str
    email: str
    photo_url: Optional[str] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    expertise_areas: list
    rating: float
    total_sessions: int
    match_score: float  # 0.0 to 1.0
    matching_skills: list[str]
    matching_reasons: list[str]


class JobRecommendationRequest(BaseModel):
    """Request for job recommendations"""
    user_id: Optional[str] = None
    user_skills: Optional[list[str]] = None
    preferred_locations: Optional[list[str]] = None
    preferred_job_types: Optional[list[str]] = None
    min_experience: Optional[int] = None
    limit: int = Field(10, ge=1, le=50)


class JobRecommendation(BaseModel):
    """Job recommendation with match score"""
    job_id: str
    title: str
    company: str
    location: Optional[str] = None
    job_type: str
    skills_required: list
    experience_required: Optional[str] = None
    salary_range: Optional[str] = None
    match_score: float  # 0.0 to 1.0
    matching_skills: list[str]
    missing_skills: list[str]
    matching_reasons: list[str]


class AlumniConnectionRequest(BaseModel):
    """Request for alumni connection suggestions"""
    user_id: str
    limit: int = Field(10, ge=1, le=50)


class AlumniConnectionSuggestion(BaseModel):
    """Alumni connection suggestion with similarity score"""
    user_id: str
    name: str
    email: str
    photo_url: Optional[str] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    batch_year: Optional[int] = None
    skills: list
    similarity_score: float  # 0.0 to 1.0
    common_skills: list[str]
    common_interests: list[str]
    matching_reasons: list[str]


# Recommendation Models

class EventRecommendation(BaseModel):
    """Event recommendation"""
    event_id: str
    title: str
    description: Optional[str] = None
    event_type: str
    start_date: datetime
    location: Optional[str] = None
    is_virtual: bool
    relevance_score: float  # 0.0 to 1.0
    recommendation_reason: str


class PostRecommendation(BaseModel):
    """Forum post recommendation"""
    post_id: str
    title: Optional[str] = None
    content: str
    author_name: str
    tags: list
    likes_count: int
    comments_count: int
    relevance_score: float  # 0.0 to 1.0
    recommendation_reason: str
    created_at: datetime


class AlumniRecommendation(BaseModel):
    """Alumni profile recommendation"""
    user_id: str
    name: str
    photo_url: Optional[str] = None
    headline: Optional[str] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    skills: list
    relevance_score: float  # 0.0 to 1.0
    recommendation_reason: str


# ============================================================================
# PHASE 9: INNOVATIVE FEATURES - KNOWLEDGE CAPSULES SYSTEM
# ============================================================================

class CapsuleCategory(str, Enum):
    """Knowledge capsule categories"""
    TECHNICAL = "technical"
    CAREER = "career"
    ENTREPRENEURSHIP = "entrepreneurship"
    LIFE_LESSONS = "life_lessons"
    INDUSTRY_INSIGHTS = "industry_insights"
    OTHER = "other"


class KnowledgeCapsuleCreate(BaseModel):
    """Request model for creating a knowledge capsule"""
    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=50)
    category: CapsuleCategory
    tags: list[str] = Field(default_factory=list, max_length=10)
    duration_minutes: Optional[int] = Field(None, ge=1, le=120)
    featured_image: Optional[str] = None


class KnowledgeCapsuleUpdate(BaseModel):
    """Request model for updating a knowledge capsule"""
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    content: Optional[str] = Field(None, min_length=50)
    category: Optional[CapsuleCategory] = None
    tags: Optional[list[str]] = Field(None, max_length=10)
    duration_minutes: Optional[int] = Field(None, ge=1, le=120)
    featured_image: Optional[str] = None
    is_featured: Optional[bool] = None


class KnowledgeCapsuleResponse(BaseModel):
    """Response model for knowledge capsule"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    content: str
    author_id: str
    author_name: Optional[str] = None
    author_photo: Optional[str] = None
    category: str
    tags: list[str]
    duration_minutes: Optional[int] = None
    featured_image: Optional[str] = None
    likes_count: int = 0
    views_count: int = 0
    bookmarks_count: int = 0
    is_featured: bool = False
    is_liked_by_user: Optional[bool] = None
    is_bookmarked_by_user: Optional[bool] = None
    created_at: datetime
    updated_at: datetime


class KnowledgeCapsuleListResponse(BaseModel):
    """Response model for list of knowledge capsules"""
    data: list[KnowledgeCapsuleResponse]
    total: int
    page: int
    limit: int
    has_more: bool


class CapsuleBookmarkResponse(BaseModel):
    """Response for bookmark action"""
    capsule_id: str
    is_bookmarked: bool
    bookmarks_count: int


class CapsuleLikeResponse(BaseModel):
    """Response for like action"""
    capsule_id: str
    is_liked: bool
    likes_count: int

