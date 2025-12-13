"""
Skill Recommendations Wrapper Routes
Maps frontend expected endpoints to actual backend skill recommendation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from middleware.auth_middleware import get_current_user
from database.connection import get_db_pool
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations Wrapper"])


@router.get("/skills/{user_id}")
async def get_skill_recommendations_wrapper(
    user_id: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Wrapper for skill recommendations
    Maps /api/recommendations/skills/{user_id} to /api/skill-recommendations/recommendations/{user_id}
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get user's current skills and role
                await cursor.execute("""
                    SELECT skills, current_role, industry
                    FROM alumni_profiles
                    WHERE user_id = %s
                """, (user_id,))
                result = await cursor.fetchone()
                
                if not result:
                    return {
                        "success": True,
                        "data": [],
                        "message": "Profile not found. Complete your profile to get recommendations."
                    }
                
                current_skills = json.loads(result[0]) if result[0] else []
                current_role = result[1]
                industry = result[2]
                
                if not current_skills:
                    # Get popular skills if user has no skills
                    await cursor.execute("""
                        SELECT 
                            sg.skill_name,
                            sg.popularity_score,
                            sg.job_count,
                            sg.alumni_count,
                            'high' as job_demand,
                            75 as relevance_score,
                            TRUE as trending,
                            12 as growth_rate,
                            'Popular skill in the tech industry' as reason
                        FROM skill_graph sg
                        WHERE sg.popularity_score > 70
                        ORDER BY sg.job_count DESC, sg.popularity_score DESC
                        LIMIT %s
                    """, (limit,))
                else:
                    # Get related skills not in user's profile
                    skills_placeholders = ','.join(['%s'] * len(current_skills))
                    
                    await cursor.execute(f"""
                        SELECT DISTINCT 
                            sg.skill_name,
                            sg.popularity_score,
                            sg.job_count,
                            sg.alumni_count,
                            CASE 
                                WHEN sg.job_count > 100 THEN 'very-high'
                                WHEN sg.job_count > 50 THEN 'high'
                                WHEN sg.job_count > 20 THEN 'medium'
                                ELSE 'low'
                            END as job_demand,
                            CASE
                                WHEN sg.popularity_score > 85 THEN 95
                                WHEN sg.popularity_score > 70 THEN 85
                                WHEN sg.popularity_score > 50 THEN 75
                                ELSE 65
                            END as relevance_score,
                            CASE 
                                WHEN sg.job_count > 80 THEN TRUE
                                ELSE FALSE
                            END as trending,
                            CASE
                                WHEN sg.job_count > 100 THEN 18
                                WHEN sg.job_count > 50 THEN 15
                                WHEN sg.job_count > 20 THEN 12
                                ELSE 8
                            END as growth_rate,
                            CASE
                                WHEN sg.job_count > 100 THEN 'High demand skill with excellent career opportunities'
                                WHEN sg.popularity_score > 80 THEN 'Complements your existing skill set perfectly'
                                WHEN sg.job_count > 50 THEN 'Growing demand in your industry'
                                ELSE 'Useful skill for career advancement'
                            END as reason
                        FROM skill_graph sg
                        WHERE sg.skill_name NOT IN ({skills_placeholders})
                        AND (
                            sg.popularity_score > 60
                            OR sg.job_count > 30
                        )
                        ORDER BY 
                            sg.job_count DESC, 
                            sg.popularity_score DESC,
                            sg.alumni_count DESC
                        LIMIT %s
                    """, (*current_skills, limit))
                
                recommendations = []
                for row in await cursor.fetchall():
                    # Generate learning resources based on skill
                    skill_name = row[0]
                    learning_resources = [
                        {
                            "title": f"Learn {skill_name} - Coursera",
                            "url": f"https://www.coursera.org/courses?query={skill_name.replace(' ', '%20')}"
                        },
                        {
                            "title": f"{skill_name} Tutorial - Udemy",
                            "url": f"https://www.udemy.com/courses/search/?q={skill_name.replace(' ', '%20')}"
                        }
                    ]
                    
                    recommendations.append({
                        "skill_name": skill_name,
                        "popularity_score": float(row[1]) if row[1] else 0,
                        "job_count": row[2] or 0,
                        "alumni_count": row[3] or 0,
                        "job_demand": row[4],
                        "relevance_score": row[5],
                        "trending": row[6],
                        "growth_rate": row[7],
                        "reason": row[8],
                        "learning_resources": learning_resources
                    })
                
                return {
                    "success": True,
                    "data": recommendations
                }
    
    except Exception as e:
        logger.error(f"Error getting skill recommendations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.get("/skill-trends/top")
async def get_top_trending_wrapper(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Wrapper for top trending skills
    Maps /api/recommendations/skill-trends/top to /api/skill-recommendations/trending
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get trending skills with calculated metrics
                await cursor.execute("""
                    SELECT 
                        sg.skill_name,
                        sg.popularity_score,
                        sg.job_count,
                        sg.alumni_count,
                        CASE 
                            WHEN sg.skill_name IN ('Python', 'JavaScript', 'Java', 'React', 'Node.js', 'AWS', 'Docker') THEN 'technical'
                            WHEN sg.skill_name IN ('Leadership', 'Management', 'Strategy', 'Marketing') THEN 'business'
                            WHEN sg.skill_name IN ('Machine Learning', 'AI', 'Data Science', 'Deep Learning') THEN 'emerging'
                            ELSE 'other'
                        END as category,
                        CASE
                            WHEN sg.job_count > 100 THEN 18
                            WHEN sg.job_count > 80 THEN 16
                            WHEN sg.job_count > 50 THEN 14
                            WHEN sg.job_count > 30 THEN 12
                            ELSE 10
                        END as growth_rate,
                        CASE
                            WHEN sg.job_count > 100 THEN '+$20K'
                            WHEN sg.job_count > 80 THEN '+$18K'
                            WHEN sg.job_count > 50 THEN '+$15K'
                            WHEN sg.job_count > 30 THEN '+$12K'
                            ELSE '+$10K'
                        END as avg_salary_increase
                    FROM skill_graph sg
                    WHERE sg.popularity_score > 50
                    ORDER BY 
                        sg.job_count DESC, 
                        sg.popularity_score DESC,
                        sg.alumni_count DESC
                    LIMIT %s
                """, (limit,))
                
                trending = []
                for row in await cursor.fetchall():
                    trending.append({
                        "skill_name": row[0],
                        "popularity_score": float(row[1]) if row[1] else 0,
                        "job_count": row[2] or 0,
                        "alumni_count": row[3] or 0,
                        "category": row[4],
                        "growth_rate": row[5],
                        "avg_salary_increase": row[6]
                    })
                
                return {
                    "success": True,
                    "data": trending
                }
    
    except Exception as e:
        logger.error(f"Error getting trending skills: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get trending skills: {str(e)}"
        )


@router.get("/skill-trends")
async def get_skill_trends_wrapper(
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get skill trends with optional category filter
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        sg.skill_name,
                        sg.popularity_score,
                        sg.job_count,
                        sg.alumni_count,
                        CASE 
                            WHEN sg.skill_name IN ('Python', 'JavaScript', 'Java', 'React', 'Node.js', 'AWS', 'Docker', 'TypeScript', 'Go', 'Rust') THEN 'technical'
                            WHEN sg.skill_name IN ('Leadership', 'Management', 'Strategy', 'Marketing', 'Sales', 'Communication') THEN 'business'
                            WHEN sg.skill_name IN ('Machine Learning', 'AI', 'Data Science', 'Deep Learning', 'Blockchain', 'Quantum Computing') THEN 'emerging'
                            ELSE 'other'
                        END as category,
                        CASE
                            WHEN sg.job_count > 100 THEN 'rising'
                            WHEN sg.job_count > 50 THEN 'stable'
                            ELSE 'declining'
                        END as trend_status,
                        CASE
                            WHEN sg.job_count > 100 THEN 18
                            WHEN sg.job_count > 80 THEN 16
                            WHEN sg.job_count > 50 THEN 14
                            WHEN sg.job_count > 30 THEN 12
                            ELSE 10
                        END as growth_rate
                    FROM skill_graph sg
                    WHERE sg.popularity_score > 40
                    ORDER BY sg.job_count DESC, sg.popularity_score DESC
                    LIMIT %s
                """, (limit,))
                
                trends = []
                for row in await cursor.fetchall():
                    skill_category = row[4]
                    if category and skill_category != category:
                        continue
                    
                    trends.append({
                        "skill_name": row[0],
                        "popularity_score": float(row[1]) if row[1] else 0,
                        "job_count": row[2] or 0,
                        "alumni_count": row[3] or 0,
                        "category": skill_category,
                        "trend_status": row[5],
                        "growth_rate": row[6]
                    })
                
                return {
                    "success": True,
                    "data": trends
                }
    
    except Exception as e:
        logger.error(f"Error getting skill trends: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get skill trends: {str(e)}"
        )


