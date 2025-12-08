# Phase 10.1: Infrastructure Setup - Complete Guide

## Overview
This document outlines the infrastructure setup for AlumUnity's AI systems integration (Phase 10.1).

## Components Implemented

### 1. Redis Configuration ✅
- **File**: `redis_client.py`
- **Features**:
  - Async Redis client with connection pooling
  - Caching utilities (set, get, delete, exists, increment)
  - Leaderboard management (sorted sets)
  - Queue management (FIFO)
  - API response caching decorator
- **Configuration**: `.env` (REDIS_HOST, REDIS_PORT, REDIS_DB)

### 2. Celery Configuration ✅
- **File**: `celery_app.py`
- **Features**:
  - 3 task queues: default, ai_processing, file_processing
  - Scheduled tasks (beat schedule):
    - Cleanup old notifications (daily at 2 AM)
    - Recalculate engagement scores (daily at 3 AM)
    - Update skill graph (weekly on Sunday at 4 AM)
    - Send event reminders (every 6 hours)
  - Task retry logic with exponential backoff
  - Result persistence (24-hour expiration)
- **Configuration**: `.env` (CELERY_BROKER_URL, CELERY_RESULT_BACKEND)

### 3. File Storage System ✅
- **File**: `storage.py`
- **Features**:
  - Support for local and S3 storage
  - File categories: datasets, ml_models, photos, cvs, documents, qr_codes
  - File validation (size and type checks)
  - Unique filename generation with hashing
  - Upload/delete/get_url operations
- **Configuration**: `.env` (STORAGE_TYPE, LOCAL_STORAGE_PATH, S3_*)

### 4. AI/ML Utilities ✅
- **File**: `ai_utils.py`
- **Features**:
  - Similarity calculators (Jaccard, Cosine, Weighted)
  - Skill matching algorithms
  - Data normalization utilities
  - ML model management (save/load)
  - Feature extraction utilities
- **Configuration**: `.env` (EMBEDDING_MODEL, ML_MODEL_PATH)

### 5. Background Tasks ✅
- **Files**: `tasks/__init__.py`, `tasks/upload_tasks.py`, `tasks/ai_tasks.py`, `tasks/notification_tasks.py`
- **Features**:
  - Dataset upload processing (validation, cleaning)
  - AI tasks (skill graph, career predictions, engagement scoring)
  - Notification tasks (email sending, event reminders, cleanup)
  - Async processing with retry logic

## Directory Structure

```
/app/backend/
├── celery_app.py              # Celery configuration
├── redis_client.py            # Redis client and utilities
├── storage.py                 # File storage management
├── ai_utils.py                # AI/ML utilities
├── test_infrastructure.py     # Infrastructure test script
├── PHASE_10.1_SETUP.md       # This file
├── .env                       # Updated with Phase 10.1 configs
├── requirements.txt           # Updated with new dependencies
├── tasks/
│   ├── __init__.py
│   ├── upload_tasks.py        # Dataset processing tasks
│   ├── ai_tasks.py            # AI processing tasks
│   └── notification_tasks.py  # Notification tasks
└── ml_models/                 # ML model storage directory

/app/storage/                  # Local file storage
├── datasets/
├── ml_models/
├── photos/
├── cvs/
├── documents/
├── qr_codes/
└── temp/
```

## Installation & Setup

### 1. Install Dependencies
```bash
cd /app/backend
pip install -r requirements.txt
```

### 2. Install Redis Server
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test Redis
redis-cli ping
# Should return: PONG
```

### 3. Create Storage Directories
```bash
# Run test script to create all directories
python test_infrastructure.py
```

### 4. Configure Environment Variables
Edit `/app/backend/.env` and update:
- Redis connection (REDIS_HOST, REDIS_PORT)
- Storage type (local or s3)
- ML model configuration

### 5. Test Infrastructure
```bash
cd /app/backend
python test_infrastructure.py
```

Expected output: All tests should pass ✅

## Running Celery Workers

### Start Celery Worker
```bash
# From /app/backend directory
celery -A celery_app worker --loglevel=info --queues=default,ai_processing,file_processing
```

### Start Celery Beat (Scheduled Tasks)
```bash
celery -A celery_app beat --loglevel=info
```

### Monitor with Flower
```bash
celery -A celery_app flower --port=5555
```
Access Flower UI at: http://localhost:5555

## Testing

### Test Redis Connection
```python
import asyncio
from redis_client import get_redis_client, RedisCache

async def test_redis():
    # Test basic operations
    await RedisCache.set('test_key', 'test_value', ttl=60)
    value = await RedisCache.get('test_key')
    print(f"Retrieved value: {value}")
    
    # Test leaderboard
    from redis_client import RedisLeaderboard
    await RedisLeaderboard.add_score('test_board', 'user1', 100)
    top_users = await RedisLeaderboard.get_top('test_board', 10)
    print(f"Top users: {top_users}")

