"""
Celery Application Configuration
Background task processing for AlumUnity System
"""
from celery import Celery
from celery.schedules import crontab
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Celery app
# Support both redis:// and rediss:// (TLS) for cloud providers like Upstash
broker_url = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
backend_url = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

app = Celery(
    'alumunity',
    broker=broker_url,
    backend=backend_url,
    include=[
        'tasks.upload_tasks',
        'tasks.ai_tasks',
        'tasks.notification_tasks',
        'tasks.engagement_tasks',  # Phase 10.8: Enhanced engagement scoring
    ]
)

# Celery Configuration
app.conf.update(
    # Task Routing
    task_routes={
        'tasks.upload_tasks.*': {'queue': 'file_processing'},
        'tasks.ai_tasks.*': {'queue': 'ai_processing'},
        'tasks.notification_tasks.*': {'queue': 'default'},
        'tasks.engagement_tasks.*': {'queue': 'ai_processing'},  # Phase 10.8
    },
    
    # Serialization
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    
    # Timezone
    timezone='UTC',
    enable_utc=True,
    
    # Task Settings
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3300,  # 55 minutes soft limit
    
    # Result Backend Settings
    result_expires=86400,  # Results expire after 24 hours
    result_persistent=True,
    
    # Worker Settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    
    # Retry Settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Beat Schedule (Scheduled Tasks)
    beat_schedule={
        # Cleanup old notifications every day at 2 AM
        'cleanup-old-notifications': {
            'task': 'tasks.notification_tasks.cleanup_old_notifications',
            'schedule': crontab(hour=2, minute=0),
        },
        # Recalculate engagement scores daily at 3 AM (Phase 10.8: Enhanced with AI)
        'recalculate-engagement-scores': {
            'task': 'tasks.engagement_tasks.recalculate_all_engagement_scores',
            'schedule': crontab(hour=3, minute=0),
        },
        # Analyze engagement trends weekly on Monday at 5 AM
        'analyze-engagement-trends': {
            'task': 'tasks.engagement_tasks.analyze_engagement_trends',
            'schedule': crontab(hour=5, minute=0, day_of_week=1),
        },
        # Send engagement notifications weekly on Friday at 10 AM
        'send-engagement-notifications': {
            'task': 'tasks.engagement_tasks.send_engagement_notifications',
            'schedule': crontab(hour=10, minute=0, day_of_week=5),
        },
        # Update skill graph weekly on Sunday at 4 AM
        'update-skill-graph': {
            'task': 'tasks.ai_tasks.update_skill_graph',
            'schedule': crontab(hour=4, minute=0, day_of_week=0),
        },
        # Send event reminders 24 hours before
        'send-event-reminders': {
            'task': 'tasks.notification_tasks.send_event_reminders',
            'schedule': crontab(hour='*/6'),  # Every 6 hours
        },
    },
)

# SSL/TLS Configuration for Redis connections (required for Upstash and other cloud providers)
if broker_url.startswith('rediss://'):
    app.conf.broker_use_ssl = {
        'ssl_cert_reqs': None  # Disable SSL certificate verification for cloud providers
    }
if backend_url.startswith('rediss://'):
    app.conf.redis_backend_use_ssl = {
        'ssl_cert_reqs': None
    }

# Task classes for better organization
class TaskConfig:
    """Task configuration constants"""
    
    # Queue Names
    QUEUE_DEFAULT = 'default'
    QUEUE_AI_PROCESSING = 'ai_processing'
    QUEUE_FILE_PROCESSING = 'file_processing'
    
    # Task Priorities (1-10, higher is more urgent)
    PRIORITY_LOW = 3
    PRIORITY_NORMAL = 5
    PRIORITY_HIGH = 7
    PRIORITY_CRITICAL = 10
    
    # Retry Configuration
    MAX_RETRIES = 3
    RETRY_BACKOFF = True
    RETRY_BACKOFF_MAX = 600  # 10 minutes
    RETRY_JITTER = True


if __name__ == '__main__':
    app.start()
