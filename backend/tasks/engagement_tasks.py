"""
Engagement Scoring Tasks
Phase 10.8: Enhanced engagement scoring with AI-powered analysis
Background tasks for daily engagement score calculation and updates
"""
from celery_app import app, TaskConfig
import logging
import aiomysql
import asyncio
import os
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


def get_sync_db_connection():
    """Get synchronous database connection for Celery tasks"""
    return aiomysql.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        port=int(os.environ.get('DB_PORT', 3306)),
        user=os.environ.get('DB_USER', 'alumni_user'),
        password=os.environ.get('DB_PASSWORD', 'alumni_pass_123'),
        db=os.environ.get('DB_NAME', 'AlumUnity'),
        charset='utf8mb4',
        autocommit=False
    )


@app.task(
    name='tasks.engagement_tasks.update_single_user_engagement',
    queue=TaskConfig.QUEUE_AI_PROCESSING,
    bind=True,
    max_retries=3
)
def update_single_user_engagement(self, user_id: str) -> Dict[str, Any]:
    """
    Update engagement score for a single user
    
    Args:
        user_id: User ID to update
    
    Returns:
        Update results with score details
    """
    try:
        logger.info(f"Updating engagement score for user: {user_id}")
        
        async def _update():
            from database.connection import get_db_pool
            from services.engagement_service import engagement_service
            
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                # Calculate engagement score
                score = await engagement_service.calculate_engagement_score(conn, user_id)
                
                # Check and award badges
                new_badges = await engagement_service.check_and_award_badges(conn, user_id)
                
                return {
                    'status': 'completed',
                    'user_id': user_id,
                    'total_score': score.get('total_score', 0),
                    'base_score': score.get('base_score', 0),
                    'ai_boost': score.get('ai_boost', 0),
                    'level': score.get('level', 'Beginner'),
                    'rank_position': score.get('rank_position'),
                    'activity_pattern': score.get('activity_pattern', 'unknown'),
                    'new_badges_awarded': len(new_badges),
                    'timestamp': score.get('last_calculated')
                }
        
        # Run async function in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_update())
        loop.close()
        
        logger.info(f"Successfully updated engagement for user {user_id}: {result['total_score']} points")
        return result
        
    except Exception as e:
        logger.error(f"Error updating engagement for user {user_id}: {str(e)}")
        raise self.retry(exc=e, countdown=300)  # Retry after 5 minutes


