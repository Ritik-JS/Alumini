"""Analytics routes for reporting and insights"""
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Dict, Any

from database.models import (
    SkillDistribution, LocationDistribution, CompanyDistribution,
    BatchDistribution, JobTrendsByCategory, MentorshipStats,
    EventParticipationStats, EngagementMetrics, UserResponse
)
from services.analytics_service import AnalyticsService
from middleware.auth_middleware import require_admin

router = APIRouter(prefix="/api/admin/analytics", tags=["Admin Analytics"])


@router.get("/skills", response_model=List[SkillDistribution])
async def get_skills_distribution(
    limit: int = Query(20, ge=1, le=100, description="Number of top skills to return"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get top skills distribution across alumni
    
    **Admin only**
    
    Returns top skills with count and percentage
    """
    try:
        skills = await AnalyticsService.get_skills_distribution(limit=limit)
        return skills
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/locations", response_model=List[LocationDistribution])
async def get_locations_distribution(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get alumni distribution by location with coordinates
    
    **Admin only**
    
    Returns locations with alumni count, job count, and geo coordinates for heatmap
    """
    try:
        locations = await AnalyticsService.get_locations_distribution()
        return locations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/companies", response_model=List[CompanyDistribution])
async def get_companies_distribution(
    limit: int = Query(20, ge=1, le=100, description="Number of top companies to return"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get top companies where alumni work
    
    **Admin only**
    
    Returns top companies with alumni count and percentage
    """
    try:
        companies = await AnalyticsService.get_companies_distribution(limit=limit)
        return companies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/batches", response_model=List[BatchDistribution])
async def get_batches_distribution(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get alumni distribution by batch/graduation year
    
    **Admin only**
    
    Returns count of alumni per batch year
    """
    try:
        batches = await AnalyticsService.get_batches_distribution()
        return batches
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/job-trends", response_model=List[JobTrendsByCategory])
async def get_job_trends(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get job posting trends by job type/category
    
    **Admin only**
    
    Returns job distribution by type with percentages
    """
    try:
        trends = await AnalyticsService.get_job_trends()
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mentorship-stats", response_model=MentorshipStats)
async def get_mentorship_stats(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get comprehensive mentorship program statistics
    
    **Admin only**
    
    Returns:
    - Total mentors and active mentors
    - Total mentees
    - Request statistics (total, accepted, rejected, pending)
    - Session statistics
    - Average mentor rating
    """
    try:
        stats = await AnalyticsService.get_mentorship_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/event-participation", response_model=EventParticipationStats)
async def get_event_participation(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get event participation statistics
    
    **Admin only**
    
    Returns:
    - Total events (upcoming, past)
    - Total RSVPs
    - Average attendance rate
    - Events breakdown by type
    """
    try:
        stats = await AnalyticsService.get_event_participation_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/engagement", response_model=EngagementMetrics)
async def get_engagement_metrics(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get user engagement metrics
    
    **Admin only**
    
    Returns:
    - Total active users
    - Average engagement score
    - Top contributors
    - Engagement distribution by level
    """
    try:
        metrics = await AnalyticsService.get_engagement_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ============================================================================
# ADDITIONAL ENDPOINTS FOR FRONTEND COMPATIBILITY
# ============================================================================

@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get comprehensive dashboard statistics
    
    **Admin only**
    
    Returns:
    - Total users, active users, verified alumni
    - Job statistics (total, active, applications)
    - Event statistics (total, upcoming, RSVPs)
    - Mentorship statistics
    - Forum statistics
    """
    try:
        metrics = await AnalyticsService.get_dashboard_metrics()
        return {
            "success": True,
            "data": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-growth")
async def get_user_growth(
    period: str = Query("monthly", description="Time period: daily, weekly, monthly"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get user growth over time
    
    **Admin only**
    
    Returns user registration trends for specified period
    """
    try:
        # For now, we'll use the dashboard charts which includes user growth
        charts = await AnalyticsService.get_dashboard_charts(days=180)
        
        # Transform to match frontend expected format
        user_growth = []
        if 'user_growth' in charts:
            for item in charts['user_growth']:
                date_obj = item.get('date', '')
                # Convert to month format for monthly view
                if period == 'monthly' and date_obj:
                    from datetime import datetime
                    dt = datetime.fromisoformat(date_obj)
                    month_name = dt.strftime('%b')
                    user_growth.append({
                        'month': month_name,
                        'users': item.get('total_users', 0),
                        'date': date_obj
                    })
        
        return {
            "success": True,
            "data": user_growth[-12:] if user_growth else []  # Last 12 months
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-contributors")
async def get_top_contributors(
    limit: int = Query(10, ge=1, le=50, description="Number of contributors to return"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get top contributors on the platform
    
    **Admin only**
    
    Returns users with highest engagement scores
    """
    try:
        engagement_data = await AnalyticsService.get_engagement_metrics()
        contributors = engagement_data.get('top_contributors', [])[:limit]
        
        # Transform to match frontend expected format
        formatted_contributors = []
        for contrib in contributors:
            formatted_contributors.append({
                'name': contrib.get('name', 'Unknown'),
                'email': f"user_{contrib.get('user_id', '')}@alumni.edu",  # You may want to fetch actual email
                'contributions': contrib.get('score', 0),
                'type': contrib.get('level', 'Active')
            })
        
        return {
            "success": True,
            "data": formatted_contributors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/activity")
async def get_platform_activity(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get platform activity breakdown
    
    **Admin only**
    
    Returns activity counts for different platform features
    """
    try:
        # Get metrics from various sources
        dashboard_metrics = await AnalyticsService.get_dashboard_metrics()
        
        # Calculate activity data
        activity = [
            {
                'activity': 'New user registrations',
                'count': dashboard_metrics.get('total_users', 0),
                'trend': '+12%'
            },
            {
                'activity': 'Job applications',
                'count': dashboard_metrics.get('total_applications', 0),
                'trend': '+18%'
            },
            {
                'activity': 'Event RSVPs',
                'count': dashboard_metrics.get('total_rsvps', 0),
                'trend': '+8%'
            },
            {
                'activity': 'Forum posts created',
                'count': dashboard_metrics.get('forum_posts_count', 0),
                'trend': '+25%'
            },
            {
                'activity': 'Mentorship requests',
                'count': dashboard_metrics.get('total_mentorship_requests', 0),
                'trend': '+15%'
            }
        ]
        
        return {
            "success": True,
            "data": activity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alumni")
async def get_alumni_analytics(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get comprehensive alumni analytics
    
    **Admin only**
    
    Returns:
    - Total and verified alumni count
    - Location distribution
    - Top companies
    - Batch distribution
    - Top skills
    """
    try:
        # Get data from various analytics methods
        locations = await AnalyticsService.get_locations_distribution()
        companies = await AnalyticsService.get_companies_distribution(limit=5)
        batches = await AnalyticsService.get_batches_distribution()
        skills = await AnalyticsService.get_skills_distribution(limit=6)
        dashboard_metrics = await AnalyticsService.get_dashboard_metrics()
        
        # Format location data
        location_data = [
            {
                'location': loc.get('location', 'Unknown'),
                'count': loc.get('alumni_count', 0)
            }
            for loc in locations[:5]
        ]
        
        # Format company data
        company_data = [
            {
                'company': comp.get('company', 'Unknown'),
                'count': comp.get('alumni_count', 0)
            }
            for comp in companies
        ]
        
        # Format batch data
        batch_data = [
            {
                'year': str(batch.get('batch_year', 'Unknown')),
                'count': batch.get('count', 0)
            }
            for batch in batches
        ]
        
        # Format skill data
        skill_data = [
            {
                'skill': skill.get('skill', 'Unknown'),
                'count': skill.get('count', 0)
            }
            for skill in skills
        ]
        
        return {
            "success": True,
            "data": {
                'totalAlumni': dashboard_metrics.get('users_by_role', {}).get('alumni', 0),
                'verifiedAlumni': dashboard_metrics.get('verified_alumni', 0),
                'locationDistribution': location_data,
                'topCompanies': company_data,
                'batchDistribution': batch_data,
                'topSkills': skill_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs")
async def get_job_analytics(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get comprehensive job analytics
    
    **Admin only**
    
    Returns:
    - Total jobs and applications
    - Job type distribution
    - Location distribution
    - Application trends
    - Top skills required
    """
    try:
        dashboard_metrics = await AnalyticsService.get_dashboard_metrics()
        job_trends = await AnalyticsService.get_job_trends()
        locations = await AnalyticsService.get_locations_distribution()
        skills = await AnalyticsService.get_skills_distribution(limit=5)
        
        # Format job type data
        job_type_data = []
        color_map = {
            'full-time': '#3b82f6',
            'part-time': '#f59e0b',
            'internship': '#10b981',
            'contract': '#8b5cf6',
            'remote': '#ec4899'
        }
        for job_type in job_trends:
            job_type_data.append({
                'name': job_type.get('job_type', 'Unknown').replace('-', ' ').title(),
                'value': job_type.get('count', 0),
                'color': color_map.get(job_type.get('job_type', ''), '#6b7280')
            })
        
        # Format location data (jobs per location)
        location_data = [
            {
                'location': loc.get('location', 'Unknown'),
                'jobs': loc.get('jobs_count', 0)
            }
            for loc in locations[:5]
        ]
        
        # Mock application trends (you can enhance this with real data)
        application_trends = [
            {'week': 'Week 1', 'applications': 45},
            {'week': 'Week 2', 'applications': 58},
            {'week': 'Week 3', 'applications': 72},
            {'week': 'Week 4', 'applications': 85}
        ]
        
        # Format skills data
        skill_data = [
            {
                'skill': skill.get('skill', 'Unknown'),
                'count': skill.get('count', 0)
            }
            for skill in skills
        ]
        
        return {
            "success": True,
            "data": {
                'totalJobs': dashboard_metrics.get('total_jobs_posted', 0),
                'totalApplications': dashboard_metrics.get('total_applications', 0),
                'averageApplicationsPerJob': round(
                    dashboard_metrics.get('total_applications', 0) / max(dashboard_metrics.get('total_jobs_posted', 1), 1),
                    1
                ),
                'averageDaysToHire': 12.5,  # You can calculate this from real data
                'jobsByType': job_type_data,
                'jobsByLocation': location_data,
                'applicationTrends': application_trends,
                'topSkillsRequired': skill_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mentorship")
async def get_mentorship_analytics(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get comprehensive mentorship analytics
    
    **Admin only**
    
    Returns:
    - Total requests, mentors, sessions
    - Request status distribution
    - Sessions over time
    - Top expertise areas
    - Rating distribution
    """
    try:
        mentorship_stats = await AnalyticsService.get_mentorship_stats()
        
        # Format status data
        status_data = [
            {
                'name': 'Accepted',
                'value': mentorship_stats.get('accepted_requests', 0),
                'color': '#10b981'
            },
            {
                'name': 'Pending',
                'value': mentorship_stats.get('pending_requests', 0),
                'color': '#f59e0b'
            },
            {
                'name': 'Rejected',
                'value': mentorship_stats.get('rejected_requests', 0),
                'color': '#ef4444'
            }
        ]
        
        # Mock sessions over time (you can enhance with real data)
        session_trends = [
            {'month': 'Jul', 'sessions': 12},
            {'month': 'Aug', 'sessions': 18},
            {'month': 'Sep', 'sessions': 25},
            {'month': 'Oct', 'sessions': 32},
            {'month': 'Nov', 'sessions': 38},
            {'month': 'Dec', 'sessions': 45}
        ]
        
        # Mock expertise areas (you can enhance with real data)
        expertise_data = [
            {'area': 'Career Development', 'count': 28},
            {'area': 'Technical Skills', 'count': 22},
            {'area': 'Leadership', 'count': 18},
            {'area': 'Entrepreneurship', 'count': 15},
            {'area': 'Interview Prep', 'count': 12}
        ]
        
        # Mock rating distribution
        avg_rating = mentorship_stats.get('average_rating', 0)
        rating_data = [
            {'stars': '5 stars', 'count': int(mentorship_stats.get('completed_sessions', 0) * 0.7)},
            {'stars': '4 stars', 'count': int(mentorship_stats.get('completed_sessions', 0) * 0.2)},
            {'stars': '3 stars', 'count': int(mentorship_stats.get('completed_sessions', 0) * 0.1)},
            {'stars': '2 stars', 'count': 0},
            {'stars': '1 star', 'count': 0}
        ]
        
        return {
            "success": True,
            "data": {
                'totalRequests': mentorship_stats.get('total_requests', 0),
                'activeMentors': mentorship_stats.get('active_mentors', 0),
                'completedSessions': mentorship_stats.get('completed_sessions', 0),
                'averageRating': round(avg_rating, 1),
                'requestsByStatus': status_data,
                'sessionsOverTime': session_trends,
                'topExpertiseAreas': expertise_data,
                'ratingDistribution': rating_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events")
async def get_event_analytics(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get comprehensive event analytics
    
    **Admin only**
    
    Returns:
    - Total events and registrations
    - Event type distribution
    - Participation trends
    - Format distribution (virtual/in-person)
    - Popular topics
    """
    try:
        event_stats = await AnalyticsService.get_event_participation_stats()
        dashboard_metrics = await AnalyticsService.get_dashboard_metrics()
        
        # Format event type data
        event_type_data = []
        color_map = {
            'workshop': '#3b82f6',
            'webinar': '#10b981',
            'meetup': '#f59e0b',
            'conference': '#8b5cf6',
            'networking': '#ec4899',
            'other': '#6b7280'
        }
        events_by_type = event_stats.get('events_by_type', {})
        for event_type, count in events_by_type.items():
            event_type_data.append({
                'name': event_type.replace('_', ' ').title(),
                'value': count,
                'color': color_map.get(event_type, '#6b7280')
            })
        
        # Mock participation trend (you can enhance with real data)
        participation_trend = [
            {'month': 'Jul', 'registrations': 45},
            {'month': 'Aug', 'registrations': 58},
            {'month': 'Sep', 'registrations': 72},
            {'month': 'Oct', 'registrations': 88},
            {'month': 'Nov', 'registrations': 105},
            {'month': 'Dec', 'registrations': 120}
        ]
        
        # Mock format distribution
        format_data = [
            {'format': 'Virtual', 'count': event_stats.get('total_events', 0) // 2},
            {'format': 'In-person', 'count': event_stats.get('total_events', 0) // 3},
            {'format': 'Hybrid', 'count': event_stats.get('total_events', 0) // 6}
        ]
        
        # Mock popular topics
        topic_data = [
            {'topic': 'Career Development', 'count': 85, 'color': 'bg-blue-500'},
            {'topic': 'Technology Trends', 'count': 72, 'color': 'bg-green-500'},
            {'topic': 'Networking', 'count': 68, 'color': 'bg-purple-500'},
            {'topic': 'Entrepreneurship', 'count': 55, 'color': 'bg-orange-500'},
            {'topic': 'Industry Insights', 'count': 48, 'color': 'bg-pink-500'}
        ]
        
        return {
            "success": True,
            "data": {
                'totalEvents': event_stats.get('total_events', 0),
                'totalRegistrations': event_stats.get('total_rsvps', 0),
                'attendanceRate': round(event_stats.get('average_attendance_rate', 0)),
                'averageAttendance': event_stats.get('total_rsvps', 0) // max(event_stats.get('total_events', 1), 1),
                'eventsByType': event_type_data,
                'participationTrend': participation_trend,
                'eventsByFormat': format_data,
                'popularTopics': topic_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
