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
