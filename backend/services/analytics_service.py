"""Analytics service for admin dashboard and reporting"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import aiomysql
import json

from database.connection import get_db_pool

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for analytics and reporting"""
    
    @staticmethod
    async def get_dashboard_metrics() -> Dict[str, Any]:
        """Get key metrics for admin dashboard"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                metrics = {}
                
                # Total users and by role
                await cursor.execute("""
                    SELECT 
                        COUNT(*) as total_users,
                        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
                        SUM(CASE WHEN role = 'alumni' THEN 1 ELSE 0 END) as alumni,
                        SUM(CASE WHEN role = 'recruiter' THEN 1 ELSE 0 END) as recruiters,
                        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
                    FROM users
                    WHERE is_active = TRUE
                """)
                user_stats = await cursor.fetchone()
                metrics['total_users'] = user_stats['total_users']
                metrics['users_by_role'] = {
                    'student': user_stats['students'],
                    'alumni': user_stats['alumni'],
                    'recruiter': user_stats['recruiters'],
                    'admin': user_stats['admins']
                }
                
                # Verified alumni and pending verifications
                await cursor.execute("""
                    SELECT 
                        SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified_alumni,
                        SUM(CASE WHEN is_verified = FALSE THEN 1 ELSE 0 END) as pending_verifications
                    FROM alumni_profiles
                """)
                alumni_stats = await cursor.fetchone()
                metrics['verified_alumni'] = alumni_stats['verified_alumni'] or 0
                metrics['pending_verifications'] = alumni_stats['pending_verifications'] or 0
                
                # Job statistics
                await cursor.execute("""
                    SELECT 
                        COUNT(*) as total_jobs,
                        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs,
                        SUM(applications_count) as total_applications
                    FROM jobs
                """)
                job_stats = await cursor.fetchone()
                metrics['total_jobs_posted'] = job_stats['total_jobs']
                metrics['active_jobs'] = job_stats['active_jobs'] or 0
                metrics['total_applications'] = job_stats['total_applications'] or 0
                
                # Event statistics
                await cursor.execute("""
                    SELECT 
                        COUNT(*) as total_events,
                        SUM(CASE WHEN start_date > NOW() AND status = 'published' THEN 1 ELSE 0 END) as upcoming_events,
                        SUM(current_attendees_count) as total_rsvps
                    FROM events
                """)
                event_stats = await cursor.fetchone()
                metrics['total_events'] = event_stats['total_events']
                metrics['upcoming_events'] = event_stats['upcoming_events'] or 0
                metrics['total_rsvps'] = event_stats['total_rsvps'] or 0
                
                # Mentorship statistics
                await cursor.execute("""
                    SELECT 
                        COUNT(*) as total_requests,
                        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as active_mentorships
                    FROM mentorship_requests
                """)
                mentorship_stats = await cursor.fetchone()
                metrics['total_mentorship_requests'] = mentorship_stats['total_requests']
                metrics['active_mentorships'] = mentorship_stats['active_mentorships'] or 0
                
                # Forum statistics
                await cursor.execute("""
                    SELECT 
                        (SELECT COUNT(*) FROM forum_posts WHERE is_deleted = FALSE) as posts_count,
                        (SELECT COUNT(*) FROM forum_comments WHERE is_deleted = FALSE) as comments_count
                """)
                forum_stats = await cursor.fetchone()
                metrics['forum_posts_count'] = forum_stats['posts_count']
                metrics['forum_comments_count'] = forum_stats['comments_count']
                
                return metrics
    
    @staticmethod
    async def get_dashboard_charts(days: int = 30) -> Dict[str, Any]:
        """Get chart data for admin dashboard"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                charts = {}
                
                # User growth over time
                await cursor.execute("""
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(*) as new_users
                    FROM users
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                    GROUP BY DATE(created_at)
                    ORDER BY date
                """, (days,))
                user_growth_data = await cursor.fetchall()
                
                # Calculate cumulative total
                total = 0
                user_growth = []
                for row in user_growth_data:
                    total += row['new_users']
                    user_growth.append({
                        'date': row['date'].isoformat(),
                        'total_users': total,
                        'new_users': row['new_users']
                    })
                charts['user_growth'] = user_growth
                
                # Job postings trend
                await cursor.execute("""
                    SELECT 
                        DATE(j.created_at) as date,
                        COUNT(DISTINCT j.id) as jobs_posted,
                        COUNT(ja.id) as applications
                    FROM jobs j
                    LEFT JOIN job_applications ja ON j.id = ja.job_id AND DATE(ja.applied_at) = DATE(j.created_at)
                    WHERE j.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                    GROUP BY DATE(j.created_at)
                    ORDER BY date
                """, (days,))
                job_trends_data = await cursor.fetchall()
                charts['job_trends'] = [
                    {
                        'date': row['date'].isoformat(),
                        'jobs_posted': row['jobs_posted'],
                        'applications': row['applications'] or 0
                    }
                    for row in job_trends_data
                ]
                
                # Event participation trend
                await cursor.execute("""
                    SELECT 
                        DATE(e.created_at) as date,
                        COUNT(DISTINCT e.id) as events,
                        SUM(e.current_attendees_count) as attendees
                    FROM events e
                    WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                    GROUP BY DATE(e.created_at)
                    ORDER BY date
                """, (days,))
                event_data = await cursor.fetchall()
                charts['event_participation'] = [
                    {
                        'date': row['date'].isoformat(),
                        'events': row['events'],
                        'attendees': row['attendees'] or 0
                    }
                    for row in event_data
                ]
                
                # Mentorship activity
                await cursor.execute("""
                    SELECT 
                        DATE(mr.requested_at) as date,
                        COUNT(DISTINCT mr.id) as requests,
                        COUNT(DISTINCT ms.id) as sessions
                    FROM mentorship_requests mr
                    LEFT JOIN mentorship_sessions ms ON mr.id = ms.mentorship_request_id 
                        AND DATE(ms.created_at) = DATE(mr.requested_at)
                    WHERE mr.requested_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                    GROUP BY DATE(mr.requested_at)
                    ORDER BY date
                """, (days,))
                mentorship_data = await cursor.fetchall()
                charts['mentorship_activity'] = [
                    {
                        'date': row['date'].isoformat(),
                        'requests': row['requests'],
                        'sessions': row['sessions'] or 0
                    }
                    for row in mentorship_data
                ]
                
                return charts
    
    @staticmethod
    async def get_skills_distribution(limit: int = 20) -> List[Dict[str, Any]]:
        """Get top skills distribution"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get all skills from alumni profiles
                await cursor.execute("""
                    SELECT skills 
                    FROM alumni_profiles 
                    WHERE skills IS NOT NULL AND JSON_LENGTH(skills) > 0
                """)
                profiles = await cursor.fetchall()
                
                # Count skill occurrences
                skill_counts = {}
                total_skills = 0
                
                for profile in profiles:
                    if profile['skills']:
                        skills_list = json.loads(profile['skills']) if isinstance(profile['skills'], str) else profile['skills']
                        for skill in skills_list:
                            skill_counts[skill] = skill_counts.get(skill, 0) + 1
                            total_skills += 1
                
                # Sort and get top skills
                sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
                
                return [
                    {
                        'skill': skill,
                        'count': count,
                        'percentage': round((count / total_skills * 100), 2) if total_skills > 0 else 0
                    }
                    for skill, count in sorted_skills
                ]
    
    @staticmethod
    async def get_locations_distribution() -> List[Dict[str, Any]]:
        """Get alumni distribution by location with coordinates"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get location data from geographic_data table
                await cursor.execute("""
                    SELECT 
                        location_name,
                        country,
                        city,
                        latitude,
                        longitude,
                        alumni_count,
                        jobs_count
                    FROM geographic_data
                    WHERE alumni_count > 0
                    ORDER BY alumni_count DESC
                    LIMIT 50
                """)
                locations = await cursor.fetchall()
                
                return [
                    {
                        'location': loc['location_name'],
                        'country': loc['country'],
                        'city': loc['city'],
                        'latitude': float(loc['latitude']) if loc['latitude'] else None,
                        'longitude': float(loc['longitude']) if loc['longitude'] else None,
                        'alumni_count': loc['alumni_count'],
                        'jobs_count': loc['jobs_count']
                    }
                    for loc in locations
                ]
    
    @staticmethod
    async def get_companies_distribution(limit: int = 20) -> List[Dict[str, Any]]:
        """Get top companies where alumni work"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute("""
                    SELECT 
                        current_company,
                        COUNT(*) as alumni_count
                    FROM alumni_profiles
                    WHERE current_company IS NOT NULL AND current_company != ''
                    GROUP BY current_company
                    ORDER BY alumni_count DESC
                    LIMIT %s
                """, (limit,))
                companies = await cursor.fetchall()
                
                # Calculate total
                total = sum(c['alumni_count'] for c in companies)
                
                return [
                    {
                        'company': comp['current_company'],
                        'alumni_count': comp['alumni_count'],
                        'percentage': round((comp['alumni_count'] / total * 100), 2) if total > 0 else 0
                    }
                    for comp in companies
                ]
    
    @staticmethod
    async def get_batches_distribution() -> List[Dict[str, Any]]:
        """Get alumni distribution by batch year"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute("""
                    SELECT 
                        batch_year,
                        COUNT(*) as count
                    FROM alumni_profiles
                    WHERE batch_year IS NOT NULL
                    GROUP BY batch_year
                    ORDER BY batch_year DESC
                """)
                batches = await cursor.fetchall()
                
                return [
                    {
                        'batch_year': batch['batch_year'],
                        'count': batch['count']
                    }
                    for batch in batches
                ]
    
    @staticmethod
    async def get_job_trends() -> List[Dict[str, Any]]:
        """Get job posting trends by category"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute("""
                    SELECT 
                        job_type,
                        COUNT(*) as count
                    FROM jobs
                    GROUP BY job_type
                    ORDER BY count DESC
                """)
                job_types = await cursor.fetchall()
                
                total = sum(jt['count'] for jt in job_types)
                
                return [
                    {
                        'job_type': jt['job_type'],
                        'count': jt['count'],
                        'percentage': round((jt['count'] / total * 100), 2) if total > 0 else 0
                    }
                    for jt in job_types
                ]
    
    @staticmethod
    async def get_mentorship_stats() -> Dict[str, Any]:
        """Get mentorship program statistics"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Mentor statistics
                await cursor.execute("""
                    SELECT 
                        COUNT(*) as total_mentors,
                        SUM(CASE WHEN is_available = TRUE THEN 1 ELSE 0 END) as active_mentors,
                        SUM(current_mentees_count) as total_mentees,
                        AVG(rating) as average_rating
                    FROM mentor_profiles
                """)
                mentor_stats = await cursor.fetchone()
                
                # Request statistics
                await cursor.execute("""
                    SELECT 
                        COUNT(*) as total_requests,
                        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_requests,
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests
                    FROM mentorship_requests
                """)
                request_stats = await cursor.fetchone()
                
                # Session statistics
                await cursor.execute("""
                    SELECT 
                        COUNT(*) as total_sessions,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions
                    FROM mentorship_sessions
                """)
                session_stats = await cursor.fetchone()
                
                return {
                    'total_mentors': mentor_stats['total_mentors'],
                    'active_mentors': mentor_stats['active_mentors'] or 0,
                    'total_mentees': mentor_stats['total_mentees'] or 0,
                    'total_requests': request_stats['total_requests'],
                    'accepted_requests': request_stats['accepted_requests'] or 0,
                    'rejected_requests': request_stats['rejected_requests'] or 0,
                    'pending_requests': request_stats['pending_requests'] or 0,
                    'total_sessions': session_stats['total_sessions'],
                    'completed_sessions': session_stats['completed_sessions'] or 0,
                    'average_rating': float(mentor_stats['average_rating']) if mentor_stats['average_rating'] else 0.0
                }
    
    @staticmethod
    async def get_event_participation_stats() -> Dict[str, Any]:
        """Get event participation statistics"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Event statistics
                await cursor.execute("""
                    SELECT 
                        COUNT(*) as total_events,
                        SUM(CASE WHEN start_date > NOW() THEN 1 ELSE 0 END) as upcoming_events,
                        SUM(CASE WHEN end_date < NOW() THEN 1 ELSE 0 END) as past_events,
                        SUM(current_attendees_count) as total_rsvps
                    FROM events
                    WHERE status != 'cancelled'
                """)
                event_stats = await cursor.fetchone()
                
                # Events by type
                await cursor.execute("""
                    SELECT 
                        event_type,
                        COUNT(*) as count
                    FROM events
                    GROUP BY event_type
                """)
                events_by_type = await cursor.fetchall()
                
                # Calculate average attendance rate
                await cursor.execute("""
                    SELECT 
                        AVG(CASE 
                            WHEN max_attendees > 0 
                            THEN (current_attendees_count / max_attendees * 100)
                            ELSE 0 
                        END) as avg_attendance_rate
                    FROM events
                    WHERE max_attendees > 0 AND status != 'cancelled'
                """)
                attendance = await cursor.fetchone()
                
                return {
                    'total_events': event_stats['total_events'],
                    'upcoming_events': event_stats['upcoming_events'] or 0,
                    'past_events': event_stats['past_events'] or 0,
                    'total_rsvps': event_stats['total_rsvps'] or 0,
                    'average_attendance_rate': float(attendance['avg_attendance_rate']) if attendance['avg_attendance_rate'] else 0.0,
                    'events_by_type': {evt['event_type']: evt['count'] for evt in events_by_type}
                }
    
    @staticmethod
    async def get_engagement_metrics() -> Dict[str, Any]:
        """Get user engagement metrics"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Active users with engagement scores
                await cursor.execute("""
                    SELECT COUNT(*) as total_active_users
                    FROM engagement_scores
                    WHERE total_score > 0
                """)
                active_users = await cursor.fetchone()
                
                # Average engagement score
                await cursor.execute("""
                    SELECT AVG(total_score) as avg_score
                    FROM engagement_scores
                    WHERE total_score > 0
                """)
                avg_score = await cursor.fetchone()
                
                # Top contributors
                await cursor.execute("""
                    SELECT 
                        es.user_id,
                        ap.name,
                        es.total_score,
                        es.level,
                        es.rank_position
                    FROM engagement_scores es
                    JOIN alumni_profiles ap ON es.user_id = ap.user_id
                    ORDER BY es.total_score DESC
                    LIMIT 10
                """)
                top_contributors = await cursor.fetchall()
                
                # Engagement by level
                await cursor.execute("""
                    SELECT 
                        level,
                        COUNT(*) as count
                    FROM engagement_scores
                    GROUP BY level
                """)
                engagement_by_level = await cursor.fetchall()
                
                return {
                    'total_active_users': active_users['total_active_users'],
                    'average_engagement_score': float(avg_score['avg_score']) if avg_score['avg_score'] else 0.0,
                    'top_contributors': [
                        {
                            'user_id': contrib['user_id'],
                            'name': contrib['name'],
                            'score': contrib['total_score'],
                            'level': contrib['level'],
                            'rank': contrib['rank_position']
                        }
                        for contrib in top_contributors
                    ],
                    'engagement_by_level': {lvl['level']: lvl['count'] for lvl in engagement_by_level}
                }
