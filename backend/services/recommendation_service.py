"""
Recommendation Service - Content-based recommendations for events, posts, and alumni
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for content recommendations"""
    
    @staticmethod
    def normalize_string_list(items: Optional[List[str]]) -> List[str]:
        """Normalize list of strings (lowercase, strip whitespace)"""
        if not items:
            return []
        return [item.lower().strip() for item in items if item]
    
    @staticmethod
    def jaccard_similarity(set1: set, set2: set) -> float:
        """Calculate Jaccard similarity between two sets"""
        if not set1 or not set2:
            return 0.0
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        return intersection / union if union > 0 else 0.0
    
    async def get_user_interests(self, db_conn, user_id: str) -> Dict:
        """Get user interests from profile and interaction history"""
        try:
            interests = {
                'skills': [],
                'tags': [],
                'industries': [],
                'event_types': [],
                'companies': []
            }
            
            # Get from alumni profile
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT skills, industry
                    FROM alumni_profiles
                    WHERE user_id = %s
                """, (user_id,))
                profile = await cursor.fetchone()
                
                if profile:
                    if profile[0]:
                        interests['skills'] = profile[0]
                    if profile[1]:
                        interests['industries'].append(profile[1])
            
            # Get from user_interests table if exists
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT interest_tags, preferred_industries
                    FROM user_interests
                    WHERE user_id = %s
                """, (user_id,))
                user_interest = await cursor.fetchone()
                
                if user_interest:
                    if user_interest[0]:
                        interests['tags'].extend(user_interest[0])
                    if user_interest[1]:
                        interests['industries'].extend(user_interest[1])
            
            # Get from recent interactions (forum posts liked/commented)
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT DISTINCT fp.tags
                    FROM post_likes pl
                    JOIN forum_posts fp ON pl.post_id = fp.id
                    WHERE pl.user_id = %s
                        AND fp.tags IS NOT NULL
                    ORDER BY pl.created_at DESC
                    LIMIT 20
                """, (user_id,))
                liked_posts = await cursor.fetchall()
                
                for post in liked_posts:
                    if post[0]:
                        interests['tags'].extend(post[0])
            
            # Get from attended events
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT DISTINCT e.event_type
                    FROM event_rsvps er
                    JOIN events e ON er.event_id = e.id
                    WHERE er.user_id = %s
                        AND er.status = 'attending'
                    LIMIT 20
                """, (user_id,))
                attended_events = await cursor.fetchall()
                
                for event in attended_events:
                    if event[0]:
                        interests['event_types'].append(event[0])
            
            # Deduplicate and normalize
            interests['skills'] = list(set(self.normalize_string_list(interests['skills'])))
            interests['tags'] = list(set(self.normalize_string_list(interests['tags'])))
            interests['industries'] = list(set(self.normalize_string_list(interests['industries'])))
            interests['event_types'] = list(set(self.normalize_string_list(interests['event_types'])))
            
            return interests
            
        except Exception as e:
            logger.error(f"Error getting user interests: {str(e)}")
            return {
                'skills': [],
                'tags': [],
                'industries': [],
                'event_types': [],
                'companies': []
            }
    
    async def recommend_events(
        self,
        db_conn,
        user_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Recommend events based on user interests and past attendance
        """
        try:
            # Get user interests
            interests = await self.get_user_interests(db_conn, user_id)
            interest_tags = set(interests['tags'] + interests['skills'])
            preferred_event_types = set(interests['event_types'])
            
            # Get upcoming events
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, title, description, event_type, start_date,
                        location, is_virtual, created_at
                    FROM events
                    WHERE status = 'published'
                        AND start_date > NOW()
                        AND (registration_deadline IS NULL OR registration_deadline > NOW())
                    ORDER BY start_date ASC
                    LIMIT 100
                """)
                events = await cursor.fetchall()
            
            # Calculate relevance scores
            event_recommendations = []
            for event in events:
                event_type = event[3].lower()
                event_title = event[1].lower()
                event_desc = (event[2] or "").lower()
                
                # Extract keywords from title and description
                event_keywords = set()
                for word in (event_title + " " + event_desc).split():
                    if len(word) > 3:  # Filter short words
                        event_keywords.add(word.strip('.,!?;:()[]{}'))
                
                # Calculate relevance score
                keyword_match = self.jaccard_similarity(interest_tags, event_keywords)
                event_type_match = 1.0 if event_type in preferred_event_types else 0.5
                
                # Boost for virtual events (more accessible)
                virtual_boost = 0.1 if event[6] else 0.0
                
                # Recency boost (sooner events slightly higher priority)
                days_until = (event[4] - datetime.now()).days
                recency_score = max(0.0, min(1.0, 1.0 - (days_until / 90)))  # 90 days window
                
                relevance_score = (
                    0.50 * keyword_match +
                    0.30 * event_type_match +
                    0.10 * recency_score +
                    0.10 * virtual_boost
                )
                
                # Generate recommendation reason
                reason_parts = []
                if keyword_match > 0.3:
                    reason_parts.append("Matches your interests")
                if event_type in preferred_event_types:
                    reason_parts.append(f"You enjoy {event_type} events")
                if event[6]:
                    reason_parts.append("Virtual event - easy to attend")
                if days_until <= 7:
                    reason_parts.append("Coming up soon!")
                
                recommendation_reason = "; ".join(reason_parts) if reason_parts else "Recommended for you"
                
                event_recommendations.append({
                    'event_id': event[0],
                    'title': event[1],
                    'description': event[2],
                    'event_type': event[3],
                    'start_date': event[4],
                    'location': event[5],
                    'is_virtual': event[6],
                    'relevance_score': relevance_score,
                    'recommendation_reason': recommendation_reason
                })
            
            # Sort by relevance score
            event_recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            return event_recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error recommending events: {str(e)}")
            raise
    
    async def recommend_posts(
        self,
        db_conn,
        user_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Recommend forum posts based on user interests and engagement history
        """
        try:
            # Get user interests
            interests = await self.get_user_interests(db_conn, user_id)
            interest_tags = set(interests['tags'] + interests['skills'])
            
            # Get recent posts user hasn't liked
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        fp.id, fp.title, fp.content, fp.tags,
                        fp.likes_count, fp.comments_count, fp.created_at,
                        ap.name as author_name
                    FROM forum_posts fp
                    JOIN users u ON fp.author_id = u.id
                    JOIN alumni_profiles ap ON u.id = ap.user_id
                    WHERE fp.is_deleted = FALSE
                        AND fp.author_id != %s
                        AND fp.id NOT IN (
                            SELECT post_id FROM post_likes WHERE user_id = %s
                        )
                    ORDER BY fp.created_at DESC
                    LIMIT 100
                """, (user_id, user_id))
                posts = await cursor.fetchall()
            
            # Calculate relevance scores
            post_recommendations = []
            for post in posts:
                post_tags = post[3] if post[3] else []
                post_tags_set = set(self.normalize_string_list(post_tags))
                
                # Extract keywords from title and content
                post_text = (post[1] or "") + " " + (post[2] or "")
                post_keywords = set()
                for word in post_text.lower().split():
                    if len(word) > 4:  # Filter short words
                        post_keywords.add(word.strip('.,!?;:()[]{}'))
                
                # Calculate relevance
                tag_match = self.jaccard_similarity(interest_tags, post_tags_set)
                keyword_match = self.jaccard_similarity(interest_tags, post_keywords)
                
                # Engagement score (normalized)
                engagement_score = min(1.0, (post[4] + post[5] * 2) / 50)  # likes + comments*2
                
                # Recency score
                days_old = (datetime.now() - post[6]).days
                recency_score = max(0.0, 1.0 - (days_old / 30))  # 30 days window
                
                relevance_score = (
                    0.40 * tag_match +
                    0.30 * keyword_match +
                    0.20 * engagement_score +
                    0.10 * recency_score
                )
                
                # Generate recommendation reason
                reason_parts = []
                if tag_match > 0.3:
                    common_tags = list(interest_tags.intersection(post_tags_set))
                    if common_tags:
                        reason_parts.append(f"Tagged: {', '.join(common_tags[:2])}")
                if post[4] >= 10:
                    reason_parts.append(f"{post[4]} likes")
                if post[5] >= 5:
                    reason_parts.append("Active discussion")
                if days_old <= 2:
                    reason_parts.append("Recent post")
                
                recommendation_reason = "; ".join(reason_parts) if reason_parts else "Trending in community"
                
                post_recommendations.append({
                    'post_id': post[0],
                    'title': post[1],
                    'content': post[2][:500] + "..." if len(post[2] or "") > 500 else post[2],  # Truncate long content
                    'author_name': post[7],
                    'tags': post_tags,
                    'likes_count': post[4],
                    'comments_count': post[5],
                    'relevance_score': relevance_score,
                    'recommendation_reason': recommendation_reason,
                    'created_at': post[6]
                })
            
            # Sort by relevance score
            post_recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            return post_recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error recommending posts: {str(e)}")
            raise
    
    async def recommend_alumni(
        self,
        db_conn,
        user_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Recommend alumni profiles based on shared interests and background
        """
        try:
            # Get user's profile and interests
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT skills, industry, location, batch_year
                    FROM alumni_profiles
                    WHERE user_id = %s
                """, (user_id,))
                user_profile = await cursor.fetchone()
            
            if not user_profile:
                return []
            
            user_skills = user_profile[0] if user_profile[0] else []
            user_industry = user_profile[1] or ""
            user_location = user_profile[2] or ""
            user_batch_year = user_profile[3]
            
            user_skills_set = set(self.normalize_string_list(user_skills))
            user_industry_lower = user_industry.lower().strip()
            user_location_lower = user_location.lower().strip()
            
            # Get other verified alumni
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        ap.user_id, ap.name, ap.photo_url, ap.headline,
                        ap.current_company, ap.current_role, ap.location,
                        ap.skills, ap.industry, ap.batch_year
                    FROM alumni_profiles ap
                    JOIN users u ON ap.user_id = u.id
                    WHERE ap.user_id != %s
                        AND u.is_active = TRUE
                        AND ap.is_verified = TRUE
                    ORDER BY ap.updated_at DESC
                    LIMIT 200
                """, (user_id,))
                alumni = await cursor.fetchall()
            
            # Calculate relevance scores
            alumni_recommendations = []
            for alum in alumni:
                alum_skills = alum[7] if alum[7] else []
                alum_industry = alum[8] or ""
                alum_location = alum[6] or ""
                alum_batch_year = alum[9]
                
                alum_skills_set = set(self.normalize_string_list(alum_skills))
                alum_industry_lower = alum_industry.lower().strip()
                alum_location_lower = alum_location.lower().strip()
                
                # Calculate similarity
                skill_similarity = self.jaccard_similarity(user_skills_set, alum_skills_set)
                industry_match = 1.0 if user_industry_lower == alum_industry_lower and user_industry_lower else 0.0
                location_match = 1.0 if user_location_lower == alum_location_lower and user_location_lower else 0.0
                
                # Batch proximity
                batch_similarity = 0.0
                if user_batch_year and alum_batch_year:
                    year_diff = abs(user_batch_year - alum_batch_year)
                    batch_similarity = max(0.0, 1.0 - (year_diff * 0.15))
                
                relevance_score = (
                    0.50 * skill_similarity +
                    0.25 * industry_match +
                    0.15 * location_match +
                    0.10 * batch_similarity
                )
                
                # Generate recommendation reason
                reason_parts = []
                common_skills = list(user_skills_set.intersection(alum_skills_set))
                if common_skills:
                    reason_parts.append(f"Shares skills: {', '.join(common_skills[:3])}")
                if industry_match > 0:
                    reason_parts.append(f"Works in {alum_industry}")
                if location_match > 0:
                    reason_parts.append(f"Based in {alum_location}")
                if batch_similarity >= 0.85:
                    reason_parts.append(f"Similar graduation year")
                
                recommendation_reason = "; ".join(reason_parts) if reason_parts else "Recommended alumni to connect"
                
                alumni_recommendations.append({
                    'user_id': alum[0],
                    'name': alum[1],
                    'photo_url': alum[2],
                    'headline': alum[3],
                    'current_company': alum[4],
                    'current_role': alum[5],
                    'location': alum[6],
                    'skills': alum_skills,
                    'relevance_score': relevance_score,
                    'recommendation_reason': recommendation_reason
                })
            
            # Sort by relevance score
            alumni_recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            # Filter out very low matches
            alumni_recommendations = [a for a in alumni_recommendations if a['relevance_score'] >= 0.15]
            
            return alumni_recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error recommending alumni: {str(e)}")
            raise


# Initialize service instance
recommendation_service = RecommendationService()