@app.task(
    name='tasks.engagement_tasks.recalculate_all_engagement_scores',
    queue=TaskConfig.QUEUE_AI_PROCESSING,
    bind=True
)
def recalculate_all_engagement_scores(self) -> Dict[str, Any]:
    """
    Recalculate engagement scores for all active users (scheduled daily task)
    Phase 10.8: Enhanced with AI-powered activity pattern analysis
    
    This task runs daily at 3 AM (configured in celery_app.py beat_schedule)
    
    Returns:
        Processing results including counts and statistics
    """
    try:
        logger.info("=" * 80)
        logger.info("STARTING DAILY ENGAGEMENT SCORE RECALCULATION")
        logger.info("=" * 80)
        
        async def _recalculate_all():
            from database.connection import get_db_pool
            from services.engagement_service import engagement_service
            
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                # Get all active users
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT id, email, role
                        FROM users
                        WHERE is_active = TRUE
                        ORDER BY created_at DESC
                    """)
                    users = await cursor.fetchall()
                
                total_users = len(users)
                processed = 0
                errors = 0
                total_points_distributed = 0
                total_ai_boost = 0
                pattern_distribution = {}
                
                logger.info(f"Found {total_users} active users to process")
                
                # Process each user
                for user in users:
                    user_id = user[0]
                    try:
                        # Calculate engagement score
                        score = await engagement_service.calculate_engagement_score(conn, user_id)
                        
                        # Check and award badges
                        new_badges = await engagement_service.check_and_award_badges(conn, user_id)
                        
                        # Accumulate statistics
                        total_points_distributed += score.get('total_score', 0)
                        total_ai_boost += score.get('ai_boost', 0)
                        
                        pattern = score.get('activity_pattern', 'unknown')
                        pattern_distribution[pattern] = pattern_distribution.get(pattern, 0) + 1
                        
                        processed += 1
                        
                        if new_badges:
                            logger.info(f"User {user_id} earned {len(new_badges)} new badges!")
                        
                        # Log progress every 100 users
                        if processed % 100 == 0:
                            logger.info(f"Progress: {processed}/{total_users} users processed")
                    
                    except Exception as e:
                        logger.error(f"Error processing user {user_id}: {str(e)}")
                        errors += 1
                        continue
                
                # Update all rank positions after recalculation
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        SET @rank = 0;
                        UPDATE engagement_scores
                        SET rank_position = (@rank := @rank + 1)
                        ORDER BY total_score DESC;
                    """)
                    await conn.commit()
                
                logger.info("Rank positions updated successfully")
                
                return {
                    'status': 'completed',
                    'total_users': total_users,
                    'processed': processed,
                    'errors': errors,
                    'success_rate': round((processed / total_users * 100), 2) if total_users > 0 else 0,
                    'statistics': {
                        'total_points_distributed': total_points_distributed,
                        'total_ai_boost': total_ai_boost,
                        'avg_score': round(total_points_distributed / processed, 2) if processed > 0 else 0,
                        'avg_ai_boost': round(total_ai_boost / processed, 2) if processed > 0 else 0,
                        'pattern_distribution': pattern_distribution
                    }
                }
        
        # Run async function in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_recalculate_all())
        loop.close()
        
        logger.info("=" * 80)
        logger.info("ENGAGEMENT SCORE RECALCULATION COMPLETED")
        logger.info(f"Results: {result}")
        logger.info("=" * 80)
        
        return result
        
    except Exception as e:
        logger.error(f"Fatal error in engagement score recalculation: {str(e)}")
        raise self.retry(exc=e, countdown=3600)  # Retry after 1 hour


@app.task(
    name='tasks.engagement_tasks.analyze_engagement_trends',
    queue=TaskConfig.QUEUE_AI_PROCESSING
)
def analyze_engagement_trends() -> Dict[str, Any]:
    """
    Analyze platform-wide engagement trends
    Phase 10.8: AI-powered trend analysis
    
    Returns:
        Trend analysis results
    """
    try:
        logger.info("Analyzing engagement trends")
        
        async def _analyze_trends():
            from database.connection import get_db_pool
            
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                trends = {}
                
                # 1. Overall engagement growth
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT 
                            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as last_week,
                            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
                                      AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as prev_week,
                            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as last_month
                        FROM contribution_history
                    """)
                    growth = await cursor.fetchone()
                    
                    if growth:
                        last_week = growth[0] or 0
                        prev_week = growth[1] or 0
                        last_month = growth[2] or 0
                        
                        weekly_growth_rate = 0
                        if prev_week > 0:
                            weekly_growth_rate = round(((last_week - prev_week) / prev_week * 100), 2)
                        
                        trends['engagement_growth'] = {
                            'last_week_contributions': last_week,
                            'previous_week_contributions': prev_week,
                            'last_month_contributions': last_month,
                            'weekly_growth_rate_percent': weekly_growth_rate
                        }
                
                # 2. Top contributors
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT 
                            es.user_id,
                            ap.name,
                            es.total_score,
                            es.rank_position,
                            es.level
                        FROM engagement_scores es
                        LEFT JOIN alumni_profiles ap ON es.user_id = ap.user_id
                        ORDER BY es.total_score DESC
                        LIMIT 10
                    """)
                    top_contributors = await cursor.fetchall()
                    
                    trends['top_contributors'] = [
                        {
                            'user_id': tc[0],
                            'name': tc[1] or 'Unknown',
                            'score': tc[2],
                            'rank': tc[3],
                            'level': tc[4]
                        }
                        for tc in top_contributors
                    ]
                
                # 3. Activity pattern distribution
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT 
                            contribution_type,
                            COUNT(*) as count,
                            SUM(points_earned) as total_points
                        FROM contribution_history
                        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                        GROUP BY contribution_type
                        ORDER BY count DESC
                    """)
                    activity_types = await cursor.fetchall()
                    
                    trends['activity_distribution'] = [
                        {
                            'type': at[0],
                            'count': at[1],
                            'total_points': at[2]
                        }
                        for at in activity_types
                    ]
                
                # 4. Average scores by user role
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT 
                            u.role,
                            COUNT(*) as user_count,
                            AVG(es.total_score) as avg_score,
                            MAX(es.total_score) as max_score
                        FROM engagement_scores es
                        JOIN users u ON es.user_id = u.id
                        GROUP BY u.role
                        ORDER BY avg_score DESC
                    """)
                    role_stats = await cursor.fetchall()
                    
                    trends['engagement_by_role'] = [
                        {
                            'role': rs[0],
                            'user_count': rs[1],
                            'avg_score': round(float(rs[2] or 0), 2),
                            'max_score': rs[3]
                        }
                        for rs in role_stats
                    ]
                
                return trends
        
        # Run async function in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_analyze_trends())
        loop.close()
        
        logger.info(f"Engagement trends analysis completed: {result}")
        return {
            'status': 'completed',
            'trends': result
        }
        
    except Exception as e:
        logger.error(f"Error analyzing engagement trends: {str(e)}")
        raise


