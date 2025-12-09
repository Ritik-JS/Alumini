"""
Knowledge Capsules Ranking Service
Implements AI-powered personalized capsule ranking algorithm
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import numpy as np
from database.connection import get_db_connection
from redis_client import get_redis_client

logger = logging.getLogger(__name__)


class CapsuleRankingService:
    """Service for calculating and managing knowledge capsule rankings"""
    
    def __init__(self):
        self.redis = get_redis_client()
        self.cache_ttl = 1800  # 30 minutes
        self.llm_enabled = self._check_llm_availability()
    
    def _check_llm_availability(self) -> bool:
        """Check if Emergent LLM Key is configured"""
        emergent_key = os.getenv('EMERGENT_LLM_KEY')
        return emergent_key is not None and emergent_key.strip() != ''
    
    async def calculate_skill_match_score(
        self, 
        user_skills: List[str], 
        capsule_tags: List[str]
    ) -> float:
        """
        Calculate Jaccard similarity between user skills and capsule tags
        Score weight: 30%
        """
        if not user_skills or not capsule_tags:
            return 0.0
        
        user_set = set([s.lower().strip() for s in user_skills])
        capsule_set = set([t.lower().strip() for t in capsule_tags])
        
        intersection = len(user_set & capsule_set)
        union = len(user_set | capsule_set)
        
        if union == 0:
            return 0.0
        
        jaccard_score = intersection / union
        return round(jaccard_score, 4)
    
    async def calculate_engagement_score(
        self, 
        capsule: Dict,
        max_views: int,
        max_likes: int,
        max_bookmarks: int
    ) -> float:
        """
        Calculate normalized engagement score
        Score weight: 25%
        Formula: 0.4 * views_norm + 0.35 * likes_norm + 0.25 * bookmarks_norm
        """
        views_count = capsule.get('views_count', 0)
        likes_count = capsule.get('likes_count', 0)
        bookmarks_count = capsule.get('bookmarks_count', 0)
        
        # Normalize (avoid division by zero)
        views_norm = views_count / max(max_views, 1)
        likes_norm = likes_count / max(max_likes, 1)
        bookmarks_norm = bookmarks_count / max(max_bookmarks, 1)
        
        engagement = (
            0.4 * views_norm + 
            0.35 * likes_norm + 
            0.25 * bookmarks_norm
        )
        
        return round(engagement, 4)
    
    async def calculate_credibility_score(self, author_id: str) -> float:
        """
        Calculate author credibility based on engagement score
        Score weight: 20%
        """
        async with get_db_connection() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT total_score 
                    FROM engagement_scores 
                    WHERE user_id = %s
                    """,
                    (author_id,)
                )
                result = await cursor.fetchone()
                
                if result:
                    # Normalize to 0-1 scale (assuming max score around 1000)
                    credibility = min(result[0] / 1000.0, 1.0)
                else:
                    # Default credibility for authors without engagement score
                    credibility = 0.5
                
                return round(credibility, 4)
    
    async def calculate_recency_score(self, created_at: datetime) -> float:
        """
        Calculate recency score with exponential decay
        Score weight: 15%
        Formula: e^(-0.01 * days_old)
        """
        days_old = (datetime.now() - created_at).days
        recency = np.exp(-0.01 * days_old)
        return round(recency, 4)
    
    async def calculate_llm_relevance(
        self, 
        user_profile: Dict, 
        capsule: Dict
    ) -> float:
        """
        Calculate content relevance using LLM (if available)
        or fallback to keyword-based scoring
        Score weight: 10%
        """
        if self.llm_enabled:
            try:
                return await self._calculate_llm_semantic_relevance(user_profile, capsule)
            except Exception as e:
                logger.warning(f"LLM relevance calculation failed: {e}. Falling back to keyword scoring.")
                return await self._calculate_keyword_relevance(user_profile, capsule)
        else:
            return await self._calculate_keyword_relevance(user_profile, capsule)
    
    async def _calculate_llm_semantic_relevance(
        self, 
        user_profile: Dict, 
        capsule: Dict
    ) -> float:
        """
        Use Emergent LLM Key for semantic relevance calculation
        """
        try:
            from openai import AsyncOpenAI
            
            client = AsyncOpenAI(api_key=os.getenv('EMERGENT_LLM_KEY'))
            
            # Prepare user context
            user_context = f"""
            User Profile:
            - Skills: {', '.join(user_profile.get('skills', []))}
            - Role: {user_profile.get('current_role', 'N/A')}
            - Industry: {user_profile.get('industry', 'N/A')}
            """
            
            # Prepare capsule context
            capsule_context = f"""
            Knowledge Capsule:
            - Title: {capsule.get('title', '')}
            - Category: {capsule.get('category', '')}
            - Tags: {', '.join(capsule.get('tags', []))}
            - Excerpt: {capsule.get('content', '')[:200]}...
            """
            
            prompt = f"""
            Analyze the relevance of this knowledge capsule to the user's profile.
            
            {user_context}
            
            {capsule_context}
            
            Rate the relevance on a scale of 0.0 to 1.0, where:
            - 1.0 = Highly relevant to user's skills and career
            - 0.5 = Moderately relevant
            - 0.0 = Not relevant
            
            Respond with ONLY a number between 0.0 and 1.0.
            """
            
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a career relevance analyzer. Return only a relevance score as a decimal number."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=10,
                temperature=0.3
            )
            
            # Extract score from response
            relevance_str = response.choices[0].message.content.strip()
            relevance = float(relevance_str)
            
            # Ensure score is in valid range
            relevance = max(0.0, min(1.0, relevance))
            
            return round(relevance, 4)
            
        except Exception as e:
            logger.error(f"LLM semantic relevance error: {e}")
            # Fallback to keyword scoring
            return await self._calculate_keyword_relevance(user_profile, capsule)
    
    async def _calculate_keyword_relevance(
        self, 
        user_profile: Dict, 
        capsule: Dict
    ) -> float:
        """
        Fallback keyword-based relevance calculation
        """
        # Extract keywords from user profile
        user_keywords = set()
        user_keywords.update([s.lower() for s in user_profile.get('skills', [])])
        
        if user_profile.get('current_role'):
            user_keywords.update(user_profile['current_role'].lower().split())
        
        if user_profile.get('industry'):
            user_keywords.update(user_profile['industry'].lower().split())
        
        # Extract keywords from capsule
        capsule_keywords = set()
        capsule_keywords.update([t.lower() for t in capsule.get('tags', [])])
        
        if capsule.get('title'):
            capsule_keywords.update(capsule['title'].lower().split())
        
        if capsule.get('category'):
            capsule_keywords.update(capsule['category'].lower().split())
        
        # Calculate keyword overlap
        if not user_keywords or not capsule_keywords:
            return 0.5  # Default moderate relevance
        
        intersection = len(user_keywords & capsule_keywords)
        union = len(user_keywords | capsule_keywords)
        
        if union == 0:
            return 0.5
        
        relevance = intersection / union
        return round(relevance, 4)
    
    async def calculate_capsule_rank(
        self, 
        user_id: str, 
        capsule_id: str
    ) -> Tuple[float, Dict]:
        """
        Calculate personalized rank score for a single capsule
        Returns: (final_score, score_breakdown)
        """
        async with get_db_connection() as conn:
            async with conn.cursor() as cursor:
                # Get user profile
                await cursor.execute(
                    """
                    SELECT ap.skills, ap.current_role, ap.industry
                    FROM alumni_profiles ap
                    WHERE ap.user_id = %s
                    """,
                    (user_id,)
                )
                user_row = await cursor.fetchone()
                
                if not user_row:
                    raise ValueError(f"User profile not found for user_id: {user_id}")
                
                user_profile = {
                    'skills': json.loads(user_row[0]) if user_row[0] else [],
                    'current_role': user_row[1],
                    'industry': user_row[2]
                }
                
                # Get capsule details
                await cursor.execute(
                    """
                    SELECT id, title, content, author_id, category, tags, 
                           views_count, likes_count, bookmarks_count, created_at
                    FROM knowledge_capsules
                    WHERE id = %s AND is_featured >= 0
                    """,
                    (capsule_id,)
                )
                capsule_row = await cursor.fetchone()
                
                if not capsule_row:
                    raise ValueError(f"Capsule not found for capsule_id: {capsule_id}")
                
                capsule = {
                    'id': capsule_row[0],
                    'title': capsule_row[1],
                    'content': capsule_row[2],
                    'author_id': capsule_row[3],
                    'category': capsule_row[4],
                    'tags': json.loads(capsule_row[5]) if capsule_row[5] else [],
                    'views_count': capsule_row[6],
                    'likes_count': capsule_row[7],
                    'bookmarks_count': capsule_row[8],
                    'created_at': capsule_row[9]
                }
                
                # Get max values for normalization
                await cursor.execute(
                    """
                    SELECT 
                        MAX(views_count) as max_views,
                        MAX(likes_count) as max_likes,
                        MAX(bookmarks_count) as max_bookmarks
                    FROM knowledge_capsules
                    """
                )
                max_row = await cursor.fetchone()
                max_views = max_row[0] or 1
                max_likes = max_row[1] or 1
                max_bookmarks = max_row[2] or 1
                
                # Calculate component scores
                skill_match = await self.calculate_skill_match_score(
                    user_profile['skills'], 
                    capsule['tags']
                )
                
                engagement = await self.calculate_engagement_score(
                    capsule, 
                    max_views, 
                    max_likes, 
                    max_bookmarks
                )
                
                credibility = await self.calculate_credibility_score(capsule['author_id'])
                
                recency = await self.calculate_recency_score(capsule['created_at'])
                
                relevance = await self.calculate_llm_relevance(user_profile, capsule)
                
                # Calculate final weighted score
                final_score = (
                    0.30 * skill_match +
                    0.25 * engagement +
                    0.20 * credibility +
                    0.15 * recency +
                    0.10 * relevance
                )
                
                final_score = round(final_score, 4)
                
                score_breakdown = {
                    'skill_match_score': skill_match,
                    'engagement_score': engagement,
                    'credibility_score': credibility,
                    'recency_score': recency,
                    'relevance_score': relevance,
                    'final_rank_score': final_score
                }
                
                # Store ranking in database
                await cursor.execute(
                    """
                    INSERT INTO capsule_rankings 
                    (capsule_id, user_id, relevance_score, engagement_score, 
                     skill_match_score, credibility_score, final_rank_score, 
                     ranking_factors, calculated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        relevance_score = VALUES(relevance_score),
                        engagement_score = VALUES(engagement_score),
                        skill_match_score = VALUES(skill_match_score),
                        credibility_score = VALUES(credibility_score),
                        final_rank_score = VALUES(final_rank_score),
                        ranking_factors = VALUES(ranking_factors),
                        calculated_at = VALUES(calculated_at)
                    """,
                    (
                        capsule_id,
                        user_id,
                        relevance,
                        engagement,
                        skill_match,
                        credibility,
                        final_score,
                        json.dumps(score_breakdown),
                        datetime.now()
                    )
                )
                await conn.commit()
                
                return final_score, score_breakdown
    
    async def get_ranked_capsules_for_user(
        self, 
        user_id: str, 
        limit: int = 20,
        force_refresh: bool = False
    ) -> List[Dict]:
        """
        Get top ranked capsules for a user with caching
        """
        cache_key = f"capsules:ranked:{user_id}"
        
        # Try cache first (unless force refresh)
        if not force_refresh and self.redis:
            try:
                cached_data = self.redis.get(cache_key)
                if cached_data:
                    logger.info(f"Cache HIT for ranked capsules: {user_id}")
                    return json.loads(cached_data)
            except Exception as e:
                logger.warning(f"Redis cache read error: {e}")
        
        # Cache miss - calculate from database
        logger.info(f"Cache MISS for ranked capsules: {user_id} - Computing...")
        
        async with get_db_connection() as conn:
            async with conn.cursor() as cursor:
                # Get all capsules
                await cursor.execute(
                    """
                    SELECT id, title, content, author_id, category, tags,
                           views_count, likes_count, bookmarks_count, created_at
                    FROM knowledge_capsules
                    WHERE is_featured >= 0
                    ORDER BY created_at DESC
                    LIMIT 100
                    """
                )
                capsules = await cursor.fetchall()
                
                if not capsules:
                    return []
                
                # Calculate rankings for all capsules
                ranked_results = []
                
                for capsule_row in capsules:
                    capsule_id = capsule_row[0]
                    
                    try:
                        final_score, breakdown = await self.calculate_capsule_rank(
                            user_id, 
                            capsule_id
                        )
                        
                        # Get author info
                        await cursor.execute(
                            """
                            SELECT ap.name, ap.photo_url, ap.current_role, ap.current_company
                            FROM alumni_profiles ap
                            WHERE ap.user_id = %s
                            """,
                            (capsule_row[3],)
                        )
                        author_row = await cursor.fetchone()
                        
                        author_info = {
                            'name': author_row[0] if author_row else 'Unknown',
                            'photo_url': author_row[1] if author_row else None,
                            'role': author_row[2] if author_row else None,
                            'company': author_row[3] if author_row else None
                        }
                        
                        ranked_results.append({
                            'capsule_id': capsule_id,
                            'title': capsule_row[1],
                            'category': capsule_row[4],
                            'tags': json.loads(capsule_row[5]) if capsule_row[5] else [],
                            'views_count': capsule_row[6],
                            'likes_count': capsule_row[7],
                            'bookmarks_count': capsule_row[8],
                            'created_at': capsule_row[9].isoformat() if capsule_row[9] else None,
                            'author': author_info,
                            'rank_score': final_score,
                            'match_reason': self._generate_match_reason(breakdown),
                            'score_breakdown': breakdown
                        })
                    except Exception as e:
                        logger.error(f"Error ranking capsule {capsule_id}: {e}")
                        continue
                
                # Sort by rank score (descending)
                ranked_results.sort(key=lambda x: x['rank_score'], reverse=True)
                
                # Limit results
                top_ranked = ranked_results[:limit]
                
                # Cache results
                if self.redis:
                    try:
                        self.redis.setex(
                            cache_key,
                            self.cache_ttl,
                            json.dumps(top_ranked, default=str)
                        )
                        logger.info(f"Cached ranked capsules for user: {user_id}")
                    except Exception as e:
                        logger.warning(f"Redis cache write error: {e}")
                
                return top_ranked
    
    def _generate_match_reason(self, breakdown: Dict) -> str:
        """Generate human-readable match reason"""
        reasons = []
        
        if breakdown['skill_match_score'] > 0.7:
            reasons.append("High skill match")
        elif breakdown['skill_match_score'] > 0.4:
            reasons.append("Moderate skill match")
        
        if breakdown['engagement_score'] > 0.7:
            reasons.append("Highly engaging content")
        
        if breakdown['credibility_score'] > 0.7:
            reasons.append("Trusted author")
        
        if breakdown['recency_score'] > 0.8:
            reasons.append("Recent content")
        
        if breakdown['relevance_score'] > 0.7:
            reasons.append("Highly relevant to your profile")
        
        if not reasons:
            reasons.append("Recommended for you")
        
        return ", ".join(reasons)
    
    async def batch_calculate_rankings(
        self, 
        user_id: str, 
        capsule_ids: List[str]
    ) -> Dict[str, float]:
        """
        Calculate rankings for multiple capsules in batch
        Returns: {capsule_id: rank_score}
        """
        rankings = {}
        
        for capsule_id in capsule_ids:
            try:
                score, _ = await self.calculate_capsule_rank(user_id, capsule_id)
                rankings[capsule_id] = score
            except Exception as e:
                logger.error(f"Error ranking capsule {capsule_id}: {e}")
                rankings[capsule_id] = 0.0
        
        return rankings
    
    async def refresh_all_rankings(self, user_id: Optional[str] = None) -> Dict:
        """
        Refresh rankings for all users or a specific user
        This is a manual refresh endpoint (no Celery)
        """
        async with get_db_connection() as conn:
            async with conn.cursor() as cursor:
                if user_id:
                    # Refresh for specific user
                    user_ids = [user_id]
                else:
                    # Refresh for all active users
                    await cursor.execute(
                        """
                        SELECT id FROM users 
                        WHERE is_active = TRUE AND role IN ('student', 'alumni')
                        LIMIT 1000
                        """
                    )
                    user_rows = await cursor.fetchall()
                    user_ids = [row[0] for row in user_rows]
                
                total_users = len(user_ids)
                processed = 0
                errors = 0
                
                for uid in user_ids:
                    try:
                        # Clear cache
                        cache_key = f"capsules:ranked:{uid}"
                        if self.redis:
                            self.redis.delete(cache_key)
                        
                        # Recalculate rankings
                        await self.get_ranked_capsules_for_user(uid, force_refresh=True)
                        processed += 1
                    except Exception as e:
                        logger.error(f"Error refreshing rankings for user {uid}: {e}")
                        errors += 1
                
                return {
                    'total_users': total_users,
                    'processed': processed,
                    'errors': errors,
                    'success_rate': round(processed / max(total_users, 1) * 100, 2)
                }
    
    async def clear_user_cache(self, user_id: str):
        """Clear cached rankings for a specific user"""
        cache_key = f"capsules:ranked:{user_id}"
        if self.redis:
            try:
                self.redis.delete(cache_key)
                logger.info(f"Cleared cache for user: {user_id}")
            except Exception as e:
                logger.warning(f"Error clearing cache: {e}")


# Singleton instance
_ranking_service = None

def get_ranking_service() -> CapsuleRankingService:
    """Get singleton instance of ranking service"""
    global _ranking_service
    if _ranking_service is None:
        _ranking_service = CapsuleRankingService()
    return _ranking_service
