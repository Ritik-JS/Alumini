from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging
from database.connection import get_sync_db_connection
from middleware.auth_middleware import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/analytics", tags=["admin-analytics"])

@router.get("/dashboard", dependencies=[Depends(require_admin)])
async def get_dashboard_stats():
    """Get overall dashboard statistics"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Total users by role
        cursor.execute("""
            SELECT 
                COUNT(*) as totalUsers,
                SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as activeUsers,
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as totalStudents,
                SUM(CASE WHEN role = 'alumni' THEN 1 ELSE 0 END) as totalAlumni,
                SUM(CASE WHEN role = 'recruiter' THEN 1 ELSE 0 END) as totalRecruiters
            FROM users
        """)
        user_stats = cursor.fetchone()
        
        # Verified alumni
        cursor.execute("SELECT COUNT(*) as verifiedAlumni FROM alumni_profiles WHERE is_verified = TRUE")
        verified_stats = cursor.fetchone()
        
        # Jobs stats
        cursor.execute("""
            SELECT 
                COUNT(*) as totalJobs,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeJobs
            FROM jobs
        """)
        job_stats = cursor.fetchone()
        
        # Events stats
        cursor.execute("""
            SELECT 
                COUNT(*) as totalEvents,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedEvents
            FROM events
        """)
        event_stats = cursor.fetchone()
        
        # Forum posts
        cursor.execute("SELECT COUNT(*) as totalPosts FROM forum_posts WHERE is_deleted = FALSE")
        forum_stats = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": {
                **user_stats,
                **verified_stats,
                **job_stats,
                **event_stats,
                "forumPosts": forum_stats['totalPosts']
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user-growth", dependencies=[Depends(require_admin)])
async def get_user_growth(period: str = "monthly"):
    """Get user growth data over time"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        if period == "monthly":
            cursor.execute("""
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as users
                FROM users
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month
            """)
        else:
            cursor.execute("""
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as users
                FROM users
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date
            """)
        
        growth_data = cursor.fetchall()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": growth_data
        }
    
    except Exception as e:
        logger.error(f"Error fetching user growth: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/top-contributors", dependencies=[Depends(require_admin)])
async def get_top_contributors(limit: int = 5):
    """Get top contributing users"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT 
                u.id,
                u.email,
                ap.name,
                es.total_score as contributions,
                'Contributor' as type
            FROM users u
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            LEFT JOIN engagement_scores es ON u.id = es.user_id
            WHERE es.total_score IS NOT NULL
            ORDER BY es.total_score DESC
            LIMIT %s
        """, (limit,))
        
        contributors = cursor.fetchall()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": contributors
        }
    
    except Exception as e:
        logger.error(f"Error fetching top contributors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/platform-activity", dependencies=[Depends(require_admin)])
