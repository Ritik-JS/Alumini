"""Job service for job and application management"""
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import aiomysql

from database.connection import get_db_pool
from database.models import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobSearchParams,
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    RecruiterAnalytics,
    ApplicationsSummary,
    JobStatus,
    ApplicationStatus
)

logger = logging.getLogger(__name__)


class JobService:
    """Service for managing jobs and applications"""
    
    @staticmethod
    async def create_job(user_id: str, job_data: JobCreate) -> Dict[str, Any]:
        """Create a new job posting"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Prepare skills JSON
                skills_json = json.dumps(job_data.skills_required) if job_data.skills_required else None
                
                # Insert job
                query = """
                INSERT INTO jobs (
                    title, description, company, location, job_type,
                    experience_required, skills_required, salary_range,
                    apply_link, posted_by, application_deadline, status
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """
                await cursor.execute(query, (
                    job_data.title, job_data.description, job_data.company,
                    job_data.location, job_data.job_type.value,
                    job_data.experience_required, skills_json, job_data.salary_range,
                    job_data.apply_link, user_id, job_data.application_deadline,
                    job_data.status.value
                ))
                await conn.commit()
                
                # Get the created job
                job_id = cursor.lastrowid
                return await JobService.get_job_by_id(str(job_id))
    
    @staticmethod
    async def get_job_by_id(job_id: str) -> Optional[Dict[str, Any]]:
        """Get job by ID"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    """
                    SELECT * FROM jobs WHERE id = %s
                    """,
                    (job_id,)
                )
                job = await cursor.fetchone()
                
                if job:
                    # Increment views count
                    await cursor.execute(
                        "UPDATE jobs SET views_count = views_count + 1 WHERE id = %s",
                        (job_id,)
                    )
                    await conn.commit()
                    
                    # Parse JSON fields
                    job = JobService._parse_job_json_fields(job)
                
                return job
    
    @staticmethod
    async def update_job(job_id: str, user_id: str, job_data: JobUpdate) -> Dict[str, Any]:
        """Update job posting (only by poster or admin)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Verify ownership
                await cursor.execute(
                    "SELECT posted_by FROM jobs WHERE id = %s",
                    (job_id,)
                )
                job = await cursor.fetchone()
                if not job:
                    raise ValueError("Job not found")
                
                # Check if user is owner or admin
                await cursor.execute(
                    "SELECT role FROM users WHERE id = %s",
                    (user_id,)
                )
                user = await cursor.fetchone()
                if job['posted_by'] != user_id and user['role'] != 'admin':
                    raise PermissionError("You don't have permission to update this job")
                
                # Build update query dynamically
                update_fields = []
                values = []
                
                if job_data.title is not None:
                    update_fields.append("title = %s")
                    values.append(job_data.title)
                
                if job_data.description is not None:
                    update_fields.append("description = %s")
                    values.append(job_data.description)
                
                if job_data.company is not None:
                    update_fields.append("company = %s")
                    values.append(job_data.company)
                
                if job_data.location is not None:
                    update_fields.append("location = %s")
                    values.append(job_data.location)
                
                if job_data.job_type is not None:
                    update_fields.append("job_type = %s")
                    values.append(job_data.job_type.value)
                
                if job_data.experience_required is not None:
                    update_fields.append("experience_required = %s")
                    values.append(job_data.experience_required)
                
                if job_data.skills_required is not None:
                    update_fields.append("skills_required = %s")
                    values.append(json.dumps(job_data.skills_required))
                
                if job_data.salary_range is not None:
                    update_fields.append("salary_range = %s")
                    values.append(job_data.salary_range)
                
                if job_data.apply_link is not None:
                    update_fields.append("apply_link = %s")
                    values.append(job_data.apply_link)
                
                if job_data.application_deadline is not None:
                    update_fields.append("application_deadline = %s")
                    values.append(job_data.application_deadline)
                
                if job_data.status is not None:
                    update_fields.append("status = %s")
                    values.append(job_data.status.value)
                
                if not update_fields:
                    return await JobService.get_job_by_id(job_id)
                
                values.append(job_id)
                query = f"""
                UPDATE jobs 
                SET {', '.join(update_fields)}
                WHERE id = %s
                """
                
                await cursor.execute(query, values)
                await conn.commit()
                
                return await JobService.get_job_by_id(job_id)
    
    @staticmethod
    async def delete_job(job_id: str, user_id: str) -> bool:
        """Delete job (only by poster or admin)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Verify ownership
                await cursor.execute(
                    "SELECT posted_by FROM jobs WHERE id = %s",
                    (job_id,)
                )
                job = await cursor.fetchone()
                if not job:
                    raise ValueError("Job not found")
                
                # Check if user is owner or admin
                await cursor.execute(
                    "SELECT role FROM users WHERE id = %s",
                    (user_id,)
                )
                user = await cursor.fetchone()
                if job['posted_by'] != user_id and user['role'] != 'admin':
                    raise PermissionError("You don't have permission to delete this job")
                
                # Delete job
                await cursor.execute("DELETE FROM jobs WHERE id = %s", (job_id,))
                await conn.commit()
                
                return cursor.rowcount > 0
    
    @staticmethod
    async def close_job(job_id: str, user_id: str) -> Dict[str, Any]:
        """Close job posting"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Verify ownership
                await cursor.execute(
                    "SELECT posted_by FROM jobs WHERE id = %s",
                    (job_id,)
                )
                job = await cursor.fetchone()
                if not job:
                    raise ValueError("Job not found")
                
                if job['posted_by'] != user_id:
                    raise PermissionError("You don't have permission to close this job")
                
                # Close job
                await cursor.execute(
                    "UPDATE jobs SET status = %s WHERE id = %s",
                    (JobStatus.CLOSED.value, job_id)
                )
                await conn.commit()
                
                return await JobService.get_job_by_id(job_id)
    
    @staticmethod
    async def search_jobs(search_params: JobSearchParams) -> Dict[str, Any]:
        """Search jobs with filters"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build WHERE clauses
                where_clauses = []
                values = []
                
                if search_params.status:
                    where_clauses.append("status = %s")
                    values.append(search_params.status.value)
                
                if search_params.company:
                    where_clauses.append("company LIKE %s")
                    values.append(f"%{search_params.company}%")
                
                if search_params.location:
                    where_clauses.append("location LIKE %s")
                    values.append(f"%{search_params.location}%")
                
                if search_params.job_type:
                    where_clauses.append("job_type = %s")
                    values.append(search_params.job_type.value)
                
                if search_params.search:
                    where_clauses.append("(title LIKE %s OR description LIKE %s)")
                    search_term = f"%{search_params.search}%"
                    values.extend([search_term, search_term])
                
                if search_params.skills:
                    skill_conditions = []
                    for skill in search_params.skills:
                        skill_conditions.append("JSON_CONTAINS(skills_required, %s)")
                        values.append(json.dumps(skill))
                    where_clauses.append(f"({' OR '.join(skill_conditions)})")
                
                where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
                
                # Count total results
                count_query = f"SELECT COUNT(*) as total FROM jobs {where_sql}"
                await cursor.execute(count_query, values)
                total_result = await cursor.fetchone()
                total = total_result['total'] if total_result else 0
                
                # Get paginated results
                offset = (search_params.page - 1) * search_params.limit
                query = f"""
                SELECT * FROM jobs 
                {where_sql}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """
                values.extend([search_params.limit, offset])
                
                await cursor.execute(query, values)
                jobs = await cursor.fetchall()
                
                # Parse JSON fields
                parsed_jobs = [JobService._parse_job_json_fields(job) for job in jobs]
                
                return {
                    "jobs": parsed_jobs,
                    "total": total,
                    "page": search_params.page,
                    "limit": search_params.limit,
                    "total_pages": (total + search_params.limit - 1) // search_params.limit
                }
    
    @staticmethod
    async def apply_for_job(job_id: str, applicant_id: str, application_data: JobApplicationCreate) -> Dict[str, Any]:
        """Apply for a job"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if job exists and is active
                await cursor.execute(
                    "SELECT id, status FROM jobs WHERE id = %s",
                    (job_id,)
                )
                job = await cursor.fetchone()
                if not job:
                    raise ValueError("Job not found")
                if job['status'] != JobStatus.ACTIVE.value:
                    raise ValueError("This job is no longer accepting applications")
                
                # Check if already applied
                await cursor.execute(
                    "SELECT id FROM job_applications WHERE job_id = %s AND applicant_id = %s",
                    (job_id, applicant_id)
                )
                existing = await cursor.fetchone()
                if existing:
                    raise ValueError("You have already applied for this job")
                
                # Create application
                query = """
                INSERT INTO job_applications (
                    job_id, applicant_id, cv_url, cover_letter, status
                ) VALUES (%s, %s, %s, %s, %s)
                """
                await cursor.execute(query, (
                    job_id, applicant_id, application_data.cv_url,
                    application_data.cover_letter, ApplicationStatus.PENDING.value
                ))
                await conn.commit()
                
                # Get the created application
                application_id = cursor.lastrowid
                return await JobService.get_application_by_id(str(application_id))
    
    @staticmethod
    async def get_application_by_id(application_id: str) -> Optional[Dict[str, Any]]:
        """Get application by ID"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    "SELECT * FROM job_applications WHERE id = %s",
                    (application_id,)
                )
                return await cursor.fetchone()
    
    @staticmethod
    async def get_job_applications(job_id: str, poster_id: str) -> List[Dict[str, Any]]:
        """Get all applications for a job (only for job poster)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Verify ownership
                await cursor.execute(
                    "SELECT posted_by FROM jobs WHERE id = %s",
                    (job_id,)
                )
                job = await cursor.fetchone()
                if not job:
                    raise ValueError("Job not found")
                
                if job['posted_by'] != poster_id:
                    raise PermissionError("You don't have permission to view these applications")
                
                # Get applications
                await cursor.execute(
                    """
                    SELECT ja.*, u.email, u.role 
                    FROM job_applications ja
                    JOIN users u ON ja.applicant_id = u.id
                    WHERE ja.job_id = %s
                    ORDER BY ja.applied_at DESC
                    """,
                    (job_id,)
                )
                return await cursor.fetchall()
    
    @staticmethod
    async def get_user_applications(user_id: str) -> List[Dict[str, Any]]:
        """Get all applications submitted by a user"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    """
                    SELECT ja.*, j.title, j.company, j.status as job_status
                    FROM job_applications ja
                    JOIN jobs j ON ja.job_id = j.id
                    WHERE ja.applicant_id = %s
                    ORDER BY ja.applied_at DESC
                    """,
                    (user_id,)
                )
                return await cursor.fetchall()
    
    @staticmethod
    async def update_application_status(
        application_id: str, 
        recruiter_id: str, 
        update_data: JobApplicationUpdate
    ) -> Dict[str, Any]:
        """Update application status (for recruiters)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get application and verify recruiter owns the job
                await cursor.execute(
                    """
                    SELECT ja.*, j.posted_by
                    FROM job_applications ja
                    JOIN jobs j ON ja.job_id = j.id
                    WHERE ja.id = %s
                    """,
                    (application_id,)
                )
                application = await cursor.fetchone()
                if not application:
                    raise ValueError("Application not found")
                
                if application['posted_by'] != recruiter_id:
                    raise PermissionError("You don't have permission to update this application")
                
                # Update application
                await cursor.execute(
                    """
                    UPDATE job_applications 
                    SET status = %s, response_message = %s, viewed_at = NOW()
                    WHERE id = %s
                    """,
                    (update_data.status.value, update_data.response_message, application_id)
                )
                await conn.commit()
                
                return await JobService.get_application_by_id(application_id)
    
    @staticmethod
    async def get_recruiter_jobs(recruiter_id: str) -> List[Dict[str, Any]]:
        """Get all jobs posted by a recruiter"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    """
                    SELECT * FROM jobs 
                    WHERE posted_by = %s 
                    ORDER BY created_at DESC
                    """,
                    (recruiter_id,)
                )
                jobs = await cursor.fetchall()
                return [JobService._parse_job_json_fields(job) for job in jobs]
    
    @staticmethod
    async def get_recruiter_analytics(recruiter_id: str) -> RecruiterAnalytics:
        """Get analytics for a recruiter"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get job statistics
                await cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total_jobs,
                        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs,
                        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_jobs
                    FROM jobs
                    WHERE posted_by = %s
                    """,
                    (recruiter_id,)
                )
                job_stats = await cursor.fetchone()
                
                # Get application statistics
                await cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total_applications,
                        SUM(CASE WHEN ja.status = 'pending' THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN ja.status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted
                    FROM job_applications ja
                    JOIN jobs j ON ja.job_id = j.id
                    WHERE j.posted_by = %s
                    """,
                    (recruiter_id,)
                )
                app_stats = await cursor.fetchone()
                
                # Get recent applications
                await cursor.execute(
                    """
                    SELECT ja.*
                    FROM job_applications ja
                    JOIN jobs j ON ja.job_id = j.id
                    WHERE j.posted_by = %s
                    ORDER BY ja.applied_at DESC
                    LIMIT 10
                    """,
                    (recruiter_id,)
                )
                recent_apps = await cursor.fetchall()
                
                return RecruiterAnalytics(
                    total_jobs_posted=job_stats['total_jobs'] or 0,
                    active_jobs=job_stats['active_jobs'] or 0,
                    closed_jobs=job_stats['closed_jobs'] or 0,
                    total_applications=app_stats['total_applications'] or 0,
                    pending_applications=app_stats['pending'] or 0,
                    shortlisted_applications=app_stats['shortlisted'] or 0,
                    recent_applications=[JobApplicationResponse(**app) for app in recent_apps]
                )
    
    @staticmethod
    async def get_applications_summary(recruiter_id: str) -> ApplicationsSummary:
        """Get applications summary for a recruiter"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN ja.status = 'pending' THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN ja.status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
                        SUM(CASE WHEN ja.status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
                        SUM(CASE WHEN ja.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                        SUM(CASE WHEN ja.status = 'accepted' THEN 1 ELSE 0 END) as accepted
                    FROM job_applications ja
                    JOIN jobs j ON ja.job_id = j.id
                    WHERE j.posted_by = %s
                    """,
                    (recruiter_id,)
                )
                stats = await cursor.fetchone()
                
                return ApplicationsSummary(
                    pending=stats['pending'] or 0,
                    reviewed=stats['reviewed'] or 0,
                    shortlisted=stats['shortlisted'] or 0,
                    rejected=stats['rejected'] or 0,
                    accepted=stats['accepted'] or 0,
                    total=stats['total'] or 0
                )
    
    @staticmethod
    def _parse_job_json_fields(job: Dict[str, Any]) -> Dict[str, Any]:
        """Parse JSON fields in job"""
        if job.get('skills_required'):
            try:
                if isinstance(job['skills_required'], str):
                    job['skills_required'] = json.loads(job['skills_required'])
            except:
                job['skills_required'] = []
        return job
