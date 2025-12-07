"""
Engagement Service - Calculate and track user engagement scores
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class EngagementService:
    """Service for engagement scoring and leaderboard"""
    
    async def calculate_engagement_score(
        self,
        db_conn,
        user_id: str
    ) -> Dict:
        """
        Calculate engagement score for a user using stored procedure
        """
        try:
            # Call stored procedure to calculate engagement score
            async with db_conn.cursor() as cursor:
                await cursor.execute("CALL update_engagement_score(%s)", (user_id,))
                await db_conn.commit()
            
            # Fetch the updated engagement score
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, user_id, total_score, contributions,
                        rank_position, level, last_calculated
                    FROM engagement_scores
                    WHERE user_id = %s
                """, (user_id,))
                score = await cursor.fetchone()
            
            if score:
                return {
                    'id': score[0],
                    'user_id': score[1],
                    'total_score': score[2],
                    'contributions': score[3] if score[3] else {},
                    'rank_position': score[4],
                    'level': self._determine_level(score[2]) if not score[5] else score[5],
                    'last_calculated': score[6]
                }
            else:
                # Create initial engagement score
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        INSERT INTO engagement_scores 
                        (user_id, total_score, contributions, level, last_calculated)
                        VALUES (%s, 0, %s, 'Beginner', NOW())
                    """, (user_id, '{}'))
                    await db_conn.commit()
                
                return {
                    'user_id': user_id,
                    'total_score': 0,
                    'contributions': {},
                    'rank_position': None,
                    'level': 'Beginner',
                    'last_calculated': datetime.now()
                }
                
        except Exception as e:
            logger.error(f"Error calculating engagement score: {str(e)}")
            raise
    
    def _determine_level(self, score: int) -> str:
        """Determine user level based on total score"""
        if score >= 500:
            return "Legend"
        elif score >= 300:
            return "Veteran"
        elif score >= 100:
            return "Active"
        else:
            return "Beginner"
    
    async def get_user_score(
        self,
        db_conn,
        user_id: str
    ) -> Optional[Dict]:
        """Get engagement score for a specific user"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        es.id, es.user_id, es.total_score, es.contributions,
                        es.rank_position, es.level, es.last_calculated,
                        ap.name, ap.photo_url, u.role
                    FROM engagement_scores es
                    JOIN users u ON es.user_id = u.id
                    LEFT JOIN alumni_profiles ap ON es.user_id = ap.user_id
                    WHERE es.user_id = %s
                """, (user_id,))
                result = await cursor.fetchone()
            
            if result:
                return {
                    'id': result[0],
                    'user_id': result[1],
                    'total_score': result[2],
                    'contributions': result[3] if result[3] else {},
                    'rank_position': result[4],
                    'level': result[5] if result[5] else self._determine_level(result[2]),
                    'last_calculated': result[6],
                    'name': result[7],
                    'photo_url': result[8],
                    'role': result[9]
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user score: {str(e)}")
            raise
    
    async def get_leaderboard(
        self,
        db_conn,
        limit: int = 50,
        current_user_id: Optional[str] = None
    ) -> Dict:
        """
        Get engagement leaderboard
        """
        try:
            # Get top users from engagement_leaderboard view
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, name, photo_url, role, total_score,
                        rank_position, level, contributions
                    FROM engagement_leaderboard
                    ORDER BY total_score DESC
                    LIMIT %s
                """, (limit,))
                leaderboard = await cursor.fetchall()
            
            # Format leaderboard entries
            entries = []
            for entry in leaderboard:
                entries.append({
                    'user_id': entry[0],
                    'name': entry[1],
                    'photo_url': entry[2],
                    'role': entry[3],
                    'total_score': entry[4],
                    'rank_position': entry[5],
                    'level': entry[6] if entry[6] else self._determine_level(entry[4]),
                    'contributions': entry[7] if entry[7] else {}
                })
            
            # Get current user's rank if provided
            user_rank = None
            if current_user_id:
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT rank_position
                        FROM engagement_scores
                        WHERE user_id = %s
                    """, (current_user_id,))
                    rank_result = await cursor.fetchone()
                    if rank_result:
                        user_rank = rank_result[0]
            
            # Get total users count
            async with db_conn.cursor() as cursor:
                await cursor.execute("SELECT COUNT(*) FROM engagement_scores")
                total_result = await cursor.fetchone()
                total_users = total_result[0] if total_result else 0
            
            return {
                'entries': entries,
                'total_users': total_users,
                'user_rank': user_rank
            }
            
        except Exception as e:
            logger.error(f"Error getting leaderboard: {str(e)}")
            raise
    
    async def add_contribution(
        self,
        db_conn,
        user_id: str,
        contribution_type: str,
        points_earned: int,
        description: Optional[str] = None
    ) -> bool:
        """
        Add a contribution to user's history
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    INSERT INTO contribution_history 
                    (user_id, contribution_type, points_earned, description)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, contribution_type, points_earned, description))
                await db_conn.commit()
            
            # Recalculate engagement score
            await self.calculate_engagement_score(db_conn, user_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding contribution: {str(e)}")
            return False
    
    async def get_contribution_history(
        self,
        db_conn,
        user_id: str,
        limit: int = 50
    ) -> List[Dict]:
        """Get user's contribution history"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, user_id, contribution_type, points_earned,
                        description, created_at
                    FROM contribution_history
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (user_id, limit))
                contributions = await cursor.fetchall()
            
            return [
                {
                    'id': c[0],
                    'user_id': c[1],
                    'contribution_type': c[2],
                    'points_earned': c[3],
                    'description': c[4],
                    'created_at': c[5]
                }
                for c in contributions
            ]
            
        except Exception as e:
            logger.error(f"Error getting contribution history: {str(e)}")
            raise
    
    async def get_all_badges(self, db_conn) -> List[Dict]:
        """Get all available badges"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, name, description, icon_url, requirements,
                        rarity, points, created_at
                    FROM badges
                    ORDER BY 
                        CASE rarity
                            WHEN 'legendary' THEN 4
                            WHEN 'epic' THEN 3
                            WHEN 'rare' THEN 2
                            WHEN 'common' THEN 1
                        END DESC,
                        points DESC
                """)
                badges = await cursor.fetchall()
            
            return [
                {
                    'id': b[0],
                    'name': b[1],
                    'description': b[2],
                    'icon_url': b[3],
                    'requirements': b[4] if b[4] else {},
                    'rarity': b[5],
                    'points': b[6],
                    'created_at': b[7]
                }
                for b in badges
            ]
            
        except Exception as e:
            logger.error(f"Error getting badges: {str(e)}")
            raise
    
    async def get_user_badges(
        self,
        db_conn,
        user_id: str
    ) -> List[Dict]:
        """Get badges earned by user"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        ub.id, ub.user_id, ub.badge_id, ub.earned_at,
                        b.name, b.description, b.icon_url, b.rarity, b.points
                    FROM user_badges ub
                    JOIN badges b ON ub.badge_id = b.id
                    WHERE ub.user_id = %s
                    ORDER BY ub.earned_at DESC
                """, (user_id,))
                user_badges = await cursor.fetchall()
            
            return [
                {
                    'id': ub[0],
                    'user_id': ub[1],
                    'badge_id': ub[2],
                    'earned_at': ub[3],
                    'badge': {
                        'name': ub[4],
                        'description': ub[5],
                        'icon_url': ub[6],
                        'rarity': ub[7],
                        'points': ub[8]
                    }
                }
                for ub in user_badges
            ]
            
        except Exception as e:
            logger.error(f"Error getting user badges: {str(e)}")
            raise
    
    async def check_and_award_badges(
        self,
        db_conn,
        user_id: str
    ) -> List[str]:
        """
        Check if user qualifies for any badges and award them
        Returns list of newly awarded badge IDs
        """
        try:
            # Get all badges
            all_badges = await self.get_all_badges(db_conn)
            
            # Get user's current badges
            user_badges = await self.get_user_badges(db_conn, user_id)
            earned_badge_ids = [ub['badge_id'] for ub in user_badges]
            
            # Get user stats
            async with db_conn.cursor() as cursor:
                # Profile completion
                await cursor.execute("""
                    SELECT profile_completion_percentage
                    FROM alumni_profiles
                    WHERE user_id = %s
                """, (user_id,))
                profile_result = await cursor.fetchone()
                profile_completion = profile_result[0] if profile_result else 0
                
                # Login count (simplified - just check if logged in)
                login_count = 1  # Placeholder
                
                # Mentorship sessions
                await cursor.execute("""
                    SELECT COUNT(*)
                    FROM mentorship_sessions ms
                    JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
                    WHERE (mr.mentor_id = %s OR mr.student_id = %s)
                        AND ms.status = 'completed'
                """, (user_id, user_id))
                session_result = await cursor.fetchone()
                mentorship_sessions = session_result[0] if session_result else 0
                
                # Job applications
                await cursor.execute("""
                    SELECT COUNT(*)
                    FROM job_applications
                    WHERE applicant_id = %s
                """, (user_id,))
                app_result = await cursor.fetchone()
                job_applications = app_result[0] if app_result else 0
                
                # Forum posts
                await cursor.execute("""
                    SELECT COUNT(*)
                    FROM forum_posts
                    WHERE author_id = %s AND is_deleted = FALSE
                """, (user_id,))
                post_result = await cursor.fetchone()
                forum_posts = post_result[0] if post_result else 0
                
                # Events attended
                await cursor.execute("""
                    SELECT COUNT(*)
                    FROM event_rsvps
                    WHERE user_id = %s AND status = 'attending'
                """, (user_id,))
                event_result = await cursor.fetchone()
                events_attended = event_result[0] if event_result else 0
                
                # Knowledge capsules
                await cursor.execute("""
                    SELECT COUNT(*)
                    FROM knowledge_capsules
                    WHERE author_id = %s
                """, (user_id,))
                capsule_result = await cursor.fetchone()
                capsules_created = capsule_result[0] if capsule_result else 0
            
            # Check each badge requirement
            newly_awarded = []
            for badge in all_badges:
                if badge['id'] in earned_badge_ids:
                    continue  # Already has this badge
                
                requirements = badge['requirements'] if badge['requirements'] else {}
                req_type = requirements.get('type', '')
                req_count = requirements.get('count', 0)
                
                # Check if user meets requirements
                qualifies = False
                if req_type == 'login' and login_count >= req_count:
                    qualifies = True
                elif req_type == 'profile' and profile_completion >= requirements.get('completion', 100):
                    qualifies = True
                elif req_type == 'mentorship' and mentorship_sessions >= requirements.get('sessions', req_count):
                    qualifies = True
                elif req_type == 'job_applications' and job_applications >= req_count:
                    qualifies = True
                elif req_type == 'forum_posts' and forum_posts >= req_count:
                    qualifies = True
                elif req_type == 'events' and events_attended >= req_count:
                    qualifies = True
                elif req_type == 'capsules' and capsules_created >= req_count:
                    qualifies = True
                elif req_type == 'leaderboard':
                    # Check leaderboard rank
                    user_score = await self.get_user_score(db_conn, user_id)
                    if user_score and user_score.get('rank_position'):
                        if user_score['rank_position'] <= requirements.get('rank', 10):
                            qualifies = True
                
                # Award badge if qualifies
                if qualifies:
                    async with db_conn.cursor() as cursor:
                        await cursor.execute("""
                            INSERT INTO user_badges (user_id, badge_id)
                            VALUES (%s, %s)
                        """, (user_id, badge['id']))
                        await db_conn.commit()
                    
                    newly_awarded.append(badge['id'])
                    logger.info(f"Awarded badge {badge['name']} to user {user_id}")
            
            return newly_awarded
            
        except Exception as e:
            logger.error(f"Error checking and awarding badges: {str(e)}")
            return []


# Initialize service instance
engagement_service = EngagementService()
