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
        """Get mentor profile with alumni profile details"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = """
                SELECT 
                    mp.id, mp.user_id, mp.is_available, mp.expertise_areas,
                    mp.max_mentees, mp.current_mentees_count, mp.rating,
                    mp.total_sessions, mp.total_reviews, mp.mentorship_approach,
                    ap.name, ap.photo_url, ap.current_company, ap.current_role,
                    ap.location, ap.batch_year,
                    u.email
                FROM mentor_profiles mp
                JOIN alumni_profiles ap ON mp.user_id = ap.user_id
                JOIN users u ON mp.user_id = u.id
                WHERE mp.user_id = %s OR mp.id = %s
                """
                await cursor.execute(query, (mentor_id, mentor_id))
                mentor = await cursor.fetchone()
                
                if mentor:
                    mentor = MentorshipService._parse_json_fields(mentor, ['expertise_areas'])
                
                return mentor
    
    @staticmethod
    async def search_mentors(search_params: MentorSearchParams) -> Dict[str, Any]:
        """Search available mentors with filters"""
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
                    ap.name, ap.photo_url, ap.current_company, ap.current_role,
                    ap.location, ap.batch_year,
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
                mentors = await cursor.fetchall()
                
                # Parse JSON fields
                parsed_mentors = [MentorshipService._parse_json_fields(m, ['expertise_areas']) for m in mentors]
                
                return {
                    "mentors": parsed_mentors,
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
        """Get mentorship requests received by mentor"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                where_clause = "WHERE mr.mentor_id = %s"
                values = [mentor_id]
                
                if status:
                    where_clause += " AND mr.status = %s"
                    values.append(status)
                
                query = f"""
                SELECT 
                    mr.*,
                    ap_student.name as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    ap_mentor.name as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo
                FROM mentorship_requests mr
                JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                JOIN users u_student ON mr.student_id = u_student.id
                JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                {where_clause}
                ORDER BY mr.requested_at DESC
                """
                
                await cursor.execute(query, values)
                requests = await cursor.fetchall()
                
                return [MentorshipService._parse_json_fields(r, ['preferred_topics']) for r in requests]
    
    @staticmethod
    async def get_sent_requests(student_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get mentorship requests sent by student"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                where_clause = "WHERE mr.student_id = %s"
                values = [student_id]
                
                if status:
                    where_clause += " AND mr.status = %s"
                    values.append(status)
                
                query = f"""
                SELECT 
                    mr.*,
                    ap_student.name as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    ap_mentor.name as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo
                FROM mentorship_requests mr
                JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                JOIN users u_student ON mr.student_id = u_student.id
                JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                {where_clause}
                ORDER BY mr.requested_at DESC
                """
                
                await cursor.execute(query, values)
                requests = await cursor.fetchall()
                
                return [MentorshipService._parse_json_fields(r, ['preferred_topics']) for r in requests]
    
    @staticmethod
    async def get_active_mentorships(user_id: str) -> List[Dict[str, Any]]:
        """Get active mentorships for user (as mentor or student)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = """
                SELECT 
                    mr.*,
                    ap_student.name as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    ap_mentor.name as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo
                FROM mentorship_requests mr
                JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                JOIN users u_student ON mr.student_id = u_student.id
                JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                WHERE (mr.student_id = %s OR mr.mentor_id = %s) AND mr.status = 'accepted'
                ORDER BY mr.accepted_at DESC
                """
                
                await cursor.execute(query, (user_id, user_id))
                mentorships = await cursor.fetchall()
                
                return [MentorshipService._parse_json_fields(m, ['preferred_topics']) for m in mentorships]
    
    @staticmethod
    async def get_request_with_details(request_id: str) -> Optional[Dict[str, Any]]:
        """Get mentorship request with full details"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = """
                SELECT 
                    mr.*,
                    ap_student.name as student_name,
                    u_student.email as student_email,
                    ap_student.photo_url as student_photo,
                    ap_mentor.name as mentor_name,
                    u_mentor.email as mentor_email,
                    ap_mentor.photo_url as mentor_photo
                FROM mentorship_requests mr
                JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                JOIN users u_student ON mr.student_id = u_student.id
                JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                WHERE mr.id = %s
                """
                
                await cursor.execute(query, (request_id,))
                request = await cursor.fetchone()
                
                if request:
                    request = MentorshipService._parse_json_fields(request, ['preferred_topics'])
                
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
        """Get sessions for user (as mentor or student)"""
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
                    ap_student.name as student_name,
                    u_student.email as student_email,
                    ap_mentor.name as mentor_name,
                    u_mentor.email as mentor_email
                FROM mentorship_sessions ms
                JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                JOIN users u_student ON mr.student_id = u_student.id
                JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                {where_clause}
                ORDER BY ms.scheduled_date DESC
                """
                
                await cursor.execute(query, values)
                sessions = await cursor.fetchall()
                
                return sessions
    
    @staticmethod
    async def get_session_with_details(session_id: str) -> Optional[Dict[str, Any]]:
        """Get session with full details"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = """
                SELECT 
                    ms.*,
                    mr.student_id, mr.mentor_id,
                    ap_student.name as student_name,
                    u_student.email as student_email,
                    ap_mentor.name as mentor_name,
                    u_mentor.email as mentor_email
                FROM mentorship_sessions ms
                JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                JOIN alumni_profiles ap_student ON mr.student_id = ap_student.user_id
                JOIN users u_student ON mr.student_id = u_student.id
                JOIN alumni_profiles ap_mentor ON mr.mentor_id = ap_mentor.user_id
                JOIN users u_mentor ON mr.mentor_id = u_mentor.id
                WHERE ms.id = %s
                """
                
                await cursor.execute(query, (session_id,))
                session = await cursor.fetchone()
                
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
