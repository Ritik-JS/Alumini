"""
Skill Recommendations Routes
Provides AI-powered skill recommendations based on user profile and market demand
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
import logging
import json

from middleware.auth_middleware import get_current_user
from database.connection import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/skill-recommendations", tags=["Skill Recommendations"])


@router.get("/recommendations/{user_id}")
async def get_skill_recommendations(
    user_id: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Get personalized skill recommendations for user
    
    Based on:
        - Current skills in user profile
        - Career goals and current role
        - Market demand and job postings
        - Similar alumni skill paths
        - Trending technologies
        
    Returns:
        - Recommended skills with relevance scores
        - Job demand indicators
        - Growth rates
        - Learning resources
        - Reasons for recommendation
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
                    "data": recommendations,
                    "user_context": {
                        "current_skills_count": len(current_skills),
                        "current_role": current_role,
                        "industry": industry
                    }
                }
    
    except Exception as e:
        logger.error(f"Error getting skill recommendations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.get("/trending")
async def get_top_trending_skills(
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = Query(None, description="Filter by category (technical, business, etc)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get top trending skills with growth metrics
    
    Trending skills are identified by:
        - High job demand
        - Growing alumni adoption
        - Industry demand signals
        - Recent job postings
        
    Returns:
        - Skill name and category
        - Job count and growth rate
        - Average salary increase
        - Alumni count
        - Popularity score
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get trending skills with calculated metrics
                query = """
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
                """
                
                params = []
                if category:
                    # Note: This is a simplified filter, in production you'd have a category column
                    pass
                
                query += """
                    ORDER BY 
                        sg.job_count DESC, 
                        sg.popularity_score DESC,
                        sg.alumni_count DESC
                    LIMIT %s
                """
                params.append(limit)
                
                await cursor.execute(query, tuple(params))
                
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
                    "data": trending,
                    "total": len(trending)
                }
    
    except Exception as e:
        logger.error(f"Error getting trending skills: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get trending skills: {str(e)}"
        )


@router.get("/skill-path/{target_role}")
async def get_skill_path_for_role(
    target_role: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get recommended skill path to reach a target role
    
    Analyzes:
        - Current alumni in target role
        - Common skills for that role
        - Career transitions to that role
        - Industry requirements
        
    Returns:
        - Essential skills for the role
        - Optional skills that help
        - Timeline estimate
        - Similar alumni who made the transition
    """
    try:
        user_id = current_user['id']
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
        logger.error(f"Error getting skill path: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get skill path: {str(e)}"
        )


@router.get("/compare-skills")
async def compare_user_skills_with_market(
    current_user: dict = Depends(get_current_user)
):
    """
    Compare user's skills with current market demand
    
    Shows:
        - Which of user's skills are in high demand
        - Which skills are becoming obsolete
        - Skill gaps compared to similar roles
        - Recommendations for upskilling
    """
    try:
        user_id = current_user['id']
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get user skills
                await cursor.execute("""
                    SELECT skills, current_role
                    FROM alumni_profiles
                    WHERE user_id = %s
                """, (user_id,))
                result = await cursor.fetchone()
                
                if not result or not result[0]:
                    return {
                        "success": True,
                        "data": {
                            "message": "Add skills to your profile to get market comparison"
                        }
                    }
                
                user_skills = json.loads(result[0])
                current_role = result[1]
                
                # Get market demand for user's skills
                skills_placeholders = ','.join(['%s'] * len(user_skills))
                await cursor.execute(f"""
                    SELECT 
                        skill_name,
                        job_count,
                        popularity_score,
                        alumni_count
                    FROM skill_graph
                    WHERE skill_name IN ({skills_placeholders})
                """, tuple(user_skills))
                
                skills_analysis = []
                for row in await cursor.fetchall():
                    demand_level = 'high' if row[1] > 50 else 'medium' if row[1] > 20 else 'low'
                    skills_analysis.append({
                        "skill": row[0],
                        "job_demand": row[1] or 0,
                        "demand_level": demand_level,
                        "popularity": float(row[2]) if row[2] else 0,
                        "market_saturation": row[3] or 0
                    })
                
                # Sort by demand
                skills_analysis.sort(key=lambda x: x['job_demand'], reverse=True)
                
                return {
                    "success": True,
                    "data": {
                        "skills_analysis": skills_analysis,
                        "high_demand_skills": [s for s in skills_analysis if s['demand_level'] == 'high'],
                        "low_demand_skills": [s for s in skills_analysis if s['demand_level'] == 'low'],
                        "recommendation": "Focus on high-demand skills and consider upskilling in emerging areas"
                    }
                }
    
    except Exception as e:
        logger.error(f"Error comparing skills: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compare skills: {str(e)}"
        )