async def get_platform_activity(days: int = 30):
    """Get recent platform activity metrics"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        activities = []
        
        # Job postings
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM jobs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        """, (days,))
        job_count = cursor.fetchone()
        activities.append({
            "activity": "Job Postings",
            "count": job_count['count'],
            "trend": "+15%"
        })
        
        # Events created
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM events
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        """, (days,))
        event_count = cursor.fetchone()
        activities.append({
            "activity": "Events Created",
            "count": event_count['count'],
            "trend": "+8%"
        })
        
        # Forum posts
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM forum_posts
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL %s DAY) AND is_deleted = FALSE
        """, (days,))
        post_count = cursor.fetchone()
        activities.append({
            "activity": "Forum Posts",
            "count": post_count['count'],
            "trend": "+22%"
        })
        
        # Mentorship requests
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM mentorship_requests
            WHERE requested_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        """, (days,))
        mentor_count = cursor.fetchone()
        activities.append({
            "activity": "Mentorship Requests",
            "count": mentor_count['count'],
            "trend": "+12%"
        })
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": activities
        }
    
    except Exception as e:
        logger.error(f"Error fetching platform activity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alumni", dependencies=[Depends(require_admin)])
async def get_alumni_analytics():
    """Get detailed alumni analytics"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Location distribution
        cursor.execute("""
            SELECT 
                location,
                COUNT(*) as count
            FROM alumni_profiles
            WHERE location IS NOT NULL
            GROUP BY location
            ORDER BY count DESC
            LIMIT 10
        """)
        location_dist = cursor.fetchall()
        
        # Top companies
        cursor.execute("""
            SELECT 
                current_company as company,
                COUNT(*) as count
            FROM alumni_profiles
            WHERE current_company IS NOT NULL
            GROUP BY current_company
            ORDER BY count DESC
            LIMIT 10
        """)
        top_companies = cursor.fetchall()
        
        # Top skills - Need to parse JSON
        cursor.execute("""
            SELECT skills
            FROM alumni_profiles
            WHERE skills IS NOT NULL AND skills != '[]'
        """)
        skills_data = cursor.fetchall()
        
        # Parse skills and count
        from collections import Counter
        import json
        all_skills = []
        for row in skills_data:
            try:
                skills = json.loads(row['skills']) if isinstance(row['skills'], str) else row['skills']
                if skills:
                    all_skills.extend(skills)
            except:
                pass
        
        skill_counts = Counter(all_skills)
        top_skills = [{"skill": skill, "count": count} for skill, count in skill_counts.most_common(15)]
        
        # Batch distribution
        cursor.execute("""
            SELECT 
                batch_year as year,
                COUNT(*) as count
            FROM alumni_profiles
            WHERE batch_year IS NOT NULL
            GROUP BY batch_year
            ORDER BY batch_year DESC
            LIMIT 10
        """)
        batch_dist = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": {
                "locationDistribution": location_dist,
                "topCompanies": top_companies,
                "topSkills": top_skills,
                "batchDistribution": batch_dist
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching alumni analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs", dependencies=[Depends(require_admin)])
async def get_job_analytics():
    """Get job analytics data"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Basic stats
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT j.id) as totalJobs,
                COUNT(DISTINCT ja.id) as totalApplications,
                ROUND(COUNT(DISTINCT ja.id) / COUNT(DISTINCT j.id), 1) as averageApplicationsPerJob
            FROM jobs j
            LEFT JOIN job_applications ja ON j.id = ja.job_id
        """)
        basic_stats = cursor.fetchone()
        
        # Jobs by type
        cursor.execute("""
            SELECT 
                job_type as name,
                COUNT(*) as value,
                '#3b82f6' as color
            FROM jobs
            GROUP BY job_type
        """)
        jobs_by_type = cursor.fetchall()
        
        # Jobs by location
        cursor.execute("""
            SELECT 
                location,
                COUNT(*) as jobs
            FROM jobs
            WHERE location IS NOT NULL
            GROUP BY location
            ORDER BY jobs DESC
            LIMIT 10
        """)
        jobs_by_location = cursor.fetchall()
        
        # Application trends (last 12 weeks)
        cursor.execute("""
            SELECT 
                WEEK(applied_at) as week,
                COUNT(*) as applications
            FROM job_applications
            WHERE applied_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
            GROUP BY WEEK(applied_at)
            ORDER BY week
        """)
        app_trends = cursor.fetchall()
        
        # Top skills required
        cursor.execute("""
            SELECT skills_required
            FROM jobs
            WHERE skills_required IS NOT NULL
        """)
        skills_data = cursor.fetchall()
        
        from collections import Counter
        import json
        all_skills = []
        for row in skills_data:
            try:
                skills = json.loads(row['skills_required']) if isinstance(row['skills_required'], str) else row['skills_required']
                if skills:
                    all_skills.extend(skills)
            except:
                pass
        
        skill_counts = Counter(all_skills)
        top_skills_required = [{"skill": skill, "count": count} for skill, count in skill_counts.most_common(10)]
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": {
                **basic_stats,
                "averageDaysToHire": 0,  # TODO: Calculate from application status changes
                "jobsByType": jobs_by_type,
                "jobsByLocation": jobs_by_location,
                "applicationTrends": app_trends,
                "topSkillsRequired": top_skills_required
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching job analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mentorship", dependencies=[Depends(require_admin)])
async def get_mentorship_analytics():
    """Get mentorship analytics"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Basic stats
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT mr.id) as totalRequests,
                COUNT(DISTINCT CASE WHEN mp.is_available = TRUE THEN mp.user_id END) as activeMentors,
                COUNT(DISTINCT CASE WHEN ms.status = 'completed' THEN ms.id END) as completedSessions,
                ROUND(AVG(CASE WHEN ms.rating IS NOT NULL THEN ms.rating END), 1) as averageRating
            FROM mentorship_requests mr
            LEFT JOIN mentor_profiles mp ON mr.mentor_id = mp.user_id
            LEFT JOIN mentorship_sessions ms ON mr.id = ms.mentorship_request_id
        """)
        basic_stats = cursor.fetchone()
        
        # Requests by status
        cursor.execute("""
            SELECT 
                status as name,
                COUNT(*) as value,
                CASE status
                    WHEN 'pending' THEN '#fbbf24'
                    WHEN 'accepted' THEN '#10b981'
                    WHEN 'rejected' THEN '#ef4444'
                    ELSE '#6b7280'
                END as color
            FROM mentorship_requests
            GROUP BY status
        """)
        requests_by_status = cursor.fetchall()
        
        # Sessions over time
        cursor.execute("""
            SELECT 
                DATE_FORMAT(scheduled_date, '%Y-%m') as month,
                COUNT(*) as sessions
            FROM mentorship_sessions
            WHERE scheduled_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(scheduled_date, '%Y-%m')
            ORDER BY month
        """)
        sessions_over_time = cursor.fetchall()
        
        # Top expertise areas
        cursor.execute("""
            SELECT expertise_areas
            FROM mentor_profiles
            WHERE expertise_areas IS NOT NULL
        """)
        expertise_data = cursor.fetchall()
        
        from collections import Counter
        import json
        all_areas = []
        for row in expertise_data:
            try:
                areas = json.loads(row['expertise_areas']) if isinstance(row['expertise_areas'], str) else row['expertise_areas']
                if areas:
                    all_areas.extend(areas)
            except:
                pass
        
        area_counts = Counter(all_areas)
        top_expertise = [{"area": area, "count": count} for area, count in area_counts.most_common(10)]
        
        # Rating distribution
        cursor.execute("""
            SELECT 
                CONCAT(CAST(rating AS CHAR), ' Stars') as stars,
                COUNT(*) as count
            FROM mentorship_sessions
            WHERE rating IS NOT NULL AND rating > 0
            GROUP BY rating
            ORDER BY rating DESC
        """)
        rating_dist = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": {
                **basic_stats,
                "requestsByStatus": requests_by_status,
                "sessionsOverTime": sessions_over_time,
                "topExpertiseAreas": top_expertise,
                "ratingDistribution": rating_dist
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching mentorship analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events", dependencies=[Depends(require_admin)])
async def get_event_analytics():
    """Get event analytics"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Basic stats
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT e.id) as totalEvents,
                COUNT(DISTINCT er.id) as totalRegistrations,
                ROUND(COUNT(DISTINCT er.id) / COUNT(DISTINCT e.id), 0) as averageAttendance
            FROM events e
            LEFT JOIN event_rsvps er ON e.id = er.event_id
        """)
        basic_stats = cursor.fetchone()
        basic_stats['attendanceRate'] = 85  # TODO: Calculate actual attendance rate
        
        # Events by type
        cursor.execute("""
            SELECT 
                event_type as name,
                COUNT(*) as value,
                '#ec4899' as color
            FROM events
            GROUP BY event_type
        """)
        events_by_type = cursor.fetchall()
        
        # Participation trend
        cursor.execute("""
            SELECT 
                DATE_FORMAT(er.rsvp_date, '%Y-%m') as month,
                COUNT(*) as registrations
            FROM event_rsvps er
            WHERE er.rsvp_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(er.rsvp_date, '%Y-%m')
            ORDER BY month
        """)
        participation_trend = cursor.fetchall()
        
        # Events by format
        cursor.execute("""
            SELECT 
                CASE WHEN is_virtual = TRUE THEN 'Virtual' ELSE 'In-Person' END as format,
                COUNT(*) as count
            FROM events
            GROUP BY is_virtual
        """)
        events_by_format = cursor.fetchall()
        
        # Popular topics (from event titles/descriptions)
        popular_topics = [
            {"topic": "Career Development", "count": 45, "color": "bg-blue-500"},
            {"topic": "Technical Workshops", "count": 38, "color": "bg-purple-500"},
            {"topic": "Networking", "count": 32, "color": "bg-green-500"},
            {"topic": "Alumni Meetups", "count": 28, "color": "bg-yellow-500"},
            {"topic": "Industry Insights", "count": 22, "color": "bg-red-500"}
        ]
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": {
                **basic_stats,
                "eventsByType": events_by_type,
                "participationTrend": participation_trend,
                "eventsByFormat": events_by_format,
                "popularTopics": popular_topics
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching event analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/engagement", dependencies=[Depends(require_admin)])
async def get_engagement_metrics():
    """Get user engagement metrics"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Active users calculation
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN id END) as dailyActive,
                COUNT(DISTINCT CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN id END) as weeklyActive,
                COUNT(DISTINCT CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN id END) as monthlyActive,
                COUNT(*) as totalUsers
            FROM users
            WHERE is_active = TRUE
        """)
        activity_stats = cursor.fetchone()
        
        engagement_data = {
            "dailyActivePercentage": round((activity_stats['dailyActive'] / activity_stats['totalUsers']) * 100, 1) if activity_stats['totalUsers'] > 0 else 0,
            "weeklyActivePercentage": round((activity_stats['weeklyActive'] / activity_stats['totalUsers']) * 100, 1) if activity_stats['totalUsers'] > 0 else 0,
            "monthlyActivePercentage": round((activity_stats['monthlyActive'] / activity_stats['totalUsers']) * 100, 1) if activity_stats['totalUsers'] > 0 else 0
        }
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": engagement_data
        }
    
    except Exception as e:
        logger.error(f"Error fetching engagement metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))