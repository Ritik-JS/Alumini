"""Mentorship service for mentor-mentee management"""
import json
import logging
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
import aiomysql

from database.connection import get_db_pool
from database.models import (
    MentorProfileCreate,
    MentorProfileUpdate,
    MentorSearchParams,
    MentorshipRequestCreate,
    MentorshipRequestStatus,
    MentorshipSessionCreate,
    MentorshipSessionUpdate,
    MentorshipSessionFeedback,
    MentorshipSessionStatus,
    AcceptMentorshipRequest,
    RejectMentorshipRequest
)

logger = logging.getLogger(__name__)


class MentorshipService:
    """Service for managing mentorship system"""
    
    # ========================================================================
    # MENTOR PROFILE MANAGEMENT
    # ========================================================================
    
    @staticmethod
    async def register_as_mentor(user_id: str, profile_data: MentorProfileCreate) -> Dict[str, Any]:
        """Register user as mentor (Alumni only)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if mentor profile already exists
                await cursor.execute(
                    "SELECT id FROM mentor_profiles WHERE user_id = %s",
                    (user_id,)
                )
                existing = await cursor.fetchone()
                if existing:
                    raise ValueError("Mentor profile already exists for this user")
                
                # Check if user is alumni with complete profile
                await cursor.execute(
                    """
                    SELECT ap.id, ap.profile_completion_percentage, u.role
                    FROM users u
                    LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                    WHERE u.id = %s
                    """,
                    (user_id,)
                )
                user_data = await cursor.fetchone()
                
                if not user_data or user_data['role'] != 'alumni':
                    raise ValueError("Only alumni can register as mentors")
                
                if not user_data['id']:
                    raise ValueError("Please complete your alumni profile before registering as mentor")
                
                if user_data['profile_completion_percentage'] < 70:
                    raise ValueError("Please complete at least 70% of your profile to register as mentor")
                
                # Prepare JSON fields
                expertise_json = json.dumps(profile_data.expertise_areas)
                
                # Insert mentor profile
                query = """
                INSERT INTO mentor_profiles (
                    user_id, expertise_areas, max_mentees, mentorship_approach, is_available
                ) VALUES (%s, %s, %s, %s, %s)
                """
                await cursor.execute(query, (
                    user_id, expertise_json, profile_data.max_mentees,
                    profile_data.mentorship_approach, True
                ))
                await conn.commit()
                
                # Return the created mentor profile
                return await MentorshipService.get_mentor_profile(user_id)
    
    @staticmethod
    async def update_mentor_profile(user_id: str, profile_data: MentorProfileUpdate) -> Dict[str, Any]:
        """Update mentor profile"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build update query dynamically
                update_fields = []
                values = []
                
                if profile_data.is_available is not None:
                    update_fields.append("is_available = %s")
                    values.append(profile_data.is_available)
                
                if profile_data.expertise_areas is not None:
                    update_fields.append("expertise_areas = %s")
                    values.append(json.dumps(profile_data.expertise_areas))
                
                if profile_data.max_mentees is not None:
                    update_fields.append("max_mentees = %s")
                    values.append(profile_data.max_mentees)
                
                if profile_data.mentorship_approach is not None:
                    update_fields.append("mentorship_approach = %s")
                    values.append(profile_data.mentorship_approach)
                
                if not update_fields:
                    return await MentorshipService.get_mentor_profile(user_id)
                
                values.append(user_id)
                
                query = f"""
                UPDATE mentor_profiles 
                SET {', '.join(update_fields)}
                WHERE user_id = %s
                """
                
                await cursor.execute(query, values)
                await conn.commit()
                
                return await MentorshipService.get_mentor_profile(user_id)
    
    @staticmethod
    async def get_mentor_profile(user_id: str) -> Optional[Dict[str, Any]]:
        """Get mentor profile by user ID"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    "SELECT * FROM mentor_profiles WHERE user_id = %s",
                    (user_id,)
                )
                profile = await cursor.fetchone()
                
                if profile:
                    profile = MentorshipService._parse_json_fields(profile, ['expertise_areas'])
                
                return profile
    
    @staticmethod
    async def get_mentor_with_details(mentor_id: str) -> Optional[Dict[str, Any]]:
        """Get mentor profile with alumni profile details - Returns nested structure"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = """
                SELECT 
                    mp.id, mp.user_id, mp.is_available, mp.expertise_areas,
                    mp.max_mentees, mp.current_mentees_count, mp.rating,
                    mp.total_sessions, mp.total_reviews, mp.mentorship_approach,
                    mp.created_at, mp.updated_at,
                    ap.name, ap.photo_url, ap.current_company, ap.current_role,
                    ap.location, ap.batch_year, ap.bio, ap.headline,
                    ap.experience_timeline, ap.education_details, ap.skills,
                    ap.achievements, ap.social_links, ap.industry, ap.years_of_experience,
                    u.email
                FROM mentor_profiles mp
                JOIN alumni_profiles ap ON mp.user_id = ap.user_id
                JOIN users u ON mp.user_id = u.id
                WHERE mp.user_id = %s OR mp.id = %s
                """
                await cursor.execute(query, (mentor_id, mentor_id))
                row = await cursor.fetchone()
                
                if not row:
                    return None
                
                # Parse JSON fields
                row = MentorshipService._parse_json_fields(row, [
                    'expertise_areas', 'experience_timeline', 'education_details',
                    'skills', 'achievements', 'social_links'
                ])
                
                # Create nested structure
                mentor = {
                    'id': row['id'],
                    'user_id': row['user_id'],
                    'is_available': bool(row['is_available']),
                    'expertise_areas': row['expertise_areas'],
                    'max_mentees': int(row['max_mentees']) if row['max_mentees'] else 0,
                    'current_mentees_count': int(row['current_mentees_count']) if row['current_mentees_count'] else 0,
                    'rating': float(row['rating']) if row['rating'] is not None else 0.0,
                    'total_sessions': int(row['total_sessions']) if row['total_sessions'] else 0,
                    'total_reviews': int(row['total_reviews']) if row['total_reviews'] else 0,
                    'mentorship_approach': row['mentorship_approach'],
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at'],
                    'profile': {
                        'user_id': row['user_id'],
                        'name': row['name'],
                        'photo_url': row['photo_url'],
                        'bio': row['bio'],
                        'headline': row['headline'],
                        'current_company': row['current_company'],
                        'current_role': row['current_role'],
                        'location': row['location'],
                        'batch_year': row['batch_year'],
                        'experience_timeline': row['experience_timeline'],
                        'education_details': row['education_details'],
                        'skills': row['skills'],
                        'achievements': row['achievements'],
                        'social_links': row['social_links'],
                        'industry': row['industry'],
                        'years_of_experience': row['years_of_experience']
                    }
                }
                
                return mentor
    
    @staticmethod
    async def search_mentors(search_params: MentorSearchParams) -> Dict[str, Any]:
        """Search available mentors with filters - Returns nested structure"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build WHERE clauses
                where_clauses = []
                values = []
                
                if search_params.available_only:
                    where_clauses.append("mp.is_available = TRUE")
                    where_clauses.append("mp.current_mentees_count < mp.max_mentees")
                
                if search_params.min_rating:
                    where_clauses.append("mp.rating >= %s")
                    values.append(search_params.min_rating)
                
                if search_params.expertise:
                    where_clauses.append("JSON_CONTAINS(mp.expertise_areas, %s)")
                    values.append(json.dumps(search_params.expertise))
                
                where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
                
                # Count total results
                count_query = f"SELECT COUNT(*) as total FROM mentor_profiles mp {where_sql}"
                await cursor.execute(count_query, values)
                total_result = await cursor.fetchone()
                total = total_result['total'] if total_result else 0
                
                # Get paginated results with details
                offset = (search_params.page - 1) * search_params.limit
                query = f"""
                SELECT 
                    mp.id, mp.user_id, mp.is_available, mp.expertise_areas,
                    mp.max_mentees, mp.current_mentees_count, mp.rating,
                    mp.total_sessions, mp.total_reviews, mp.mentorship_approach,
                    mp.created_at, mp.updated_at,
                    ap.name, ap.photo_url, ap.current_company, ap.current_role,
                    ap.location, ap.batch_year, ap.bio, ap.headline,
                    ap.experience_timeline, ap.education_details, ap.skills,
                    u.email
                FROM mentor_profiles mp
                JOIN alumni_profiles ap ON mp.user_id = ap.user_id
                JOIN users u ON mp.user_id = u.id
                {where_sql}
                ORDER BY mp.rating DESC, mp.total_sessions DESC
                LIMIT %s OFFSET %s
                """
                values.extend([search_params.limit, offset])
                
                await cursor.execute(query, values)
                rows = await cursor.fetchall()
                
                # Parse JSON fields and create nested structure
                mentors = []
                for row in rows:
                    row = MentorshipService._parse_json_fields(row, [
                        'expertise_areas', 'experience_timeline', 'education_details', 'skills'
                    ])
                    
                    mentor = {
                        'id': row['id'],
                        'user_id': row['user_id'],
                        'is_available': bool(row['is_available']),
                        'expertise_areas': row['expertise_areas'],
                        'max_mentees': int(row['max_mentees']) if row['max_mentees'] else 0,
                        'current_mentees_count': int(row['current_mentees_count']) if row['current_mentees_count'] else 0,
                        'rating': float(row['rating']) if row['rating'] is not None else 0.0,
                        'total_sessions': int(row['total_sessions']) if row['total_sessions'] else 0,
                        'total_reviews': int(row['total_reviews']) if row['total_reviews'] else 0,
                        'mentorship_approach': row['mentorship_approach'],
                        'profile': {
                            'user_id': row['user_id'],
                            'name': row['name'],
                            'photo_url': row['photo_url'],
                            'bio': row['bio'],
                            'headline': row['headline'],
                            'current_company': row['current_company'],
                            'current_role': row['current_role'],
                            'location': row['location'],
                            'batch_year': row['batch_year'],
                            'experience_timeline': row['experience_timeline'],
                            'education_details': row['education_details'],
                            'skills': row['skills']
                        }
                    }
                    mentors.append(mentor)
                
                return {
                    "mentors": mentors,
                    "total": total,
                    "page": search_params.page,
                    "limit": search_params.limit,
                    "total_pages": (total + search_params.limit - 1) // search_params.limit
                }
    
    @staticmethod
    async def get_mentor_statistics(user_id: str) -> Dict[str, Any]:
        """Get detailed statistics for a mentor"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get mentor profile
                await cursor.execute(
                    """
                    SELECT mp.*, ap.name
                    FROM mentor_profiles mp
                    JOIN alumni_profiles ap ON mp.user_id = ap.user_id
                    WHERE mp.user_id = %s
                    """,
                    (user_id,)
                )
                mentor = await cursor.fetchone()
                
                if not mentor:
                    raise ValueError("Mentor profile not found")
                
                # Get request statistics
                await cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total_requests,
                        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_requests,
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests
                    FROM mentorship_requests
                    WHERE mentor_id = %s
                    """,
                    (user_id,)
                )
                request_stats = await cursor.fetchone()
                
                # Get session statistics
                await cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total_sessions,
                        SUM(CASE WHEN ms.status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
                        SUM(CASE WHEN ms.status = 'scheduled' AND ms.scheduled_date > NOW() THEN 1 ELSE 0 END) as upcoming_sessions
                    FROM mentorship_sessions ms
                    JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                    WHERE mr.mentor_id = %s
                    """,
                    (user_id,)
                )
                session_stats = await cursor.fetchone()
                
                return {
                    "mentor_id": mentor['id'],
                    "mentor_name": mentor['name'],
                    "total_requests": request_stats['total_requests'] or 0,
                    "accepted_requests": request_stats['accepted_requests'] or 0,
                    "rejected_requests": request_stats['rejected_requests'] or 0,
                    "pending_requests": request_stats['pending_requests'] or 0,
                    "total_sessions": session_stats['total_sessions'] or 0,
                    "completed_sessions": session_stats['completed_sessions'] or 0,
                    "upcoming_sessions": session_stats['upcoming_sessions'] or 0,
                    "average_rating": float(mentor['rating']),
                    "current_mentees": mentor['current_mentees_count'],
                    "max_mentees": mentor['max_mentees'],
                    "is_available": mentor['is_available']
                }
    
    # ========================================================================
    # MENTORSHIP REQUEST MANAGEMENT
    # ========================================================================
    
    @staticmethod
    async def create_mentorship_request(student_id: str, request_data: MentorshipRequestCreate) -> Dict[str, Any]:
        """Create mentorship request (Student only)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if mentor exists and is available
                await cursor.execute(
                    """
                    SELECT id, is_available, current_mentees_count, max_mentees
                    FROM mentor_profiles
                    WHERE user_id = %s
                    """,
                    (request_data.mentor_id,)
                )
                mentor = await cursor.fetchone()
                
                if not mentor:
                    raise ValueError("Mentor not found")
                
                if not mentor['is_available']:
                    raise ValueError("Mentor is currently not available for new mentees")
                
                if mentor['current_mentees_count'] >= mentor['max_mentees']:
                    raise ValueError("Mentor has reached maximum mentee capacity")
                
                # Check for existing active request
                await cursor.execute(
                    """
                    SELECT id FROM mentorship_requests
                    WHERE student_id = %s AND mentor_id = %s AND status IN ('pending', 'accepted')
                    """,
                    (student_id, request_data.mentor_id)
                )
                existing = await cursor.fetchone()
                
                if existing:
                    raise ValueError("You already have an active mentorship request with this mentor")
                
                # Generate UUID for the request
                request_id = str(uuid.uuid4())
                
                # Prepare JSON fields
                preferred_topics_json = json.dumps(request_data.preferred_topics) if request_data.preferred_topics else None
                
                # Insert mentorship request with explicit ID
                query = """
                INSERT INTO mentorship_requests (
                    id, student_id, mentor_id, request_message, goals, preferred_topics, status
                ) VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                """
                await cursor.execute(query, (
                    request_id, student_id, request_data.mentor_id, request_data.request_message,
                    request_data.goals, preferred_topics_json
                ))
                await conn.commit()
                
                # Send notification to mentor (via email service)
                # TODO: Integrate with email service
                
                return await MentorshipService.get_request_with_details(request_id)
    
    @staticmethod
    async def accept_mentorship_request(request_id: str, mentor_id: str) -> Dict[str, Any]:
        """Accept mentorship request (Mentor only)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get request details
                await cursor.execute(
                    """
                    SELECT id, mentor_id, status
                    FROM mentorship_requests
                    WHERE id = %s
                    """,
                    (request_id,)
                )
                request = await cursor.fetchone()
                
                if not request:
                    raise ValueError("Mentorship request not found")
                
                if request['mentor_id'] != mentor_id:
                    raise ValueError("You are not authorized to accept this request")
                
                if request['status'] != 'pending':
                    raise ValueError(f"Request is already {request['status']}")
                
                # Update request status
                await cursor.execute(
                    """
                    UPDATE mentorship_requests
                    SET status = 'accepted', accepted_at = NOW()
                    WHERE id = %s
                    """,
                    (request_id,)
                )
                await conn.commit()
                
                # Trigger will automatically update mentor's current_mentees_count
                
                return await MentorshipService.get_request_with_details(request_id)
    
    @staticmethod
    async def reject_mentorship_request(request_id: str, mentor_id: str, rejection_data: RejectMentorshipRequest) -> Dict[str, Any]:
        """Reject mentorship request (Mentor only)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get request details
                await cursor.execute(
                    """
                    SELECT id, mentor_id, status
                    FROM mentorship_requests
                    WHERE id = %s
                    """,
                    (request_id,)
                )
                request = await cursor.fetchone()
                
                if not request:
                    raise ValueError("Mentorship request not found")
                
                if request['mentor_id'] != mentor_id:
                    raise ValueError("You are not authorized to reject this request")
                
                if request['status'] != 'pending':
                    raise ValueError(f"Request is already {request['status']}")
                
                # Update request status
                await cursor.execute(
                    """
                    UPDATE mentorship_requests
                    SET status = 'rejected', rejection_reason = %s, rejected_at = NOW()
                    WHERE id = %s
                    """,
                    (rejection_data.rejection_reason, request_id)
                )
                await conn.commit()
                
                return await MentorshipService.get_request_with_details(request_id)
    
    @staticmethod
    async def get_received_requests(mentor_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get mentorship requests received by mentor - Returns enriched nested structure"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                where_clause = "WHERE mr.mentor_id = %s"
                values = [mentor_id]
                
                if status:
                    where_clause += " AND mr.status = %s"
                    values.append(status)
                
                # Use LEFT JOINs since students may not have alumni_profiles
                query = f"""
                SELECT 
                    mr.*,
                    COALESCE(ap_student.name, u_student.email) as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    ap_student.headline as student_headline,
                    ap_mentor.name as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo
                FROM mentorship_requests mr
                LEFT JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                LEFT JOIN users u_student ON mr.student_id = u_student.id
                LEFT JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                LEFT JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                {where_clause}
                ORDER BY mr.requested_at DESC
                """
                
                await cursor.execute(query, values)
                rows = await cursor.fetchall()
                
                results = []
                for row in rows:
                    row = MentorshipService._parse_json_fields(row, ['preferred_topics'])
                    
                    # Create nested structure
                    request = {
                        'id': row['id'],
                        'student_id': row['student_id'],
                        'mentor_id': row['mentor_id'],
                        'request_message': row['request_message'],
                        'goals': row['goals'],
                        'preferred_topics': row['preferred_topics'],
                        'status': row['status'],
                        'rejection_reason': row.get('rejection_reason'),
                        'requested_at': row['requested_at'],
                        'accepted_at': row.get('accepted_at'),
                        'rejected_at': row.get('rejected_at'),
                        'updated_at': row.get('updated_at'),
                        'student': {
                            'id': row['student_id'],
                            'email': row['student_email'],
                            'profile': {
                                'user_id': row['student_id'],
                                'name': row['student_name'],
                                'photo_url': row['student_photo'],
                                'headline': row.get('student_headline')
                            }
                        },
                        'studentProfile': {
                            'user_id': row['student_id'],
                            'name': row['student_name'],
                            'photo_url': row['student_photo'],
                            'headline': row.get('student_headline')
                        }
                    }
                    results.append(request)
                
                return results
    
    @staticmethod
    async def get_sent_requests(student_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get mentorship requests sent by student - Returns enriched nested structure"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                where_clause = "WHERE mr.student_id = %s"
                values = [student_id]
                
                if status:
                    where_clause += " AND mr.status = %s"
                    values.append(status)
                
                # Use LEFT JOINs and get mentor_profiles data
                query = f"""
                SELECT 
                    mr.*,
                    COALESCE(ap_student.name, u_student.email) as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    COALESCE(ap_mentor.name, u_mentor.email) as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo,
                    ap_mentor.headline as mentor_headline,
                    mp.expertise_areas
                FROM mentorship_requests mr
                LEFT JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                LEFT JOIN users u_student ON mr.student_id = u_student.id
                LEFT JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                LEFT JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                LEFT JOIN mentor_profiles mp ON mr.mentor_id = mp.user_id
                {where_clause}
                ORDER BY mr.requested_at DESC
                """
                
                await cursor.execute(query, values)
                rows = await cursor.fetchall()
                
                results = []
                for row in rows:
                    row = MentorshipService._parse_json_fields(row, ['preferred_topics', 'expertise_areas'])
                    
                    # Create nested structure
                    request = {
                        'id': row['id'],
                        'student_id': row['student_id'],
                        'mentor_id': row['mentor_id'],
                        'request_message': row['request_message'],
                        'goals': row['goals'],
                        'preferred_topics': row['preferred_topics'],
                        'status': row['status'],
                        'rejection_reason': row.get('rejection_reason'),
                        'requested_at': row['requested_at'],
                        'accepted_at': row.get('accepted_at'),
                        'rejected_at': row.get('rejected_at'),
                        'updated_at': row.get('updated_at'),
                        'mentor': {
                            'id': row['mentor_id'],
                            'email': row['mentor_email'],
                            'profile': {
                                'user_id': row['mentor_id'],
                                'name': row['mentor_name'],
                                'photo_url': row['mentor_photo'],
                                'headline': row.get('mentor_headline')
                            },
                            'expertise_areas': row.get('expertise_areas', [])
                        },
                        'mentorProfile': {
                            'user_id': row['mentor_id'],
                            'name': row['mentor_name'],
                            'photo_url': row['mentor_photo'],
                            'headline': row.get('mentor_headline')
                        }
                    }
                    results.append(request)
                
                return results
    
    @staticmethod
    async def get_active_mentorships(user_id: str) -> List[Dict[str, Any]]:
        """Get active mentorships for user (as mentor or student) - Returns enriched structure"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Use LEFT JOINs and include mentor_profiles data
                query = """
                SELECT 
                    mr.*,
                    COALESCE(ap_student.name, u_student.email) as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    ap_student.headline as student_headline,
                    COALESCE(ap_mentor.name, u_mentor.email) as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo,
                    ap_mentor.headline as mentor_headline,
                    mp.expertise_areas, mp.rating, mp.total_sessions
                FROM mentorship_requests mr
                LEFT JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                LEFT JOIN users u_student ON mr.student_id = u_student.id
                LEFT JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                LEFT JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                LEFT JOIN mentor_profiles mp ON mr.mentor_id = mp.user_id
                WHERE (mr.student_id = %s OR mr.mentor_id = %s) AND mr.status = 'accepted'
                ORDER BY mr.accepted_at DESC
                """
                
                await cursor.execute(query, (user_id, user_id))
                rows = await cursor.fetchall()
                
                results = []
                for row in rows:
                    row = MentorshipService._parse_json_fields(row, ['preferred_topics', 'expertise_areas'])
                    
                    # Create nested structure with full mentor and student objects
                    mentorship = {
                        'id': row['id'],
                        'student_id': row['student_id'],
                        'mentor_id': row['mentor_id'],
                        'request_message': row['request_message'],
                        'goals': row['goals'],
                        'preferred_topics': row['preferred_topics'],
                        'status': row['status'],
                        'requested_at': row['requested_at'],
                        'accepted_at': row.get('accepted_at'),
                        'updated_at': row.get('updated_at'),
                        'student': {
                            'id': row['student_id'],
                            'email': row['student_email'],
                            'profile': {
                                'user_id': row['student_id'],
                                'name': row['student_name'],
                                'photo_url': row['student_photo'],
                                'headline': row.get('student_headline')
                            }
                        },
                        'mentor': {
                            'id': row['mentor_id'],
                            'email': row['mentor_email'],
                            'profile': {
                                'user_id': row['mentor_id'],
                                'name': row['mentor_name'],
                                'photo_url': row['mentor_photo'],
                                'headline': row.get('mentor_headline')
                            },
                            'expertise_areas': row.get('expertise_areas', []),
                            'rating': float(row['rating']) if row.get('rating') is not None else 0.0,
                            'total_sessions': int(row['total_sessions']) if row.get('total_sessions') else 0
                        }
                    }
                    results.append(mentorship)
                
                return results
    
    @staticmethod
    async def get_request_with_details(request_id: str) -> Optional[Dict[str, Any]]:
        """Get mentorship request with full details - Returns enriched structure"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Use LEFT JOINs to support both alumni and student users
                query = """
                SELECT 
                    mr.*,
                    COALESCE(ap_student.name, u_student.email) as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    ap_student.headline as student_headline,
                    COALESCE(ap_mentor.name, u_mentor.email) as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo,
                    ap_mentor.headline as mentor_headline
                FROM mentorship_requests mr
                LEFT JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                LEFT JOIN users u_student ON mr.student_id = u_student.id
                LEFT JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                LEFT JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                WHERE mr.id = %s
                """
                
                await cursor.execute(query, (request_id,))
                row = await cursor.fetchone()
                
                if not row:
                    return None
                
                row = MentorshipService._parse_json_fields(row, ['preferred_topics'])
                
                # Create nested structure
                request = {
                    'id': row['id'],
                    'student_id': row['student_id'],
                    'mentor_id': row['mentor_id'],
                    'request_message': row['request_message'],
                    'goals': row['goals'],
                    'preferred_topics': row['preferred_topics'],
                    'status': row['status'],
                    'rejection_reason': row.get('rejection_reason'),
                    'requested_at': row['requested_at'],
                    'accepted_at': row.get('accepted_at'),
                    'rejected_at': row.get('rejected_at'),
                    'updated_at': row.get('updated_at'),
                    'student': {
                        'id': row['student_id'],
                        'email': row['student_email'],
                        'profile': {
                            'user_id': row['student_id'],
                            'name': row['student_name'],
                            'photo_url': row['student_photo'],
                            'headline': row.get('student_headline')
                        }
                    },
                    'mentor': {
                        'id': row['mentor_id'],
                        'email': row['mentor_email'],
                        'profile': {
                            'user_id': row['mentor_id'],
                            'name': row['mentor_name'],
                            'photo_url': row['mentor_photo'],
                            'headline': row.get('mentor_headline')
                        }
                    }
                }
                
                return request
    
    # ========================================================================
    # MENTORSHIP SESSION MANAGEMENT
    # ========================================================================
    
    @staticmethod
    async def schedule_session(mentorship_id: str, user_id: str, session_data: MentorshipSessionCreate) -> Dict[str, Any]:
        """Schedule mentorship session"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Verify mentorship is active and user is part of it
                await cursor.execute(
                    """
                    SELECT id, student_id, mentor_id, status
                    FROM mentorship_requests
                    WHERE id = %s
                    """,
                    (mentorship_id,)
                )
                mentorship = await cursor.fetchone()
                
                if not mentorship:
                    raise ValueError("Mentorship not found")
                
                if mentorship['status'] != 'accepted':
                    raise ValueError("Mentorship is not active")
                
                if user_id not in [mentorship['student_id'], mentorship['mentor_id']]:
                    raise ValueError("You are not part of this mentorship")
                
                # Generate UUID for the session
                session_id = str(uuid.uuid4())
                
                # Insert session with explicit ID
                query = """
                INSERT INTO mentorship_sessions (
                    id, mentorship_request_id, scheduled_date, duration, meeting_link, agenda, status
                ) VALUES (%s, %s, %s, %s, %s, %s, 'scheduled')
                """
                await cursor.execute(query, (
                    session_id, mentorship_id, session_data.scheduled_date, session_data.duration,
                    session_data.meeting_link, session_data.agenda
                ))
                await conn.commit()
                
                return await MentorshipService.get_session_with_details(session_id)
    
    @staticmethod
    async def update_session(session_id: str, user_id: str, session_data: MentorshipSessionUpdate) -> Dict[str, Any]:
        """Update mentorship session"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Verify user is part of the mentorship
                await cursor.execute(
                    """
                    SELECT ms.id, mr.student_id, mr.mentor_id
                    FROM mentorship_sessions ms
                    JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                    WHERE ms.id = %s
                    """,
                    (session_id,)
                )
                session = await cursor.fetchone()
                
                if not session:
                    raise ValueError("Session not found")
                
                if user_id not in [session['student_id'], session['mentor_id']]:
                    raise ValueError("You are not authorized to update this session")
                
                # Build update query
                update_fields = []
                values = []
                
                if session_data.scheduled_date is not None:
                    update_fields.append("scheduled_date = %s")
                    values.append(session_data.scheduled_date)
                
                if session_data.duration is not None:
                    update_fields.append("duration = %s")
                    values.append(session_data.duration)
                
                if session_data.status is not None:
                    update_fields.append("status = %s")
                    values.append(session_data.status.value)
                
                if session_data.meeting_link is not None:
                    update_fields.append("meeting_link = %s")
                    values.append(session_data.meeting_link)
                
                if session_data.agenda is not None:
                    update_fields.append("agenda = %s")
                    values.append(session_data.agenda)
                
                if session_data.notes is not None:
                    update_fields.append("notes = %s")
                    values.append(session_data.notes)
                
                if not update_fields:
                    return await MentorshipService.get_session_with_details(session_id)
                
                values.append(session_id)
                
                query = f"""
                UPDATE mentorship_sessions 
                SET {', '.join(update_fields)}
                WHERE id = %s
                """
                
                await cursor.execute(query, values)
                await conn.commit()
                
                return await MentorshipService.get_session_with_details(session_id)
    
    @staticmethod
    async def complete_session(session_id: str, user_id: str) -> Dict[str, Any]:
        """Mark session as completed"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Verify user is part of the mentorship
                await cursor.execute(
                    """
                    SELECT ms.id, mr.student_id, mr.mentor_id
                    FROM mentorship_sessions ms
                    JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                    WHERE ms.id = %s
                    """,
                    (session_id,)
                )
                session = await cursor.fetchone()
                
                if not session:
                    raise ValueError("Session not found")
                
                if user_id not in [session['student_id'], session['mentor_id']]:
                    raise ValueError("You are not authorized to update this session")
                
                # Update status
                await cursor.execute(
                    """
                    UPDATE mentorship_sessions
                    SET status = 'completed'
                    WHERE id = %s
                    """,
                    (session_id,)
                )
                await conn.commit()
                
                return await MentorshipService.get_session_with_details(session_id)
    
    @staticmethod
    async def submit_session_feedback(session_id: str, user_id: str, feedback_data: MentorshipSessionFeedback) -> Dict[str, Any]:
        """Submit feedback for completed session"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Verify session is completed and user is student
                await cursor.execute(
                    """
                    SELECT ms.id, ms.status, mr.student_id, mr.mentor_id
                    FROM mentorship_sessions ms
                    JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                    WHERE ms.id = %s
                    """,
                    (session_id,)
                )
                session = await cursor.fetchone()
                
                if not session:
                    raise ValueError("Session not found")
                
                if session['status'] != 'completed':
                    raise ValueError("Can only submit feedback for completed sessions")
                
                if user_id != session['student_id']:
                    raise ValueError("Only students can submit session feedback")
                
                # Update session with feedback
                await cursor.execute(
                    """
                    UPDATE mentorship_sessions
                    SET feedback = %s, rating = %s, notes = %s
                    WHERE id = %s
                    """,
                    (feedback_data.feedback, feedback_data.rating, feedback_data.notes, session_id)
                )
                await conn.commit()
                
                # Trigger will automatically update mentor rating
                
                return await MentorshipService.get_session_with_details(session_id)
    
    @staticmethod
    async def get_sessions(user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get sessions for user (as mentor or student) - Returns enriched structure"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                where_clause = "WHERE (mr.student_id = %s OR mr.mentor_id = %s)"
                values = [user_id, user_id]
                
                if status:
                    where_clause += " AND ms.status = %s"
                    values.append(status)
                
                query = f"""
                SELECT 
                    ms.*,
                    mr.student_id, mr.mentor_id,
                    COALESCE(ap_student.name, u_student.email) as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    COALESCE(ap_mentor.name, u_mentor.email) as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo
                FROM mentorship_sessions ms
                JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                LEFT JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                LEFT JOIN users u_student ON mr.student_id = u_student.id
                LEFT JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                LEFT JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                {where_clause}
                ORDER BY ms.scheduled_date DESC
                """
                
                await cursor.execute(query, values)
                rows = await cursor.fetchall()
                
                results = []
                for row in rows:
                    session = {
                        'id': row['id'],
                        'mentorship_request_id': row['mentorship_request_id'],
                        'scheduled_date': row['scheduled_date'],
                        'duration': row['duration'],
                        'status': row['status'],
                        'meeting_link': row.get('meeting_link'),
                        'agenda': row.get('agenda'),
                        'notes': row.get('notes'),
                        'feedback': row.get('feedback'),
                        'rating': row.get('rating'),
                        'created_at': row.get('created_at'),
                        'updated_at': row.get('updated_at'),
                        'student_id': row['student_id'],
                        'mentor_id': row['mentor_id'],
                        'student': {
                            'id': row['student_id'],
                            'email': row['student_email'],
                            'profile': {
                                'name': row['student_name'],
                                'photo_url': row['student_photo']
                            }
                        },
                        'mentor': {
                            'id': row['mentor_id'],
                            'email': row['mentor_email'],
                            'profile': {
                                'name': row['mentor_name'],
                                'photo_url': row['mentor_photo']
                            }
                        }
                    }
                    results.append(session)
                
                return results
    
    @staticmethod
    async def get_session_with_details(session_id: str) -> Optional[Dict[str, Any]]:
        """Get session with full details - Returns enriched structure"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = """
                SELECT 
                    ms.*,
                    mr.student_id, mr.mentor_id,
                    COALESCE(ap_student.name, u_student.email) as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    ap_student.headline as student_headline,
                    COALESCE(ap_mentor.name, u_mentor.email) as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo,
                    ap_mentor.headline as mentor_headline
                FROM mentorship_sessions ms
                JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                LEFT JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                LEFT JOIN users u_student ON mr.student_id = u_student.id
                LEFT JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                LEFT JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                WHERE ms.id = %s
                """
                
                await cursor.execute(query, (session_id,))
                row = await cursor.fetchone()
                
                if not row:
                    return None
                
                # Create nested structure
                session = {
                    'id': row['id'],
                    'mentorship_request_id': row['mentorship_request_id'],
                    'scheduled_date': row['scheduled_date'],
                    'duration': row['duration'],
                    'status': row['status'],
                    'meeting_link': row.get('meeting_link'),
                    'agenda': row.get('agenda'),
                    'notes': row.get('notes'),
                    'feedback': row.get('feedback'),
                    'rating': row.get('rating'),
                    'created_at': row.get('created_at'),
                    'updated_at': row.get('updated_at'),
                    'student_id': row['student_id'],
                    'mentor_id': row['mentor_id'],
                    'student': {
                        'id': row['student_id'],
                        'email': row['student_email'],
                        'profile': {
                            'user_id': row['student_id'],
                            'name': row['student_name'],
                            'photo_url': row['student_photo'],
                            'headline': row.get('student_headline')
                        }
                    },
                    'mentor': {
                        'id': row['mentor_id'],
                        'email': row['mentor_email'],
                        'profile': {
                            'user_id': row['mentor_id'],
                            'name': row['mentor_name'],
                            'photo_url': row['mentor_photo'],
                            'headline': row.get('mentor_headline')
                        }
                    }
                }
                
                return session
    
    # ========================================================================
    # HELPER METHODS
    # ========================================================================
    
    @staticmethod
    def _parse_json_fields(data: Dict[str, Any], json_fields: List[str]) -> Dict[str, Any]:
        """Parse JSON fields in data"""
        for field in json_fields:
            if data.get(field):
                try:
                    if isinstance(data[field], str):
                        data[field] = json.loads(data[field])
                except:
                    data[field] = None
        return data
    
    # ========================================================================
    # ADDITIONAL HELPER METHODS
    # ========================================================================
    
    @staticmethod
    async def get_unique_expertise_areas() -> List[str]:
        """Get all unique expertise areas from mentor profiles"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    "SELECT DISTINCT expertise_areas FROM mentor_profiles WHERE expertise_areas IS NOT NULL"
                )
                rows = await cursor.fetchall()
                
                # Parse and flatten all expertise areas
                all_areas = set()
                for row in rows:
                    if row['expertise_areas']:
                        try:
                            areas = json.loads(row['expertise_areas']) if isinstance(row['expertise_areas'], str) else row['expertise_areas']
                            if isinstance(areas, list):
                                all_areas.update(areas)
                        except:
                            pass
                
                return sorted(list(all_areas))
    
    @staticmethod
    async def get_sessions_by_request_id(request_id: str) -> List[Dict[str, Any]]:
        """Get all sessions for a specific mentorship request"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = """
                SELECT 
                    ms.*,
                    mr.student_id, mr.mentor_id,
                    COALESCE(ap_student.name, u_student.email) as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    COALESCE(ap_mentor.name, u_mentor.email) as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo
                FROM mentorship_sessions ms
                JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                LEFT JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                LEFT JOIN users u_student ON mr.student_id = u_student.id
                LEFT JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                LEFT JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                WHERE ms.mentorship_request_id = %s
                ORDER BY ms.scheduled_date DESC
                """
                
                await cursor.execute(query, (request_id,))
                rows = await cursor.fetchall()
                
                results = []
                for row in rows:
                    session = {
                        'id': row['id'],
                        'mentorship_request_id': row['mentorship_request_id'],
                        'scheduled_date': row['scheduled_date'],
                        'duration': row['duration'],
                        'status': row['status'],
                        'meeting_link': row.get('meeting_link'),
                        'agenda': row.get('agenda'),
                        'notes': row.get('notes'),
                        'feedback': row.get('feedback'),
                        'rating': row.get('rating'),
                        'created_at': row.get('created_at'),
                        'updated_at': row.get('updated_at'),
                        'student_id': row['student_id'],
                        'mentor_id': row['mentor_id'],
                        'student': {
                            'id': row['student_id'],
                            'email': row['student_email'],
                            'name': row['student_name'],
                            'photo_url': row['student_photo']
                        },
                        'mentor': {
                            'id': row['mentor_id'],
                            'email': row['mentor_email'],
                            'name': row['mentor_name'],
                            'photo_url': row['mentor_photo']
                        }
                    }
                    results.append(session)
                
                return results
    
    @staticmethod
    async def cancel_session(session_id: str, user_id: str) -> Dict[str, Any]:
        """Cancel a mentorship session"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Verify user is part of the mentorship and session can be cancelled
                await cursor.execute(
                    """
                    SELECT ms.id, ms.status, mr.student_id, mr.mentor_id
                    FROM mentorship_sessions ms
                    JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                    WHERE ms.id = %s
                    """,
                    (session_id,)
                )
                session = await cursor.fetchone()
                
                if not session:
                    raise ValueError("Session not found")
                
                if user_id not in [session['student_id'], session['mentor_id']]:
                    raise ValueError("You are not authorized to cancel this session")
                
                if session['status'] in ['completed', 'cancelled']:
                    raise ValueError(f"Cannot cancel a session that is already {session['status']}")
                
                # Update status to cancelled
                await cursor.execute(
                    """
                    UPDATE mentorship_sessions
                    SET status = 'cancelled'
                    WHERE id = %s
                    """,
                    (session_id,)
                )
                await conn.commit()
                
                return await MentorshipService.get_session_with_details(session_id)
