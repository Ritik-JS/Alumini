"""Pydantic models for database entities"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
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