asyncio.run(test_redis())
```

### Test File Storage
```python
from storage import file_storage

# Test file validation
is_valid, error = file_storage.validate_file(
    'dataset.csv',
    1024 * 1024,  # 1 MB
    'datasets'
)
print(f"Validation: {is_valid}, Error: {error}")
```

### Test Celery Task
```python
from tasks.upload_tasks import process_dataset_upload

# Queue a task
result = process_dataset_upload.delay(
    'test-upload-id',
    '/app/storage/datasets/test.csv',
    'alumni'
)

# Check result
print(f"Task ID: {result.id}")
print(f"Status: {result.status}")
```

## Integration with Existing Code

### Update server.py
Add Redis and storage initialization:

```python
from redis_client import get_redis_client, close_redis_client
from storage import file_storage

@app.on_event("startup")
async def startup():
    # Existing database initialization
    await get_db_pool()
    
    # Initialize Redis
    await get_redis_client()
    logger.info("✅ Redis connected")
    
    # Initialize storage
    logger.info("✅ File storage initialized")

@app.on_event("shutdown")
async def shutdown():
    # Existing cleanup
    await close_db_pool()
    
    # Close Redis
    await close_redis_client()
    logger.info("✅ Redis disconnected")
```

### Use Caching in Routes
```python
from redis_client import cache_response, RedisConfig

@router.get("/api/profiles/directory")
@cache_response(ttl=RedisConfig.TTL_API_CACHE_MEDIUM)
async def get_directory():
    # This response will be cached for 10 minutes
    return await profile_service.get_directory()
```

### Queue Background Tasks
```python
from tasks.ai_tasks import calculate_career_predictions

@router.post("/api/career/predict")
async def predict_career(user_id: str):
    # Queue task for background processing
    task = calculate_career_predictions.delay(user_id)
    
    return {
        "task_id": task.id,
        "status": "queued",
        "message": "Career prediction task queued"
    }
```

## Dependencies Added

### Core Infrastructure
- redis>=5.0.0
- aioredis>=2.0.1
- celery>=5.3.4
- celery[redis]>=5.3.4
- flower>=2.0.1

### ML Libraries
- scikit-learn>=1.4.0
- scipy>=1.12.0
- sentence-transformers>=2.3.1
- faiss-cpu>=1.7.4

### LLM Integration
- openai>=1.10.0
- anthropic>=0.18.0
- google-generativeai>=0.3.2

### Data Processing
- openpyxl>=3.1.2
- xlrd>=2.0.1

### Monitoring
- prometheus-client>=0.19.0
- python-json-logger>=2.0.7
- sentry-sdk>=1.40.0

## Performance Considerations

### Redis
- Connection pooling (10 max connections)
- TTL-based expiration
- Key namespacing for organization

### Celery
- Worker prefetch multiplier: 1 (for long tasks)
- Task time limits: 1 hour hard, 55 min soft
- Result expiration: 24 hours
- Task acknowledgment: Late (for reliability)

### Storage
- Local storage for development
- S3 for production (scalability)
- File size limits enforced
- Unique filename generation prevents conflicts

## Next Steps

After Phase 10.1 completion, proceed to:
- **Phase 10.2**: Admin Dataset Upload System
- **Phase 10.3**: Skill Graph AI System
- **Phase 10.4**: Career Path Prediction Engine
- **Phase 10.5**: Talent Heatmap Intelligence
- **Phase 10.6**: AI-Validated Digital Alumni ID
- **Phase 10.7**: Knowledge Capsules Ranking Engine
- **Phase 10.8**: Enhanced Engagement Scoring

## Troubleshooting

### Redis Connection Failed
```bash
# Check Redis is running
sudo systemctl status redis

# Check Redis port
redis-cli ping

# Check firewall
sudo ufw allow 6379
```

### Celery Worker Not Starting
```bash
# Check broker connection
celery -A celery_app inspect ping

# Check broker URL
echo $CELERY_BROKER_URL

# View detailed logs
celery -A celery_app worker --loglevel=debug
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check Python version (3.8+)
python --version
```

### Storage Permission Denied
```bash
# Fix permissions
sudo chmod -R 755 /app/storage
sudo chown -R $(whoami) /app/storage
```

## Status

✅ **Phase 10.1: Infrastructure Setup - COMPLETE**

All infrastructure components are implemented and ready for integration:
- ✅ Redis configuration and utilities
- ✅ Celery configuration and task queues
- ✅ File storage system (local + S3 ready)
- ✅ AI/ML utilities and model management
- ✅ Background task modules
- ✅ Environment configuration
- ✅ Directory structure
- ✅ Test script

Ready to proceed to Phase 10.2: Admin Dataset Upload System
