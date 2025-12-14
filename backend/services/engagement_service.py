"""
Engagement Service - Calculate and track user engagement scores with AI-powered analysis
Phase 10.8: Enhanced Engagement Scoring
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)


class EngagementService:
    """Service for engagement scoring and leaderboard with AI-powered enhancements"""
    
    async def calculate_engagement_score(
        self,
        db_conn,
        user_id: str
    ) -> Dict:
        """
        Calculate engagement score for a user using stored procedure
        Enhanced with AI-powered activity pattern analysis
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
                # Enhanced: Apply AI-powered activity pattern analysis
                ai_boost = await self._calculate_ai_activity_boost(db_conn, user_id)
                
                # Parse contributions JSON if it's a string (MySQL stores JSON as string)
                contributions_data = score[3]
                if contributions_data and isinstance(contributions_data, str):
                    try:
                        contributions_data = json.loads(contributions_data)
                    except json.JSONDecodeError:
                        contributions_data = {}
                elif not contributions_data:
                    contributions_data = {}
                
                return {
                    'id': score[0],
                    'user_id': score[1],
                    'total_score': score[2] + ai_boost,  # Apply AI boost
                    'base_score': score[2],
                    'ai_boost': ai_boost,
                    'contributions': contributions_data,
                    'rank_position': score[4],
                    'level': self._determine_level(score[2] + ai_boost) if not score[5] else score[5],
                    'last_calculated': score[6],
                    'activity_pattern': await self._analyze_activity_pattern(db_conn, user_id)
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
                    'base_score': 0,
                    'ai_boost': 0,
                    'contributions': {},
                    'rank_position': None,
                    'level': 'Beginner',
                    'last_calculated': datetime.now(),
                    'activity_pattern': 'new_user'
                }
                
        except Exception as e:
            logger.error(f"Error calculating engagement score: {str(e)}")
            raise
    
    async def _calculate_ai_activity_boost(
        self,
        db_conn,
        user_id: str
    ) -> int:
        """
        AI-powered activity pattern analysis for bonus points
        Phase 10.8: Enhanced scoring with predictive analysis
        
        Analyzes:
        - Consistency of activity (daily/weekly patterns)
        - Quality of contributions (engagement received)
        - Recent activity trend (increasing/decreasing)
        - Time investment patterns
        """
        try:
            boost_points = 0
            
            # 1. Consistency Bonus: Reward regular activity
            async with db_conn.cursor() as cursor:
                # Check activity in last 30 days
                await cursor.execute("""
                    SELECT DATE(created_at) as activity_date, COUNT(*) as count
                    FROM contribution_history
                    WHERE user_id = %s
                        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY DATE(created_at)
                """, (user_id,))
                daily_activities = await cursor.fetchall()
                
                # Calculate consistency score
                if len(daily_activities) >= 20:  # Active 20+ days in last month
                    boost_points += 50  # High consistency bonus
                elif len(daily_activities) >= 10:  # Active 10-19 days
                    boost_points += 25  # Medium consistency bonus
                elif len(daily_activities) >= 5:  # Active 5-9 days
                    boost_points += 10  # Basic consistency bonus
            
            # 2. Quality Bonus: Reward high-engagement contributions
            async with db_conn.cursor() as cursor:
                # Check forum post engagement
                await cursor.execute("""
                    SELECT AVG(likes_count) as avg_likes, AVG(comments_count) as avg_comments
                    FROM forum_posts
                    WHERE author_id = %s
                        AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
                        AND is_deleted = FALSE
                """, (user_id,))
                post_engagement = await cursor.fetchone()
                
                if post_engagement and post_engagement[0]:
                    avg_likes = float(post_engagement[0] or 0)
                    avg_comments = float(post_engagement[1] or 0)
                    
                    # High-quality content bonus
                    if avg_likes >= 10 and avg_comments >= 5:
                        boost_points += 40  # Highly engaging content
                    elif avg_likes >= 5 or avg_comments >= 3:
                        boost_points += 20  # Good engagement
            
            # 3. Trend Bonus: Reward increasing activity
            async with db_conn.cursor() as cursor:
                # Compare last 7 days vs previous 7 days
                await cursor.execute("""
                    SELECT 
                        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent,
                        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
                                  AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as previous
                    FROM contribution_history
                    WHERE user_id = %s
                        AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
                """, (user_id,))
                trend = await cursor.fetchone()
                
                if trend:
                    recent_activity = trend[0] or 0
                    previous_activity = trend[1] or 0
                    
                    # Increasing trend bonus
                    if recent_activity > previous_activity and previous_activity > 0:
                        growth_rate = (recent_activity - previous_activity) / previous_activity
                        if growth_rate >= 0.5:  # 50%+ growth
                            boost_points += 30  # Strong growth
                        elif growth_rate >= 0.2:  # 20%+ growth
                            boost_points += 15  # Moderate growth
            
            # 4. Mentorship Impact Bonus
            async with db_conn.cursor() as cursor:
                # Check mentor rating and completed sessions
                await cursor.execute("""
                    SELECT mp.rating, mp.total_sessions
                    FROM mentor_profiles mp
                    WHERE mp.user_id = %s
                """, (user_id,))
                mentor_stats = await cursor.fetchone()
                
                if mentor_stats and mentor_stats[0]:
                    rating = float(mentor_stats[0] or 0)
                    sessions = int(mentor_stats[1] or 0)
                    
                    # High-impact mentorship bonus
                    if rating >= 4.5 and sessions >= 5:
                        boost_points += 35  # Excellent mentor
                    elif rating >= 4.0 and sessions >= 3:
                        boost_points += 20  # Good mentor
            
            # 5. Diversity Bonus: Reward activity across different areas
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT COUNT(DISTINCT contribution_type) as diversity
                    FROM contribution_history
                    WHERE user_id = %s
                        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                """, (user_id,))
                diversity_result = await cursor.fetchone()
                
                if diversity_result:
                    diversity_count = diversity_result[0] or 0
                    if diversity_count >= 5:  # Active in 5+ areas
                        boost_points += 25  # Well-rounded contributor
                    elif diversity_count >= 3:  # Active in 3-4 areas
                        boost_points += 12  # Good diversity
            
            logger.info(f"AI boost calculated for user {user_id}: +{boost_points} points")
            return boost_points
            
        except Exception as e:
            logger.error(f"Error calculating AI activity boost: {str(e)}")
            return 0  # Return 0 on error, don't fail the main calculation
    
    async def _analyze_activity_pattern(
        self,
        db_conn,
        user_id: str
    ) -> str:
        """
        Analyze and classify user's activity pattern
        Returns: 'consistent', 'growing', 'declining', 'sporadic', 'new_user', 'inactive'
        """
        try:
            async with db_conn.cursor() as cursor:
                # Get activity distribution over last 60 days
                await cursor.execute("""
                    SELECT 
                        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week1,
                        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
                                  AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week2,
                        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                                  AND created_at < DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1 ELSE 0 END) as weeks3_4,
                        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) 
                                  AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as older,
                        COUNT(*) as total
                    FROM contribution_history
                    WHERE user_id = %s
                        AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
                """, (user_id,))
                pattern = await cursor.fetchone()
            
            if not pattern or pattern[4] == 0:
                return 'new_user'
            
            week1, week2, weeks3_4, older, total = pattern
            
            # No activity in last 30 days
            if week1 == 0 and week2 == 0 and weeks3_4 == 0:
                return 'inactive'
            
            # New user with limited history
            if total < 5:
                return 'new_user'
            
            # Consistent activity (evenly distributed)
            if week1 > 0 and week2 > 0 and weeks3_4 > 0:
                variance = max(week1, week2, weeks3_4 // 2) - min(week1, week2, weeks3_4 // 2)
                if variance < 3:
                    return 'consistent'
            
            # Growing pattern (increasing activity)
            if week1 > week2 and week2 >= weeks3_4 // 2:
                return 'growing'
            
            # Declining pattern (decreasing activity)
            if week1 < week2 and week2 > weeks3_4 // 2:
                return 'declining'
            
            # Sporadic activity
            return 'sporadic'
            
        except Exception as e:
            logger.error(f"Error analyzing activity pattern: {str(e)}")
            return 'unknown'
    
    async def predict_future_engagement(
        self,
        db_conn,
        user_id: str
    ) -> Dict:
        """
        Predictive engagement scoring - forecast user's future activity
        Phase 10.8: AI-powered prediction
        """
        try:
            # Get current pattern
            pattern = await self._analyze_activity_pattern(db_conn, user_id)
            
            # Get current score
            current_score = await self.get_user_score(db_conn, user_id)
            if not current_score:
                return {
                    'predicted_score_30d': 0,
                    'predicted_level': 'Beginner',
                    'confidence': 'low',
                    'recommendation': 'Start engaging with the platform'
                }
            
            score = current_score['total_score']
            
            # Prediction logic based on pattern
            predictions = {
                'consistent': {
                    'growth_rate': 1.2,  # 20% growth
                    'confidence': 'high',
                    'recommendation': 'Maintain your excellent engagement!'
                },
                'growing': {
                    'growth_rate': 1.5,  # 50% growth
                    'confidence': 'high',
                    'recommendation': 'Keep up the momentum!'
                },
                'declining': {
                    'growth_rate': 0.8,  # 20% decline
                    'confidence': 'medium',
                    'recommendation': 'Try to increase your activity frequency'
                },
                'sporadic': {
                    'growth_rate': 1.0,  # No change
                    'confidence': 'low',
                    'recommendation': 'Establish a consistent engagement routine'
                },
                'inactive': {
                    'growth_rate': 0.5,  # 50% decline
                    'confidence': 'high',
                    'recommendation': 'Re-engage with the community to maintain your score'
                },
                'new_user': {
                    'growth_rate': 2.0,  # 100% growth (typical for new users)
                    'confidence': 'low',
                    'recommendation': 'Complete your profile and start contributing'
                }
            }
            
            pred = predictions.get(pattern, predictions['sporadic'])
            predicted_score = int(score * pred['growth_rate'])
            predicted_level = self._determine_level(predicted_score)
            
            return {
                'current_score': score,
                'current_level': current_score['level'],
                'current_pattern': pattern,
                'predicted_score_30d': predicted_score,
                'predicted_level': predicted_level,
                'confidence': pred['confidence'],
                'recommendation': pred['recommendation']
            }
            
        except Exception as e:
            logger.error(f"Error predicting future engagement: {str(e)}")
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

    def _parse_requirements(self, requirements_data) -> Dict:
        """Parse requirements JSON string from database"""
        if requirements_data and isinstance(requirements_data, str):
            try:
                return json.loads(requirements_data)
            except json.JSONDecodeError:
                return {}
        elif not requirements_data:
            return {}
        else:
            return requirements_data
    

    async def _calculate_period_points(
        self,
        db_conn,
        user_id: str,
        days: int
    ) -> int:
        """Calculate points earned in the last N days"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT COALESCE(SUM(points_earned), 0) as total
                    FROM contribution_history
                    WHERE user_id = %s
                        AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                """, (user_id, days))
                result = await cursor.fetchone()
                return int(result[0]) if result else 0
        except Exception as e:
            logger.error(f"Error calculating period points: {str(e)}")
            return 0
    
    async def _get_user_badge_names(
        self,
        db_conn,
        user_id: str
    ) -> List[str]:
        """Get list of badge names for a user"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT b.name
                    FROM user_badges ub
                    JOIN badges b ON ub.badge_id = b.id
                    WHERE ub.user_id = %s
                    ORDER BY ub.earned_at DESC
                """, (user_id,))
                badges = await cursor.fetchall()
                return [badge[0] for badge in badges]
        except Exception as e:
            logger.error(f"Error getting user badge names: {str(e)}")
            return []

    async def _calculate_trend(
        self,
        db_conn,
        user_id: str
    ) -> str:
        """
        Calculate user's activity trend (up, down, stable)
        Compares last 7 days vs previous 7 days
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                                          THEN points_earned ELSE 0 END), 0) as last_week,
                        COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
                                          AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
                                          THEN points_earned ELSE 0 END), 0) as previous_week
                    FROM contribution_history
                    WHERE user_id = %s
                        AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
                """, (user_id,))
                result = await cursor.fetchone()
                
                if result:
                    last_week = result[0] or 0
                    previous_week = result[1] or 0
                    
                    if last_week > previous_week * 1.1:  # 10% increase
                        return 'up'
                    elif last_week < previous_week * 0.9:  # 10% decrease
                        return 'down'
                    else:
                        return 'stable'
                
                return 'stable'
        except Exception as e:
            logger.error(f"Error calculating trend: {str(e)}")
            return 'stable'

            logger.error(f"Error getting user badge names: {str(e)}")
            return []

    async def get_user_score(
        self,
        db_conn,
        user_id: str
    ) -> Optional[Dict]:
        """Get engagement score for a specific user with enhanced fields"""
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
                # Parse contributions JSON if it's a string (MySQL stores JSON as string)
                contributions_data = result[3]
                if contributions_data and isinstance(contributions_data, str):
                    try:
                        contributions_data = json.loads(contributions_data)
                    except json.JSONDecodeError:
                        contributions_data = {}
                elif not contributions_data:
                    contributions_data = {}
                
                # Calculate weekly and monthly points from contribution_history
                this_week_points = await self._calculate_period_points(db_conn, user_id, 7)
                this_month_points = await self._calculate_period_points(db_conn, user_id, 30)
                
                # Get user badges
                user_badges = await self._get_user_badge_names(db_conn, user_id)
                
                return {
                    'id': result[0],
                    'user_id': result[1],
                    'total_score': result[2],
                    'contributions': contributions_data,
                    'score_breakdown': contributions_data,  # Alias for frontend compatibility
                    'rank_position': result[4],
                    'rank': result[4],  # Alias for frontend compatibility
                    'level': result[5] if result[5] else self._determine_level(result[2]),
                    'last_calculated': result[6],
                    'name': result[7],
                    'photo_url': result[8],
                    'role': result[9],
                    'this_week_points': this_week_points,
                    'this_month_points': this_month_points,
                    'badges': user_badges
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user score: {str(e)}")
            raise
    
    async def get_leaderboard(
        self,
        db_conn,
        limit: int = 50,
        current_user_id: Optional[str] = None,
        role_filter: Optional[str] = None
    ) -> Dict:
        """
        Get engagement leaderboard with enhanced fields
        """
        try:
            # Get top users from engagement_leaderboard view
            async with db_conn.cursor() as cursor:
                query = """
                    SELECT 
                        id, name, photo_url, role, total_score,
                        rank_position, level, contributions
                    FROM engagement_leaderboard
                """
                params = []
                
                # Add role filter if provided
                if role_filter and role_filter != 'all':
                    query += " WHERE role = %s"
                    params.append(role_filter)
                
                query += " ORDER BY total_score DESC LIMIT %s"
                params.append(limit)
                
                await cursor.execute(query, tuple(params))
                leaderboard = await cursor.fetchall()
            
            # Format leaderboard entries
            entries = []
            for idx, entry in enumerate(leaderboard):
                user_id = entry[0]
                
                # Parse contributions JSON if it's a string (MySQL stores JSON as string)
                contributions_data = entry[7]
                if contributions_data and isinstance(contributions_data, str):
                    try:
                        contributions_data = json.loads(contributions_data)
                    except json.JSONDecodeError:
                        contributions_data = {}
                elif not contributions_data:
                    contributions_data = {}
                
                # Get user badges
                user_badges = await self._get_user_badge_names(db_conn, user_id)
                
                # Calculate trend (compare last week vs previous week)
                trend = await self._calculate_trend(db_conn, user_id)
                
                entries.append({
                    'user_id': user_id,
                    'name': entry[1],
                    'photo_url': entry[2],
                    'role': entry[3],
                    'total_score': entry[4],
                    'rank_position': entry[5],
                    'rank': entry[5],  # Alias for frontend compatibility
                    'level': entry[6] if entry[6] else self._determine_level(entry[4]),
                    'contributions': contributions_data,
                    'badges': user_badges,
                    'trend': trend
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
        """Get all available badges with unlocked count"""
        try:
            async with db_conn.cursor() as cursor:
                # Get badges with count of users who have unlocked each badge
                await cursor.execute("""
                    SELECT 
                        b.id, b.name, b.description, b.icon_url, b.requirements,
                        b.rarity, b.points, b.created_at,
                        COUNT(DISTINCT ub.user_id) as unlocked_by
                    FROM badges b
                    LEFT JOIN user_badges ub ON b.id = ub.badge_id
                    GROUP BY b.id, b.name, b.description, b.icon_url, b.requirements,
                             b.rarity, b.points, b.created_at
                    ORDER BY 
                        CASE b.rarity
                            WHEN 'legendary' THEN 4
                            WHEN 'epic' THEN 3
                            WHEN 'rare' THEN 2
                            WHEN 'common' THEN 1
                        END DESC,
                        b.points DESC
                """)
                badges = await cursor.fetchall()
            
            result = []
            for b in badges:
                requirements = self._parse_requirements(b[4])
                
                # Generate human-readable requirement string
                requirement_str = self._format_requirement_string(requirements)
                
                result.append({
                    'id': b[0],
                    'name': b[1],
                    'description': b[2],
                    'icon_url': b[3],
                    'requirements': requirements,
                    'requirement': requirement_str,  # Add singular string version
                    'rarity': b[5],
                    'points': b[6],
                    'created_at': b[7],
                    'unlocked_by': b[8] or 0  # Count of users who unlocked this badge
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting badges: {str(e)}")
            raise
    
    def _format_requirement_string(self, requirements: Dict) -> str:
        """Convert requirements dict to human-readable string"""
        if not requirements or not isinstance(requirements, dict):
            return "Complete specific actions"
        
        req_type = requirements.get('type', '')
        count = requirements.get('count', 1)
        
        if req_type == 'login':
            return f"Login {count} time(s)"
        elif req_type == 'profile':
            completion = requirements.get('completion', 100)
            return f"Complete {completion}% of profile"
        elif req_type == 'mentorship':
            sessions = requirements.get('sessions', count)
            return f"Complete {sessions} mentorship session(s)"
        elif req_type == 'job_applications':
            return f"Apply to {count} job(s)"
        elif req_type == 'forum_posts':
            return f"Create {count} forum post(s)"
        elif req_type == 'events':
            return f"Attend {count} event(s)"
        elif req_type == 'capsules':
            return f"Create {count} knowledge capsule(s)"
        elif req_type == 'leaderboard':
            rank = requirements.get('rank', 10)
            return f"Reach top {rank} on leaderboard"
        else:
            return "Complete specific actions"
    
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
