"""Profile service for alumni profile management"""
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import aiomysql

from database.connection import get_db_pool
from database.models import (
    AlumniProfileCreate,
    AlumniProfileUpdate,
    AlumniProfileResponse,
    ProfileSearchParams,
    ProfileFilterOptions
)

logger = logging.getLogger(__name__)


class ProfileService:
    """Service for managing alumni profiles"""
    
    @staticmethod
    async def create_profile(user_id: str, profile_data: AlumniProfileCreate) -> Dict[str, Any]:
        """Create alumni profile"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if profile already exists
                await cursor.execute(
                    "SELECT id FROM alumni_profiles WHERE user_id = %s",
                    (user_id,)
                )
                existing = await cursor.fetchone()
                if existing:
                    raise ValueError("Profile already exists for this user")
                
                # Prepare JSON fields
                experience_json = json.dumps([exp.dict() for exp in profile_data.experience_timeline]) if profile_data.experience_timeline else None
                education_json = json.dumps([edu.dict() for edu in profile_data.education_details]) if profile_data.education_details else None
                skills_json = json.dumps(profile_data.skills) if profile_data.skills else None
                achievements_json = json.dumps(profile_data.achievements) if profile_data.achievements else None
                social_links_json = json.dumps(profile_data.social_links.dict()) if profile_data.social_links else None
                
                # Insert profile
                query = """
                INSERT INTO alumni_profiles (
                    user_id, name, bio, headline, current_company, current_role, 
                    location, batch_year, experience_timeline, education_details,
                    skills, achievements, social_links, industry, years_of_experience,
                    willing_to_mentor, willing_to_hire
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """
                await cursor.execute(query, (
                    user_id, profile_data.name, profile_data.bio, profile_data.headline,
                    profile_data.current_company, profile_data.current_role, profile_data.location,
                    profile_data.batch_year, experience_json, education_json, skills_json,
                    achievements_json, social_links_json, profile_data.industry,
                    profile_data.years_of_experience, profile_data.willing_to_mentor,
                    profile_data.willing_to_hire
                ))
                await conn.commit()
                
                # Get the created profile ID
                profile_id = cursor.lastrowid
                
                # Calculate profile completion
                await cursor.callproc('calculate_profile_completion', (user_id,))
                await conn.commit()
                
                # Fetch the created profile
                return await ProfileService.get_profile_by_user_id(user_id)
    
    @staticmethod
    async def get_profile_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Get profile by user ID"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    """
                    SELECT * FROM alumni_profiles WHERE user_id = %s
                    """,
                    (user_id,)
                )
                profile = await cursor.fetchone()
                
                if profile:
                    # Parse JSON fields
                    profile = ProfileService._parse_profile_json_fields(profile)
                
                return profile
    
    @staticmethod
    async def get_profile_by_id(profile_id: str) -> Optional[Dict[str, Any]]:
        """Get profile by profile ID"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    """
                    SELECT * FROM alumni_profiles WHERE id = %s
                    """,
                    (profile_id,)
                )
                profile = await cursor.fetchone()
                
                if profile:
                    profile = ProfileService._parse_profile_json_fields(profile)
                
                return profile
    
    @staticmethod
    async def update_profile(user_id: str, profile_data: AlumniProfileUpdate) -> Dict[str, Any]:
        """Update alumni profile"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build update query dynamically for only provided fields
                update_fields = []
                values = []
                
                if profile_data.name is not None:
                    update_fields.append("name = %s")
                    values.append(profile_data.name)
                
                if profile_data.bio is not None:
                    update_fields.append("bio = %s")
                    values.append(profile_data.bio)
                
                if profile_data.headline is not None:
                    update_fields.append("headline = %s")
                    values.append(profile_data.headline)
                
                if profile_data.current_company is not None:
                    update_fields.append("current_company = %s")
                    values.append(profile_data.current_company)
                
                if profile_data.current_role is not None:
                    update_fields.append("current_role = %s")
                    values.append(profile_data.current_role)
                
                if profile_data.location is not None:
                    update_fields.append("location = %s")
                    values.append(profile_data.location)
                
                if profile_data.batch_year is not None:
                    update_fields.append("batch_year = %s")
                    values.append(profile_data.batch_year)
                
                if profile_data.experience_timeline is not None:
                    update_fields.append("experience_timeline = %s")
                    values.append(json.dumps([exp.dict() for exp in profile_data.experience_timeline]))
                
                if profile_data.education_details is not None:
                    update_fields.append("education_details = %s")
                    values.append(json.dumps([edu.dict() for edu in profile_data.education_details]))
                
                if profile_data.skills is not None:
                    update_fields.append("skills = %s")
                    values.append(json.dumps(profile_data.skills))
                
                if profile_data.achievements is not None:
                    update_fields.append("achievements = %s")
                    values.append(json.dumps(profile_data.achievements))
                
                if profile_data.social_links is not None:
                    update_fields.append("social_links = %s")
                    values.append(json.dumps(profile_data.social_links.dict()))
                
                if profile_data.industry is not None:
                    update_fields.append("industry = %s")
                    values.append(profile_data.industry)
                
                if profile_data.years_of_experience is not None:
                    update_fields.append("years_of_experience = %s")
                    values.append(profile_data.years_of_experience)
                
                if profile_data.willing_to_mentor is not None:
                    update_fields.append("willing_to_mentor = %s")
                    values.append(profile_data.willing_to_mentor)
                
                if profile_data.willing_to_hire is not None:
                    update_fields.append("willing_to_hire = %s")
                    values.append(profile_data.willing_to_hire)
                
                if not update_fields:
                    # No fields to update
                    return await ProfileService.get_profile_by_user_id(user_id)
                
                # Add user_id to values
                values.append(user_id)
                
                query = f"""
                UPDATE alumni_profiles 
                SET {', '.join(update_fields)}
                WHERE user_id = %s
                """
                
                await cursor.execute(query, values)
                await conn.commit()
                
                # Recalculate profile completion
                await cursor.callproc('calculate_profile_completion', (user_id,))
                await conn.commit()
                
                # Return updated profile
                return await ProfileService.get_profile_by_user_id(user_id)
    
    @staticmethod
    async def delete_profile(user_id: str, admin_id: str) -> bool:
        """Delete profile (admin only)"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "DELETE FROM alumni_profiles WHERE user_id = %s",
                    (user_id,)
                )
                await conn.commit()
                
                # Log admin action
                await cursor.execute(
                    """
                    INSERT INTO admin_actions (
                        admin_id, action_type, target_type, target_id, description
                    ) VALUES (%s, %s, %s, %s, %s)
                    """,
                    (admin_id, 'user_management', 'profile', user_id, 'Deleted alumni profile')
                )
                await conn.commit()
                
                return cursor.rowcount > 0
    
    @staticmethod
    async def update_profile_photo(user_id: str, photo_url: str) -> Dict[str, Any]:
        """Update profile photo URL"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE alumni_profiles SET photo_url = %s WHERE user_id = %s",
                    (photo_url, user_id)
                )
                await conn.commit()
                
                return await ProfileService.get_profile_by_user_id(user_id)
    
    @staticmethod
    async def update_cv_url(user_id: str, cv_url: str) -> Dict[str, Any]:
        """Update CV URL"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE alumni_profiles SET cv_url = %s WHERE user_id = %s",
                    (cv_url, user_id)
                )
                await conn.commit()
                
                return await ProfileService.get_profile_by_user_id(user_id)
    
    @staticmethod
    async def search_profiles(search_params: ProfileSearchParams) -> Dict[str, Any]:
        """Search alumni profiles with filters"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build WHERE clauses
                where_clauses = []
                values = []
                
                if search_params.name:
                    where_clauses.append("name LIKE %s")
                    values.append(f"%{search_params.name}%")
                
                if search_params.company:
                    where_clauses.append("current_company LIKE %s")
                    values.append(f"%{search_params.company}%")
                
                if search_params.job_role:
                    where_clauses.append("current_role LIKE %s")
                    values.append(f"%{search_params.job_role}%")
                
                if search_params.location:
                    where_clauses.append("location LIKE %s")
                    values.append(f"%{search_params.location}%")
                
                if search_params.batch_year:
                    where_clauses.append("batch_year = %s")
                    values.append(search_params.batch_year)
                
                if search_params.verified_only:
                    where_clauses.append("is_verified = TRUE")
                
                if search_params.skills:
                    # Check if any of the search skills match
                    skill_conditions = []
                    for skill in search_params.skills:
                        skill_conditions.append("JSON_CONTAINS(skills, %s)")
                        values.append(json.dumps(skill))
                    where_clauses.append(f"({' OR '.join(skill_conditions)})")
                
                where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
                
                # Count total results
                count_query = f"SELECT COUNT(*) as total FROM alumni_profiles {where_sql}"
                await cursor.execute(count_query, values)
                total_result = await cursor.fetchone()
                total = total_result['total'] if total_result else 0
                
                # Get paginated results
                offset = (search_params.page - 1) * search_params.limit
                query = f"""
                SELECT * FROM alumni_profiles 
                {where_sql}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """
                values.extend([search_params.limit, offset])
                
                await cursor.execute(query, values)
                profiles = await cursor.fetchall()
                
                # Parse JSON fields
                parsed_profiles = [ProfileService._parse_profile_json_fields(p) for p in profiles]
                
                return {
                    "profiles": parsed_profiles,
                    "total": total,
                    "page": search_params.page,
                    "limit": search_params.limit,
                    "total_pages": (total + search_params.limit - 1) // search_params.limit
                }
    
    @staticmethod
    async def get_filter_options() -> ProfileFilterOptions:
        """Get available filter options"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get unique companies
                await cursor.execute(
                    """
                    SELECT DISTINCT current_company 
                    FROM alumni_profiles 
                    WHERE current_company IS NOT NULL 
                    ORDER BY current_company
                    """
                )
                companies = [row['current_company'] for row in await cursor.fetchall()]
                
                # Get unique locations
                await cursor.execute(
                    """
                    SELECT DISTINCT location 
                    FROM alumni_profiles 
                    WHERE location IS NOT NULL 
                    ORDER BY location
                    """
                )
                locations = [row['location'] for row in await cursor.fetchall()]
                
                # Get unique batch years
                await cursor.execute(
                    """
                    SELECT DISTINCT batch_year 
                    FROM alumni_profiles 
                    WHERE batch_year IS NOT NULL 
                    ORDER BY batch_year DESC
                    """
                )
                batch_years = [row['batch_year'] for row in await cursor.fetchall()]
                
                # Get unique industries
                await cursor.execute(
                    """
                    SELECT DISTINCT industry 
                    FROM alumni_profiles 
                    WHERE industry IS NOT NULL 
                    ORDER BY industry
                    """
                )
                industries = [row['industry'] for row in await cursor.fetchall()]
                
                # Get all skills (need to parse JSON)
                await cursor.execute(
                    """
                    SELECT skills 
                    FROM alumni_profiles 
                    WHERE skills IS NOT NULL
                    """
                )
                all_skills_rows = await cursor.fetchall()
                skills_set = set()
                for row in all_skills_rows:
                    if row['skills']:
                        try:
                            skills_list = json.loads(row['skills'])
                            skills_set.update(skills_list)
                        except:
                            pass
                
                skills = sorted(list(skills_set))
                
                return ProfileFilterOptions(
                    companies=companies,
                    skills=skills,
                    locations=locations,
                    batch_years=batch_years,
                    industries=industries
                )
    
    @staticmethod
    async def get_directory(page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get paginated alumni directory"""
        search_params = ProfileSearchParams(page=page, limit=limit)
        return await ProfileService.search_profiles(search_params)
    
    @staticmethod
    def _parse_profile_json_fields(profile: Dict[str, Any]) -> Dict[str, Any]:
        """Parse JSON fields in profile"""
        json_fields = ['experience_timeline', 'education_details', 'skills', 'achievements', 'social_links']
        for field in json_fields:
            if profile.get(field):
                try:
                    if isinstance(profile[field], str):
                        profile[field] = json.loads(profile[field])
                except:
                    profile[field] = None
        return profile
