"""
Matching Service - Smart Algorithms for Mentor, Job, and Alumni Matching
Uses Jaccard similarity and Cosine similarity for matching
"""
import logging
from typing import List, Dict, Optional, Tuple
import math
from collections import Counter

logger = logging.getLogger(__name__)


class MatchingService:
    """Service for smart matching algorithms"""
    
    @staticmethod
    def jaccard_similarity(set1: set, set2: set) -> float:
        """
        Calculate Jaccard similarity between two sets
        Formula: |A ∩ B| / |A ∪ B|
        Returns: 0.0 to 1.0
        """
        if not set1 or not set2:
            return 0.0
        
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        
        if union == 0:
            return 0.0
        
        return intersection / union
    
    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors
        Formula: (A · B) / (||A|| * ||B||)
        Returns: 0.0 to 1.0
        """
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(b * b for b in vec2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    @staticmethod
    def normalize_string_list(items: Optional[List[str]]) -> List[str]:
        """Normalize list of strings (lowercase, strip whitespace)"""
        if not items:
            return []
        return [item.lower().strip() for item in items if item]
    
    async def match_mentors(
        self,
        db_conn,
        user_skills: Optional[List[str]] = None,
        interest_areas: Optional[List[str]] = None,
        preferred_industries: Optional[List[str]] = None,
        min_rating: Optional[float] = None,
        limit: int = 10
    ) -> List[Dict]:
        """
        Match mentors based on skills and interests using Jaccard similarity
        """
        try:
            # Normalize input
            user_skills_set = set(self.normalize_string_list(user_skills or []))
            interest_areas_set = set(self.normalize_string_list(interest_areas or []))
            preferred_industries_set = set(self.normalize_string_list(preferred_industries or []))
            
            # Get all available mentors with their profiles
            query = """
                SELECT 
                    mp.id as mentor_profile_id,
                    mp.user_id,
                    mp.expertise_areas,
                    mp.rating,
                    mp.total_sessions,
                    mp.current_mentees_count,
                    mp.max_mentees,
                    u.email,
                    ap.name,
                    ap.photo_url,
                    ap.current_company,
                    ap.current_role,
                    ap.skills,
                    ap.industry
                FROM mentor_profiles mp
                JOIN users u ON mp.user_id = u.id
                JOIN alumni_profiles ap ON mp.user_id = ap.user_id
                WHERE mp.is_available = TRUE
                    AND mp.current_mentees_count < mp.max_mentees
                    AND u.is_active = TRUE
            """
            
            params = []
            if min_rating is not None:
                query += " AND mp.rating >= %s"
                params.append(min_rating)
            
            async with db_conn.cursor() as cursor:
                await cursor.execute(query, params)
                mentors = await cursor.fetchall()
            
            # Calculate match scores for each mentor
            mentor_matches = []
            for mentor in mentors:
                # Parse JSON fields
                mentor_expertise = mentor[2] if mentor[2] else []
                mentor_skills = mentor[12] if mentor[12] else []
                mentor_industry = mentor[13] or ""
                
                # Normalize mentor data
                mentor_expertise_set = set(self.normalize_string_list(mentor_expertise))
                mentor_skills_set = set(self.normalize_string_list(mentor_skills))
                mentor_industry_set = {mentor_industry.lower().strip()} if mentor_industry else set()
                
                # Calculate match scores
                skill_match = 0.0
                expertise_match = 0.0
                industry_match = 0.0
                
                # Skill matching (40% weight)
                if user_skills_set:
                    skill_match = self.jaccard_similarity(user_skills_set, mentor_skills_set)
                
                # Expertise/Interest matching (40% weight)
                if interest_areas_set:
                    expertise_match = self.jaccard_similarity(interest_areas_set, mentor_expertise_set)
                
                # Industry matching (20% weight)
                if preferred_industries_set:
                    industry_match = self.jaccard_similarity(preferred_industries_set, mentor_industry_set)
                
                # Calculate weighted match score
                match_score = (
                    0.40 * skill_match +
                    0.40 * expertise_match +
                    0.20 * industry_match
                )
                
                # Find common skills/expertise
                matching_skills = list(user_skills_set.intersection(mentor_skills_set))
                matching_expertise = list(interest_areas_set.intersection(mentor_expertise_set))
                
                # Generate matching reasons
                matching_reasons = []
                if matching_skills:
                    matching_reasons.append(f"Shares {len(matching_skills)} skill(s): {', '.join(matching_skills[:3])}")
                if matching_expertise:
                    matching_reasons.append(f"Expertise in: {', '.join(matching_expertise[:3])}")
                if mentor[3] >= 4.0:
                    matching_reasons.append(f"Highly rated mentor ({mentor[3]:.1f}/5.0)")
                if mentor[4] >= 10:
                    matching_reasons.append(f"Experienced with {mentor[4]} sessions")
                
                mentor_matches.append({
                    'mentor_id': mentor[0],
                    'user_id': mentor[1],
                    'name': mentor[8],
                    'email': mentor[7],
                    'photo_url': mentor[9],
                    'current_company': mentor[10],
                    'current_role': mentor[11],
                    'expertise_areas': mentor_expertise,
                    'rating': float(mentor[3]) if mentor[3] else 0.0,
                    'total_sessions': mentor[4],
                    'match_score': match_score,
                    'matching_skills': matching_skills,
                    'matching_reasons': matching_reasons if matching_reasons else ["Available mentor in network"]
                })
            
            # Sort by match score (descending) and rating
            mentor_matches.sort(key=lambda x: (x['match_score'], x['rating']), reverse=True)
            
            return mentor_matches[:limit]
            
        except Exception as e:
            logger.error(f"Error in match_mentors: {str(e)}")
            raise
    
    async def recommend_jobs(
        self,
        db_conn,
        user_id: Optional[str] = None,
        user_skills: Optional[List[str]] = None,
        preferred_locations: Optional[List[str]] = None,
        preferred_job_types: Optional[List[str]] = None,
        min_experience: Optional[int] = None,
        limit: int = 10
    ) -> List[Dict]:
        """
        Recommend jobs based on user skills and preferences using Jaccard similarity
        """
        try:
            # If user_id provided, get their profile
            if user_id and not user_skills:
                async with db_conn.cursor() as cursor:
                    await cursor.execute(
                        "SELECT skills FROM alumni_profiles WHERE user_id = %s",
                        (user_id,)
                    )
                    profile = await cursor.fetchone()
                    if profile and profile[0]:
                        user_skills = profile[0]
            
            # Normalize input
            user_skills_set = set(self.normalize_string_list(user_skills or []))
            preferred_locations_set = set(self.normalize_string_list(preferred_locations or []))
            preferred_job_types_set = set(self.normalize_string_list(preferred_job_types or []))
            
            # Get all active jobs
            query = """
                SELECT 
                    id, title, description, company, location, job_type,
                    experience_required, skills_required, salary_range,
                    posted_by, created_at
                FROM jobs
                WHERE status = 'active'
                    AND (application_deadline IS NULL OR application_deadline > NOW())
                ORDER BY created_at DESC
                LIMIT 100
            """
            
            async with db_conn.cursor() as cursor:
                await cursor.execute(query)
                jobs = await cursor.fetchall()
            
            # Calculate match scores for each job
            job_matches = []
            for job in jobs:
                job_skills = job[7] if job[7] else []
                job_location = job[4] or ""
                job_type = job[5] or ""
                
                # Normalize job data
                job_skills_set = set(self.normalize_string_list(job_skills))
                job_location_set = {job_location.lower().strip()} if job_location else set()
                job_type_set = {job_type.lower().strip()} if job_type else set()
                
                # Calculate match scores
                skill_match = 0.0
                location_match = 0.0
                job_type_match = 0.0
                
                # Skill matching (70% weight) - most important
                if user_skills_set and job_skills_set:
                    skill_match = self.jaccard_similarity(user_skills_set, job_skills_set)
                
                # Location matching (20% weight)
                if preferred_locations_set and job_location_set:
                    location_match = self.jaccard_similarity(preferred_locations_set, job_location_set)
                elif not preferred_locations_set:
                    location_match = 0.5  # Neutral if no preference
                
                # Job type matching (10% weight)
                if preferred_job_types_set and job_type_set:
                    job_type_match = self.jaccard_similarity(preferred_job_types_set, job_type_set)
                elif not preferred_job_types_set:
                    job_type_match = 0.5  # Neutral if no preference
                
                # Calculate weighted match score
                match_score = (
                    0.70 * skill_match +
                    0.20 * location_match +
                    0.10 * job_type_match
                )
                
                # Find matching and missing skills
                matching_skills = list(user_skills_set.intersection(job_skills_set))
                missing_skills = list(job_skills_set.difference(user_skills_set))
                
                # Generate matching reasons
                matching_reasons = []
                if matching_skills:
                    matching_reasons.append(f"Matches {len(matching_skills)}/{len(job_skills_set)} required skills")
                if len(matching_skills) == len(job_skills_set):
                    matching_reasons.append("Perfect skill match!")
                if preferred_locations_set and job_location.lower() in [l.lower() for l in preferred_locations]:
                    matching_reasons.append(f"Located in preferred area: {job_location}")
                if job_type.lower() in [jt.lower() for jt in (preferred_job_types or [])]:
                    matching_reasons.append(f"Preferred job type: {job_type}")
                
                if not matching_reasons:
                    matching_reasons.append("Relevant opportunity in your field")
                
                job_matches.append({
                    'job_id': job[0],
                    'title': job[1],
                    'company': job[3],
                    'location': job[4],
                    'job_type': job[5],
                    'skills_required': job_skills,
                    'experience_required': job[6],
                    'salary_range': job[8],
                    'match_score': match_score,
                    'matching_skills': matching_skills,
                    'missing_skills': missing_skills,
                    'matching_reasons': matching_reasons
                })
            
            # Sort by match score (descending)
            job_matches.sort(key=lambda x: x['match_score'], reverse=True)
            
            return job_matches[:limit]
            
        except Exception as e:
            logger.error(f"Error in recommend_jobs: {str(e)}")
            raise
    
    async def suggest_alumni_connections(
        self,
        db_conn,
        user_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Suggest alumni connections based on similar skills, companies, and locations
        Uses Jaccard similarity for matching
        """
        try:
            # Get current user's profile
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        skills, current_company, location, batch_year, industry
                    FROM alumni_profiles
                    WHERE user_id = %s
                """, (user_id,))
                user_profile = await cursor.fetchone()
            
            if not user_profile:
                return []
            
            user_skills = user_profile[0] if user_profile[0] else []
            user_company = user_profile[1] or ""
            user_location = user_profile[2] or ""
            user_batch_year = user_profile[3]
            user_industry = user_profile[4] or ""
            
            # Normalize user data
            user_skills_set = set(self.normalize_string_list(user_skills))
            user_company_lower = user_company.lower().strip()
            user_location_lower = user_location.lower().strip()
            user_industry_lower = user_industry.lower().strip()
            
            # Get other alumni profiles
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        ap.user_id, ap.name, ap.photo_url, ap.current_company,
                        ap.current_role, ap.location, ap.batch_year, ap.skills,
                        ap.industry, u.email
                    FROM alumni_profiles ap
                    JOIN users u ON ap.user_id = u.id
                    WHERE ap.user_id != %s
                        AND u.is_active = TRUE
                        AND ap.is_verified = TRUE
                    LIMIT 200
                """, (user_id,))
                alumni = await cursor.fetchall()
            
            # Calculate similarity scores
            alumni_matches = []
            for alum in alumni:
                alum_skills = alum[7] if alum[7] else []
                alum_company = alum[3] or ""
                alum_location = alum[5] or ""
                alum_batch_year = alum[6]
                alum_industry = alum[8] or ""
                
                # Normalize alumni data
                alum_skills_set = set(self.normalize_string_list(alum_skills))
                alum_company_lower = alum_company.lower().strip()
                alum_location_lower = alum_location.lower().strip()
                alum_industry_lower = alum_industry.lower().strip()
                
                # Calculate similarity scores
                skill_similarity = self.jaccard_similarity(user_skills_set, alum_skills_set)
                
                company_match = 1.0 if user_company_lower == alum_company_lower and user_company_lower else 0.0
                location_match = 1.0 if user_location_lower == alum_location_lower and user_location_lower else 0.0
                industry_match = 1.0 if user_industry_lower == alum_industry_lower and user_industry_lower else 0.0
                
                # Batch year proximity (same year = 1.0, 1 year diff = 0.8, 2 years = 0.6, etc.)
                batch_similarity = 0.0
                if user_batch_year and alum_batch_year:
                    year_diff = abs(user_batch_year - alum_batch_year)
                    batch_similarity = max(0.0, 1.0 - (year_diff * 0.2))
                
                # Calculate weighted similarity score
                similarity_score = (
                    0.40 * skill_similarity +
                    0.20 * company_match +
                    0.15 * location_match +
                    0.15 * industry_match +
                    0.10 * batch_similarity
                )
                
                # Find common elements
                common_skills = list(user_skills_set.intersection(alum_skills_set))
                common_interests = []
                
                if company_match > 0:
                    common_interests.append(f"Works at {alum_company}")
                if location_match > 0:
                    common_interests.append(f"Located in {alum_location}")
                if industry_match > 0:
                    common_interests.append(f"{alum_industry} industry")
                if batch_similarity >= 0.8:
                    common_interests.append(f"Batch {alum_batch_year}")
                
                # Generate matching reasons
                matching_reasons = []
                if common_skills:
                    matching_reasons.append(f"{len(common_skills)} shared skills: {', '.join(common_skills[:3])}")
                if company_match > 0:
                    matching_reasons.append(f"Works at same company")
                if location_match > 0:
                    matching_reasons.append(f"Same location: {alum_location}")
                if batch_similarity == 1.0:
                    matching_reasons.append(f"Same batch year")
                if industry_match > 0:
                    matching_reasons.append(f"Same industry: {alum_industry}")
                
                if not matching_reasons:
                    matching_reasons.append("Active alumni in network")
                
                alumni_matches.append({
                    'user_id': alum[0],
                    'name': alum[1],
                    'email': alum[9],
                    'photo_url': alum[2],
                    'current_company': alum[3],
                    'current_role': alum[4],
                    'location': alum[5],
                    'batch_year': alum[6],
                    'skills': alum_skills,
                    'similarity_score': similarity_score,
                    'common_skills': common_skills,
                    'common_interests': common_interests,
                    'matching_reasons': matching_reasons
                })
            
            # Sort by similarity score (descending)
            alumni_matches.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            # Filter out very low similarity matches (below 0.1)
            alumni_matches = [a for a in alumni_matches if a['similarity_score'] >= 0.1]
            
            return alumni_matches[:limit]
            
        except Exception as e:
            logger.error(f"Error in suggest_alumni_connections: {str(e)}")
            raise


# Initialize service instance
matching_service = MatchingService()