@router.get("/skills/{user_id}/career-goal")
async def get_career_goal_recommendations(
    user_id: str,
    target_role: str = Query(..., description="Target role for career goal"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get skill recommendations based on career goal
    Wrapper for /api/skill-recommendations/skill-path/{target_role}
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get user's current skills
                await cursor.execute("""
                    SELECT skills, current_role
                    FROM alumni_profiles
                    WHERE user_id = %s
                """, (user_id,))
                user_data = await cursor.fetchone()
                
                current_skills = json.loads(user_data[0]) if user_data and user_data[0] else []
                current_role = user_data[1] if user_data else None
                
                # Get common skills for target role
                await cursor.execute("""
                    SELECT skills
                    FROM alumni_profiles
                    WHERE LOWER(current_role) LIKE LOWER(%s)
                    AND skills IS NOT NULL
                    LIMIT 50
                """, (f"%{target_role}%",))
                
                # Aggregate skills from alumni in target role
                skill_frequency = {}
                total_profiles = 0
                
                for row in await cursor.fetchall():
                    if row[0]:
                        skills = json.loads(row[0])
                        total_profiles += 1
                        for skill in skills:
                            skill_frequency[skill] = skill_frequency.get(skill, 0) + 1
                
                # Calculate essential vs optional skills
                essential_threshold = total_profiles * 0.6  # 60% have this skill
                optional_threshold = total_profiles * 0.3   # 30% have this skill
                
                essential_skills = []
                optional_skills = []
                
                for skill, count in sorted(skill_frequency.items(), key=lambda x: x[1], reverse=True):
                    skill_data = {
                        "skill": skill,
                        "percentage": round((count / total_profiles) * 100) if total_profiles > 0 else 0,
                        "have_it": skill in current_skills
                    }
                    
                    if count >= essential_threshold:
                        essential_skills.append(skill_data)
                    elif count >= optional_threshold:
                        optional_skills.append(skill_data)
                
                # Get career transition data
                await cursor.execute("""
                    SELECT AVG(transition_duration_months) as avg_duration
                    FROM career_paths
                    WHERE LOWER(to_role) LIKE LOWER(%s)
                """, (f"%{target_role}%",))
                
                duration_result = await cursor.fetchone()
                avg_duration_months = int(duration_result[0]) if duration_result and duration_result[0] else 12
                
                return {
                    "success": True,
                    "data": {
                        "target_role": target_role,
                        "current_role": current_role,
                        "essential_skills": essential_skills[:10],
                        "optional_skills": optional_skills[:10],
                        "estimated_timeline_months": avg_duration_months,
                        "alumni_analyzed": total_profiles,
                        "skills_gap": len([s for s in essential_skills if not s['have_it']])
                    }
                }
    
    except Exception as e:
        logger.error(f"Error getting career goal recommendations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get career goal recommendations: {str(e)}"
        )


@router.get("/skill-trends/by-industry")
async def get_trending_by_industry(
    industry: str = Query(..., description="Industry to filter by"),
    limit: int = Query(15, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Get trending skills filtered by industry
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get skills popular in the specified industry
                await cursor.execute("""
                    SELECT 
                        skill,
                        COUNT(*) as alumni_count,
                        SUM(CASE WHEN willing_to_mentor THEN 1 ELSE 0 END) as mentors_available
                    FROM alumni_profiles ap
                    CROSS JOIN JSON_TABLE(
                        COALESCE(ap.skills, '[]'),
                        '$[*]' COLUMNS (skill VARCHAR(200) PATH '$')
                    ) AS jt
                    WHERE LOWER(ap.industry) = LOWER(%s)
                    AND ap.skills IS NOT NULL
                    GROUP BY skill
                    ORDER BY alumni_count DESC
                    LIMIT %s
                """, (industry, limit))
                
                industry_skills = []
                for row in await cursor.fetchall():
                    skill_name = row[0]
                    alumni_count = row[1]
                    mentors = row[2]
                    
                    # Get additional skill data from skill_graph
                    await cursor.execute("""
                        SELECT job_count, popularity_score
                        FROM skill_graph
                        WHERE skill_name = %s
                    """, (skill_name,))
                    
                    skill_data = await cursor.fetchone()
                    job_count = skill_data[0] if skill_data else 0
                    popularity = skill_data[1] if skill_data else 0
                    
                    growth_rate = 15 if job_count > 50 else 10 if job_count > 20 else 8
                    
                    industry_skills.append({
                        "skill_name": skill_name,
                        "alumni_count": alumni_count,
                        "job_count": job_count,
                        "popularity_score": float(popularity) if popularity else 0,
                        "growth_rate": growth_rate,
                        "mentors_available": mentors,
                        "industry": industry
                    })
                
                return {
                    "success": True,
                    "data": industry_skills,
                    "industry": industry
                }
    
    except Exception as e:
        logger.error(f"Error getting industry trends: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get industry trends: {str(e)}"
        )