@app.task(
    name='tasks.engagement_tasks.send_engagement_notifications',
    queue=TaskConfig.QUEUE_DEFAULT
)
def send_engagement_notifications() -> Dict[str, Any]:
    """
    Send notifications for engagement milestones and achievements
    Phase 10.8: Motivational notifications based on engagement patterns
    
    Returns:
        Notification sending results
    """
    try:
        logger.info("Sending engagement notifications")
        
        async def _send_notifications():
            from database.connection import get_db_pool
            from services.notification_service import notification_service
            
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                notifications_sent = 0
                
                # Find users who need motivational notifications
                async with conn.cursor() as cursor:
                    # Users with declining pattern
                    await cursor.execute("""
                        SELECT DISTINCT ch.user_id
                        FROM contribution_history ch
                        WHERE ch.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
                            AND ch.user_id NOT IN (
                                SELECT user_id 
                                FROM contribution_history 
                                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                            )
                        LIMIT 50
                    """)
                    inactive_users = await cursor.fetchall()
                    
                    for user in inactive_users:
                        try:
                            await notification_service.create_notification(
                                conn,
                                user_id=user[0],
                                notification_type='system',
                                title='We miss you!',
                                message='It has been a while since your last activity. Come back and continue engaging with the community!',
                                priority='medium'
                            )
                            notifications_sent += 1
                        except Exception as e:
                            logger.error(f"Error sending notification to user {user[0]}: {str(e)}")
                
                return {
                    'status': 'completed',
                    'notifications_sent': notifications_sent
                }
        
        # Run async function in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_send_notifications())
        loop.close()
        
        logger.info(f"Engagement notifications sent: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error sending engagement notifications: {str(e)}")
        raise


@app.task(
    name='tasks.engagement_tasks.cleanup_old_contribution_history',
    queue=TaskConfig.QUEUE_DEFAULT
)
def cleanup_old_contribution_history(days: int = 365) -> Dict[str, Any]:
    """
    Clean up contribution history older than specified days
    Keep recent data for active analysis
    
    Args:
        days: Number of days to retain (default: 365)
    
    Returns:
        Cleanup results
    """
    try:
        logger.info(f"Cleaning up contribution history older than {days} days")
        
        async def _cleanup():
            from database.connection import get_db_pool
            
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        DELETE FROM contribution_history
                        WHERE created_at < DATE_SUB(NOW(), INTERVAL %s DAY)
                    """, (days,))
                    deleted_count = cursor.rowcount
                    await conn.commit()
                
                return {
                    'status': 'completed',
                    'records_deleted': deleted_count,
                    'retention_days': days
                }
        
        # Run async function in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_cleanup())
        loop.close()
        
        logger.info(f"Contribution history cleanup completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error cleaning up contribution history: {str(e)}")
        raise
