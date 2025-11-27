# 🚀 UPDATED BACKEND WORKFLOW - AlumUnity System (Production-Ready)
## With Complete AI Systems Integration

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Database Architecture](#database-architecture)
5. [Admin Dataset Upload System](#admin-dataset-upload-system)
6. [AI Systems Integration](#ai-systems-integration)
7. [API Architecture](#api-architecture)
8. [Background Job Processing](#background-job-processing)
9. [Caching Strategy](#caching-strategy)
10. [Security & Authentication](#security--authentication)
11. [Error Handling & Logging](#error-handling--logging)
12. [Deployment Architecture](#deployment-architecture)
13. [Frontend Integration](#frontend-integration)

---

## 📊 Executive Summary

This document outlines the **production-ready backend architecture** for the AlumUnity System, including:

- **6 AI/ML Systems** for intelligent features
- **Admin Dataset Upload Pipeline** for bulk data processing
- **Hybrid AI Approach**: Python ML models + LLM-based intelligence
- **Background Processing**: Queue-based async job execution
- **Dual Storage**: MySQL (persistent) + Redis (cache)
- **RESTful API**: 100+ endpoints supporting 42 frontend pages
- **Real-time Updates**: WebSocket support for notifications

**Key Capabilities:**
✅ Automated alumni data processing
✅ Intelligent skill relationship mapping
✅ Career path predictions using ML
✅ Geographic talent distribution analytics
✅ AI-validated digital identity cards
✅ Smart content ranking and recommendations
✅ Engagement scoring and gamification

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  42 Pages | 90+ Components | Real-time UI | Chart Visualizations│
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST + WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (FastAPI)                         │
│  Authentication | Rate Limiting | Request Validation | Logging   │
└────────────┬─────────────────┬──────────────────┬───────────────┘
             │                 │                  │
             ▼                 ▼                  ▼
┌────────────────────┐ ┌──────────────┐ ┌────────────────────┐
│   CORE SERVICES    │ │  AI ENGINE   │ │  UPLOAD PROCESSOR  │
│ - Auth Service     │ │ - ML Models  │ │ - File Validator   │
│ - Profile Service  │ │ - LLM API    │ │ - Data Cleaner     │
│ - Job Service      │ │ - Embeddings │ │ - Pipeline Manager │
│ - Event Service    │ │ - Clustering │ │ - Progress Tracker │
│ - Forum Service    │ │ - Prediction │ │ - Notifier         │
│ - Notification Svc │ │ - Ranking    │ │                    │
└─────────┬──────────┘ └──────┬───────┘ └─────────┬──────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKGROUND JOB QUEUE                          │
│  Celery Workers | Task Scheduling | Retry Logic | Progress      │
└────────────┬─────────────────┬──────────────────┬───────────────┘
             │                 │                  │
             ▼                 ▼                  ▼
┌───────────────────┐ ┌────────────────┐ ┌─────────────────────┐
│   MySQL DATABASE  │ │  REDIS CACHE   │ │  FILE STORAGE (S3)  │
│ - Users           │ │ - Session Data │ │ - Uploaded CSVs     │
│ - Profiles        │ │ - API Cache    │ │ - Profile Photos    │
│ - Jobs/Events     │ │ - Queue Tasks  │ │ - Documents         │
│ - AI Outputs      │ │ - Real-time    │ │ - Generated Reports │
│ - Metrics/Logs    │ │ - Leaderboard  │ │                     │
└───────────────────┘ └────────────────┘ └─────────────────────┘
```

### Architecture Principles

1. **Microservices-Ready**: Modular service design for future scaling
2. **Async-First**: Background processing for heavy operations
3. **Cache-Heavy**: Redis for sub-50ms API responses
4. **ML Pipeline**: Separate AI processing flow
5. **Event-Driven**: Pub-sub pattern for real-time updates
6. **Fault-Tolerant**: Retry logic and graceful degradation

---

## 🛠️ Technology Stack

### Backend Core
```python
FastAPI==0.110.1          # Modern async web framework
uvicorn==0.25.0           # ASGI server
aiomysql==0.2.0           # Async MySQL driver
redis==5.0.0              # Redis client
celery==5.3.4             # Background task queue
```

### AI/ML Stack
```python
# Python ML Libraries
scikit-learn==1.4.0       # ML algorithms (clustering, classification)
pandas==2.2.0             # Data manipulation
numpy==1.26.0             # Numerical computing
scipy==1.12.0             # Scientific computing

# Embeddings & Similarity
sentence-transformers==2.3.1  # Text embeddings for skill matching
faiss-cpu==1.7.4         # Fast similarity search

# LLM Integration (via Emergent LLM Key)
openai==1.10.0           # For GPT models
anthropic==0.18.0        # For Claude models
google-generativeai==0.3.2  # For Gemini models
```

### Data Processing
```python
python-multipart==0.0.9   # File upload handling
openpyxl==3.1.2          # Excel file processing
xlrd==2.0.1              # Legacy Excel support
```

### Security & Auth
```python
python-jose==3.3.0        # JWT tokens
passlib==1.7.4           # Password hashing
bcrypt==4.1.3            # Secure hashing
pyjwt==2.10.1            # JWT implementation
```

### ID Card & QR
```python
qrcode==7.4.2            # QR code generation
Pillow==10.2.0           # Image processing
reportlab==4.0.0         # PDF generation
```

### Monitoring & Logging
```python
prometheus-client==0.19.0  # Metrics
python-json-logger==2.0.7  # Structured logging
sentry-sdk==1.40.0        # Error tracking
```

---

## 🗄️ Database Architecture

### MySQL Schema Updates for AI Systems

#### New Tables for AI Features

```sql
-- ============================================================================
-- AI SYSTEMS TABLES
-- ============================================================================

-- 1. Admin Dataset Upload Tracking
CREATE TABLE dataset_uploads (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    uploaded_by VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type ENUM('alumni', 'job_market', 'educational') NOT NULL,
    file_size_kb INT,
    status ENUM('pending', 'validating', 'cleaning', 'processing', 'completed', 'failed') DEFAULT 'pending',
    total_rows INT,
    valid_rows INT,
    error_rows INT,
    error_log TEXT,
    validation_report JSON,
    processing_start_time TIMESTAMP NULL,
    processing_end_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Dataset Processing Logs
CREATE TABLE dataset_processing_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    upload_id VARCHAR(36) NOT NULL,
    stage ENUM('validation', 'cleaning', 'ai_processing', 'storage') NOT NULL,
    status ENUM('started', 'in_progress', 'completed', 'failed') NOT NULL,
    message TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (upload_id) REFERENCES dataset_uploads(id) ON DELETE CASCADE,
    INDEX idx_upload_id (upload_id),
    INDEX idx_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Skill Embeddings (for Skill Graph AI)
CREATE TABLE skill_embeddings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    embedding_vector JSON NOT NULL,  -- 384-dimensional vector from sentence-transformers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_skill_name (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Skill Similarity Matrix (for fast lookups)
CREATE TABLE skill_similarities (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    skill_1 VARCHAR(100) NOT NULL,
    skill_2 VARCHAR(100) NOT NULL,
    similarity_score DECIMAL(5,4) NOT NULL,  -- 0.0000 to 1.0000
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pair (skill_1, skill_2),
    INDEX idx_skill_1 (skill_1),
    INDEX idx_skill_2 (skill_2),
    INDEX idx_similarity_score (similarity_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Career Transition Probabilities
CREATE TABLE career_transition_matrix (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    from_role VARCHAR(255) NOT NULL,
    to_role VARCHAR(255) NOT NULL,
    transition_count INT DEFAULT 0,
    transition_probability DECIMAL(5,4),  -- ML-calculated probability
    avg_duration_months INT,
    required_skills JSON,  -- Skills needed for transition
    success_rate DECIMAL(5,4),
    college_id VARCHAR(36),  -- Per-college transition data
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_transition (from_role, to_role, college_id),
    INDEX idx_from_role (from_role),
    INDEX idx_to_role (to_role),
    INDEX idx_probability (transition_probability DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Alumni ID Verification Records
CREATE TABLE alumni_id_verifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    card_id VARCHAR(36) NOT NULL,
    verified_by VARCHAR(36),
    verification_method ENUM('qr_scan', 'manual', 'api') NOT NULL,
    verification_location VARCHAR(255),
    is_valid BOOLEAN,
    duplicate_check_passed BOOLEAN,
    rule_validations JSON,  -- AI validation results
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES alumni_cards(id) ON DELETE CASCADE,
    INDEX idx_card_id (card_id),
    INDEX idx_verified_at (verified_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Knowledge Capsule Rankings (AI-driven)
CREATE TABLE capsule_rankings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    capsule_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,  -- Personalized ranking per user
    relevance_score DECIMAL(5,4),  -- 0.0000 to 1.0000
    engagement_score DECIMAL(5,4),
    skill_match_score DECIMAL(5,4),
    credibility_score DECIMAL(5,4),
    final_rank_score DECIMAL(5,4),  -- Weighted combination
    ranking_factors JSON,  -- Detailed breakdown
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (capsule_id) REFERENCES knowledge_capsules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_capsule (capsule_id, user_id),
    INDEX idx_capsule_id (capsule_id),
    INDEX idx_user_id (user_id),
    INDEX idx_final_rank_score (final_rank_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Talent Heatmap Clusters
CREATE TABLE talent_clusters (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    cluster_name VARCHAR(255) NOT NULL,
    center_latitude DECIMAL(10, 8),
    center_longitude DECIMAL(11, 8),
    radius_km DECIMAL(8, 2),
    alumni_ids JSON,  -- Array of user_ids in this cluster
    dominant_skills JSON,
    dominant_industries JSON,
    cluster_size INT,
    cluster_density DECIMAL(5,2),  -- Alumni per sq km
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cluster_name (cluster_name),
    INDEX idx_coordinates (center_latitude, center_longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. ML Model Metadata (for versioning and tracking)
CREATE TABLE ml_models (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    model_type ENUM('clustering', 'classification', 'regression', 'ranking', 'embedding') NOT NULL,
    framework VARCHAR(50),  -- scikit-learn, pytorch, etc.
    model_file_path VARCHAR(500),
    hyperparameters JSON,
    training_metrics JSON,
    accuracy DECIMAL(5,4),
    status ENUM('training', 'active', 'deprecated') DEFAULT 'training',
    trained_at TIMESTAMP,
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_model_version (model_name, model_version),
    INDEX idx_model_name (model_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. AI Processing Queue
CREATE TABLE ai_processing_queue (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    task_type ENUM('skill_graph', 'career_prediction', 'talent_clustering', 'id_validation', 'capsule_ranking', 'engagement_scoring') NOT NULL,
    priority INT DEFAULT 5,  -- 1=highest, 10=lowest
    payload JSON NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    worker_id VARCHAR(100),
    result JSON,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_priority (status, priority),
    INDEX idx_task_type (task_type),
    INDEX idx_scheduled_at (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Redis Cache Schema

```
# Session Management
session:{user_id} → {jwt_token, user_data, expires_at}

# API Response Caching
api:jobs:list:{filters_hash} → {response_json} [TTL: 5min]
api:alumni:directory:{filters_hash} → {response_json} [TTL: 10min]
api:events:upcoming → {response_json} [TTL: 2min]

# Real-time Leaderboard
leaderboard:engagement:global → SORTED SET [(user_id, score), ...]
leaderboard:engagement:monthly → SORTED SET [(user_id, score), ...]

# AI Model Cache
ai:skill_embeddings:{skill_name} → {embedding_vector}
ai:career_predictions:{user_id} → {predictions_json} [TTL: 24h]
ai:talent_heatmap:global → {geo_data_json} [TTL: 1h]

# Rate Limiting
rate_limit:api:{user_id}:{endpoint} → {request_count} [TTL: 1min]

# Job Queue Status
queue:ai_processing:pending → LIST [task_id, ...]
queue:ai_processing:processing → HASH {task_id: worker_id}

# Notification Queue
notifications:realtime:{user_id} → LIST [{notification_object}, ...]

# Upload Progress Tracking
upload:progress:{upload_id} → {percentage, stage, message}
```

---

## 📤 Admin Dataset Upload System

### Upload Flow Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1: FILE UPLOAD (Admin Dashboard)                           │
│  - Admin selects CSV/Excel/JSON file                             │
│  - File type selection: Alumni / Job Market / Educational        │
│  - Max size: 50MB per file                                       │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2: INITIAL VALIDATION (Synchronous)                        │
│  - File format check (.csv, .xlsx, .json)                        │
│  - File size validation (<50MB)                                  │
│  - Required columns check                                        │
│  - Create upload record in dataset_uploads table                 │
│  - Upload to S3/file storage                                     │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3: BACKGROUND PROCESSING (Async - Celery Task)             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  3A. DATA VALIDATION                                        │ │
│  │  - Parse file (pandas)                                      │ │
│  │  - Schema validation                                        │ │
│  │  - Data type checks                                         │ │
│  │  - Null value handling                                      │ │
│  │  - Duplicate detection                                      │ │
│  │  - Create validation report                                 │ │
│  │  Status: dataset_uploads.status = 'validating'              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                         │                                         │
│                         ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  3B. DATA CLEANING                                          │ │
│  │  - Remove invalid rows                                      │ │
│  │  - Normalize text fields (trim, lowercase)                  │ │
│  │  - Standardize dates                                        │ │
│  │  - Fix encoding issues                                      │ │
│  │  - Handle missing values (imputation)                       │ │
│  │  Status: dataset_uploads.status = 'cleaning'                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                         │                                         │
│                         ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  3C. AI PIPELINE TRIGGERING                                 │ │
│  │  Based on file_type, trigger relevant AI systems:           │ │
│  │                                                              │ │
│  │  IF file_type == 'alumni':                                  │ │
│  │    → Skill Graph AI (update skill relationships)            │ │
│  │    → Career Path Prediction (update transition matrix)      │ │
│  │    → Talent Heatmap (recalculate clusters)                  │ │
│  │    → Engagement Scoring (update scores)                     │ │
│  │                                                              │ │
│  │  IF file_type == 'job_market':                              │ │
│  │    → Skill Graph AI (update industry connections)           │ │
│  │    → Career Path Prediction (market trends)                 │ │
│  │                                                              │ │
│  │  IF file_type == 'educational':                             │ │
│  │    → Career Path Prediction (academic performance impact)   │ │
│  │    → Knowledge Capsules Ranking (update relevance)          │ │
│  │                                                              │ │
│  │  Status: dataset_uploads.status = 'processing'              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                         │                                         │
│                         ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  3D. DATA STORAGE                                           │ │
│  │  - Insert valid rows into MySQL tables                      │ │
│  │  - Update existing records if applicable                    │ │
│  │  - Store AI processing results                              │ │
│  │  - Update cache (Redis) with new data                       │ │
│  │  Status: dataset_uploads.status = 'completed'               │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 4: NOTIFICATION & REPORTING                                 │
│  - Send notification to admin (email + in-app)                    │
│  - Generate processing report (PDF)                               │
│  - Update dashboard statistics                                    │
│  - Log audit trail                                                │
└──────────────────────────────────────────────────────────────────┘
```

### Dataset File Schemas

#### Alumni Dataset Schema
```csv
email,name,batch_year,department,current_company,current_role,location,skills,linkedin_url
john@example.com,John Doe,2018,Computer Science,Google,Senior SWE,San Francisco,"Python,React,ML",https://...
```

#### Job Market Dataset Schema
```csv
job_title,company,industry,location,salary_min,salary_max,required_skills,experience_level
Senior Developer,Microsoft,Technology,Seattle,120000,180000,"Python,Cloud",5-7 years
```

#### Educational Dataset Schema
```csv
student_id,email,course_name,grade,completion_date,skills_learned,instructor
STD001,student@edu.com,Machine Learning,A,2024-05-15,"Python,TensorFlow",Dr. Smith
```

### API Endpoints for Admin Upload

```python
# 1. Upload Dataset File
POST /api/admin/datasets/upload
Content-Type: multipart/form-data

Request:
{
  "file": <file_binary>,
  "dataset_type": "alumni",  # or "job_market", "educational"
  "description": "Q1 2025 Alumni Data"
}

Response:
{
  "success": true,
  "data": {
    "upload_id": "uuid-123",
    "status": "pending",
    "file_name": "alumni_data.csv",
    "estimated_processing_time": "5-10 minutes"
  }
}

# 2. Get Upload Progress
GET /api/admin/datasets/upload/{upload_id}/progress

Response:
{
  "upload_id": "uuid-123",
  "status": "processing",
  "progress_percentage": 65,
  "current_stage": "cleaning",
  "total_rows": 1000,
  "processed_rows": 650,
  "valid_rows": 640,
  "error_rows": 10,
  "estimated_time_remaining": "2 minutes"
}

# 3. Get Upload Report
GET /api/admin/datasets/upload/{upload_id}/report

Response:
{
  "upload_id": "uuid-123",
  "status": "completed",
  "summary": {
    "total_rows": 1000,
    "valid_rows": 950,
    "error_rows": 50,
    "processing_time_seconds": 320
  },
  "validation_report": {
    "errors": [
      {"row": 15, "error": "Invalid email format"},
      {"row": 23, "error": "Missing required field: batch_year"}
    ]
  },
  "ai_processing_triggered": [
    "skill_graph_update",
    "career_path_recalculation",
    "talent_heatmap_refresh"
  ]
}

# 4. List All Uploads
GET /api/admin/datasets/uploads?status=completed&page=1&limit=20

Response:
{
  "data": [
    {
      "upload_id": "uuid-123",
      "file_name": "alumni_data.csv",
      "dataset_type": "alumni",
      "status": "completed",
      "uploaded_by": "admin@example.com",
      "created_at": "2025-01-20T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1
}

# 5. Download Error Report
GET /api/admin/datasets/upload/{upload_id}/errors/download

Response: CSV file with error details
```

---

## 🤖 AI Systems Integration

### 1. Skill Graph AI System

#### Purpose
Build and maintain a dynamic skill relationship graph to understand:
- Which skills are related (e.g., Python ↔ Django, React ↔ JavaScript)
- Skill clusters and communities
- Emerging skill trends
- Career progression paths based on skills

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  DATA SOURCES                                                    │
│  - Alumni profiles (skills field)                                │
│  - Job postings (required_skills field)                          │
│  - Knowledge capsules (tags field)                               │
│  - Admin uploaded datasets                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: SKILL EXTRACTION & NORMALIZATION                        │
│  - Extract all unique skills from database                       │
│  - Normalize skill names (lowercase, trim)                       │
│  - Merge similar skills (e.g., "JS" → "JavaScript")              │
│  - Store in skill_graph table                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: EMBEDDING GENERATION (sentence-transformers)            │
│  - Load pre-trained model: all-MiniLM-L6-v2                      │
│  - Generate 384-dim embedding for each skill name                │
│  - Store embeddings in skill_embeddings table                    │
│  - Cache embeddings in Redis for fast access                     │
│                                                                   │
│  Example:                                                         │
│  skill="Python" → embedding=[0.123, -0.456, 0.789, ...]          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: SIMILARITY CALCULATION (cosine similarity)              │
│  - Calculate pairwise similarity between all skills              │
│  - Use FAISS for fast similarity search                          │
│  - Store top N similar skills per skill                          │
│  - Store in skill_similarities table                             │
│                                                                   │
│  Example:                                                         │
│  Python ↔ Django: 0.8523                                         │
│  Python ↔ Machine Learning: 0.7891                               │
│  Python ↔ JavaScript: 0.4123                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: CO-OCCURRENCE ANALYSIS                                  │
│  - Analyze skill co-occurrence in alumni profiles                │
│  - Calculate frequency: P(skill_B | skill_A)                     │
│  - Weight by context (jobs vs profiles)                          │
│  - Update related_skills in skill_graph table                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: GRAPH CONSTRUCTION                                      │
│  - Build network graph (NetworkX library)                        │
│  - Nodes = Skills                                                │
│  - Edges = Similarity score + Co-occurrence weight               │
│  - Detect communities (Louvain algorithm)                        │
│  - Calculate centrality metrics                                  │
│  - Store graph metadata in skill_graph table                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: LLM ENHANCEMENT (Optional - for descriptions)           │
│  - Use Emergent LLM Key (GPT/Claude/Gemini)                      │
│  - Generate skill descriptions                                   │
│  - Suggest learning paths                                        │
│  - Identify trending skills                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT: API Responses                                           │
│  - Skill network visualization data (nodes, edges)               │
│  - Related skills for a given skill                              │
│  - Skill clusters and communities                                │
│  - Career paths based on skill combinations                      │
└─────────────────────────────────────────────────────────────────┘
```

#### API Endpoints

```python
# Get skill graph network data
GET /api/ai/skill-graph/network
Response:
{
  "nodes": [
    {"id": "Python", "alumni_count": 150, "job_count": 45, "popularity": 0.85},
    {"id": "React", "alumni_count": 120, "job_count": 38, "popularity": 0.78}
  ],
  "edges": [
    {"source": "Python", "target": "Django", "weight": 0.85},
    {"source": "Python", "target": "ML", "weight": 0.79}
  ],
  "clusters": [
    {"cluster_id": 1, "name": "Web Development", "skills": ["React", "Node.js", "MongoDB"]}
  ]
}

# Get related skills
GET /api/ai/skill-graph/related/{skill_name}?limit=10
Response:
{
  "skill": "Python",
  "related_skills": [
    {"skill": "Django", "similarity": 0.85, "reason": "framework"},
    {"skill": "Machine Learning", "similarity": 0.79, "reason": "application"},
    {"skill": "Data Science", "similarity": 0.76, "reason": "domain"}
  ]
}

# Skill-based career matching
POST /api/ai/skill-graph/match-alumni
Request: {"skills": ["Python", "React", "AWS"]}
Response:
{
  "matched_alumni": [
    {"user_id": "abc", "match_score": 0.92, "matching_skills": ["Python", "React", "AWS"]},
    {"user_id": "def", "match_score": 0.87, "matching_skills": ["Python", "AWS"]}
  ]
}
```

#### ML Model Implementation

```python
# File: /app/backend/ai/skill_graph.py

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import faiss
import numpy as np

class SkillGraphAI:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.dimension = 384
        self.index = None  # FAISS index
        
    async def generate_embeddings(self, skills: list) -> dict:
        """Generate embeddings for skills"""
        embeddings = self.model.encode(skills)
        return {skill: emb.tolist() for skill, emb in zip(skills, embeddings)}
    
    async def build_faiss_index(self, embeddings: np.array):
        """Build FAISS index for fast similarity search"""
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product (cosine)
        faiss.normalize_L2(embeddings)  # Normalize for cosine similarity
        self.index.add(embeddings)
    
    async def find_similar_skills(self, skill: str, top_k: int = 10):
        """Find top-k similar skills"""
        embedding = self.model.encode([skill])
        faiss.normalize_L2(embedding)
        
        distances, indices = self.index.search(embedding, top_k)
        return [(idx, dist) for idx, dist in zip(indices[0], distances[0])]
    
    async def calculate_co_occurrence(self, alumni_profiles: list):
        """Calculate skill co-occurrence from alumni profiles"""
        co_occurrence = {}
        for profile in alumni_profiles:
            skills = profile.get('skills', [])
            for i, skill_a in enumerate(skills):
                for skill_b in skills[i+1:]:
                    pair = tuple(sorted([skill_a, skill_b]))
                    co_occurrence[pair] = co_occurrence.get(pair, 0) + 1
        return co_occurrence
```

---

### 2. Career Path Prediction Engine

#### Purpose
Predict career progression for students/alumni based on:
- Historical career transitions from alumni dataset
- Skills and education background
- Industry trends
- Geographic factors

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  TRAINING DATA COLLECTION (Per College)                          │
│  - Extract career_paths table data                               │
│  - Alumni experience_timeline (JSON field)                       │
│  - Admin uploaded job market datasets                            │
│  - Filter by college_id for college-specific models              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  FEATURE ENGINEERING                                             │
│  - Current role encoding (one-hot / label encoding)              │
│  - Skills vector (multi-hot encoding)                            │
│  - Years of experience (numerical)                               │
│  - Education level (categorical)                                 │
│  - Industry sector (categorical)                                 │
│  - Company size (categorical: startup, mid, large)               │
│  - Location factor (cost of living index)                        │
│  - Skill demand score (from job postings)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  TRANSITION MATRIX CALCULATION                                   │
│  - Build role-to-role transition matrix                          │
│  - Calculate P(role_B | role_A) from historical data             │
│  - Store in career_transition_matrix table                       │
│                                                                   │
│  Example:                                                         │
│  Software Engineer → Senior SWE: 0.65 (65% of alumni)            │
│  Software Engineer → Engineering Manager: 0.15                   │
│  Software Engineer → Product Manager: 0.08                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  ML MODEL TRAINING (Random Forest / XGBoost)                     │
│  - Model type: Multi-class classification                        │
│  - Target: Next role (within 2 years)                            │
│  - Features: Current role, skills, experience, education         │
│  - Train separate model per college                              │
│  - Hyperparameter tuning (GridSearchCV)                          │
│  - Cross-validation (80/20 split)                                │
│  - Store model in ml_models table                                │
│  - Save model file to S3                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PREDICTION PIPELINE                                             │
│  - Load user profile data                                        │
│  - Extract features                                              │
│  - Load trained model                                            │
│  - Predict next role probabilities                               │
│  - Generate top 5 recommended paths                              │
│  - Calculate confidence scores                                   │
│  - Store in career_predictions table                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LLM ENHANCEMENT (via Emergent LLM Key)                          │
│  - Generate personalized career advice                           │
│  - Suggest skills to learn for desired role                      │
│  - Identify similar alumni success stories                       │
│  - Create learning roadmap                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT: Career Predictions                                      │
│  - Top predicted roles with probability                          │
│  - Recommended skills to acquire                                 │
│  - Estimated time to transition                                  │
│  - Similar alumni who made the transition                        │
└─────────────────────────────────────────────────────────────────┘
```

#### API Endpoints

```python
# Get career predictions for user
POST /api/ai/career-path/predict
Request:
{
  "user_id": "uuid-123",
  "target_role": "Engineering Manager"  # Optional
}

Response:
{
  "current_role": "Senior Software Engineer",
  "predictions": [
    {
      "role": "Engineering Manager",
      "probability": 0.68,
      "timeframe": "18-24 months",
      "confidence": "high",
      "required_skills": ["Leadership", "Project Management", "System Design"],
      "skills_gap": ["Leadership", "Project Management"],
      "similar_alumni_count": 15
    },
    {
      "role": "Staff Engineer",
      "probability": 0.22,
      "timeframe": "12-18 months",
      "required_skills": ["Advanced System Design", "Mentorship"]
    }
  ],
  "personalized_advice": "Based on your profile, you're well-positioned for an Engineering Manager role. Focus on developing leadership skills through mentoring junior engineers..."
}

# Get role transition statistics
GET /api/ai/career-path/transitions?from_role=Software Engineer

Response:
{
  "from_role": "Software Engineer",
  "transitions": [
    {
      "to_role": "Senior Software Engineer",
      "transition_count": 85,
      "probability": 0.65,
      "avg_duration_months": 24,
      "success_rate": 0.92
    },
    {
      "to_role": "Engineering Manager",
      "transition_count": 20,
      "probability": 0.15,
      "avg_duration_months": 48
    }
  ]
}

# Get learning path recommendations
POST /api/ai/career-path/learning-path
Request: {"user_id": "uuid-123", "target_role": "Data Scientist"}

Response:
{
  "current_skills": ["Python", "SQL"],
  "target_role_skills": ["Python", "Machine Learning", "Statistics", "Deep Learning"],
  "learning_path": [
    {
      "step": 1,
      "skill": "Statistics",
      "priority": "high",
      "resources": ["Course links", "Knowledge capsules"],
      "estimated_time": "2 months"
    },
    {
      "step": 2,
      "skill": "Machine Learning",
      "priority": "high",
      "estimated_time": "3 months"
    }
  ]
}
```

#### ML Model Implementation

```python
# File: /app/backend/ai/career_prediction.py

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
import joblib

class CareerPathPredictor:
    def __init__(self):
        self.model = None
        self.role_encoder = LabelEncoder()
        self.skill_encoder = MultiLabelBinarizer()
        
    async def prepare_features(self, user_profile: dict):
        """Extract and encode features from user profile"""
        current_role = user_profile.get('current_role')
        skills = user_profile.get('skills', [])
        experience_years = user_profile.get('years_of_experience', 0)
        education = user_profile.get('education_level')
        
        # Encode role
        role_encoded = self.role_encoder.transform([current_role])[0]
        
        # Encode skills (multi-hot)
        skills_encoded = self.skill_encoder.transform([skills])[0]
        
        # Combine features
        features = [role_encoded, experience_years] + skills_encoded.tolist()
        return features
    
    async def train_model(self, training_data: list):
        """Train career prediction model"""
        X = []  # Features
        y = []  # Target (next role)
        
        for record in training_data:
            features = await self.prepare_features(record['current_state'])
            X.append(features)
            y.append(record['next_role'])
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.model.fit(X, y)
        
        # Save model
        joblib.dump(self.model, 'models/career_predictor.pkl')
        
    async def predict_career_path(self, user_profile: dict):
        """Predict next career moves"""
        features = await self.prepare_features(user_profile)
        
        # Get probabilities for all classes
        probabilities = self.model.predict_proba([features])[0]
        classes = self.model.classes_
        
        # Get top 5 predictions
        top_indices = probabilities.argsort()[-5:][::-1]
        predictions = [
            {
                "role": classes[idx],
                "probability": float(probabilities[idx])
            }
            for idx in top_indices
        ]
        
        return predictions
```

---

### 3. Talent Heatmap Intelligence

#### Purpose
Visualize and analyze geographic distribution of alumni to:
- Identify talent concentration hubs
- Find emerging talent markets
- Support location-based networking
- Assist recruiters in finding local talent

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  DATA COLLECTION                                                 │
│  - Alumni profiles (location field)                              │
│  - Job postings (location field)                                 │
│  - Geographic coordinates (lat/long)                             │
│  - Skills, industries, companies per location                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  GEOCODING & NORMALIZATION                                       │
│  - Standardize location names                                    │
│  - Convert addresses to lat/long (Google Maps API)               │
│  - Handle location aliases (NYC → New York City)                 │
│  - Store in geographic_data table                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLUSTERING ANALYSIS (DBSCAN Algorithm)                          │
│  - Cluster alumni based on geographic proximity                  │
│  - Parameters: eps=50km, min_samples=5                           │
│  - Identify dense talent clusters                                │
│  - Calculate cluster statistics:                                 │
│    * Alumni count per cluster                                    │
│    * Dominant skills                                             │
│    * Top companies                                               │
│    * Industry distribution                                       │
│  - Store in talent_clusters table                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  HEATMAP GENERATION                                              │
│  - Calculate density per grid cell (H3 hexagons)                 │
│  - Generate heatmap intensity values                             │
│  - Color coding: low (blue) → medium (yellow) → high (red)       │
│  - Aggregate data for different views:                           │
│    * Alumni density                                              │
│    * Job opportunity density                                     │
│    * Skill-specific heatmaps                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  TREND ANALYSIS                                                  │
│  - Track location changes over time                              │
│  - Identify emerging hubs (growth rate)                          │
│  - Calculate migration patterns                                  │
│  - Predict future talent distribution (time series)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LLM INSIGHTS (via Emergent LLM Key)                             │
│  - Generate location insights:                                   │
│    "San Francisco Bay Area is the largest hub with 150 alumni    │
│     specializing in AI/ML. Notable companies: Google, Meta..."   │
│  - Recommend networking opportunities                            │
│  - Identify underserved markets                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT: Heatmap Data for Frontend                               │
│  - GeoJSON format for map rendering                              │
│  - Cluster markers with details                                  │
│  - Interactive filters (skill, industry, company)                │
│  - Cached in Redis for fast loading                              │
└─────────────────────────────────────────────────────────────────┘
```

#### API Endpoints

```python
# Get global heatmap data
GET /api/ai/heatmap/global?skill=Python&industry=Technology

Response:
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]  # [lng, lat]
      },
      "properties": {
        "location": "San Francisco Bay Area",
        "alumni_count": 150,
        "jobs_count": 45,
        "density": "high",
        "top_skills": ["Python", "React", "ML"],
        "top_companies": ["Google", "Meta", "Apple"],
        "cluster_id": "cluster-1"
      }
    }
  ]
}

# Get cluster details
GET /api/ai/heatmap/cluster/{cluster_id}

Response:
{
  "cluster_id": "cluster-1",
  "cluster_name": "San Francisco Bay Area Tech Hub",
  "center": {"lat": 37.7749, "lng": -122.4194},
  "radius_km": 25,
  "alumni_count": 150,
  "alumni_profiles": [/* top 20 alumni */],
  "dominant_skills": [
    {"skill": "Python", "count": 95},
    {"skill": "React", "count": 78}
  ],
  "companies": [
    {"company": "Google", "alumni_count": 22},
    {"company": "Meta", "alumni_count": 18}
  ],
  "avg_salary_range": "$140,000 - $200,000",
  "job_opportunities": 45,
  "growth_rate": "+15% YoY"
}

# Get emerging talent hubs
GET /api/ai/heatmap/emerging-hubs?timeframe=last_year

Response:
{
  "emerging_hubs": [
    {
      "location": "Austin, TX",
      "growth_rate": 0.35,  # 35% growth
      "alumni_count": 45,
      "reason": "Tech company migrations, lower cost of living"
    },
    {
      "location": "Remote Workers",
      "growth_rate": 0.52,
      "alumni_count": 78
    }
  ]
}
```

#### ML Model Implementation

```python
# File: /app/backend/ai/talent_heatmap.py

from sklearn.cluster import DBSCAN
import numpy as np
from scipy.spatial import distance

class TalentHeatmapAI:
    def __init__(self):
        self.clustering_model = None
        
    async def perform_clustering(self, alumni_locations: list):
        """Cluster alumni by geographic proximity"""
        # Extract coordinates
        coords = np.array([
            [alum['latitude'], alum['longitude']] 
            for alum in alumni_locations
        ])
        
        # DBSCAN clustering (eps in kilometers)
        # eps=0.5 means 50km radius (1 degree ≈ 111km)
        self.clustering_model = DBSCAN(eps=0.5, min_samples=5, metric='haversine')
        
        # Convert to radians for haversine
        coords_rad = np.radians(coords)
        labels = self.clustering_model.fit_predict(coords_rad)
        
        # Group alumni by cluster
        clusters = {}
        for idx, label in enumerate(labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(alumni_locations[idx])
        
        return clusters
    
    async def calculate_cluster_stats(self, cluster_alumni: list):
        """Calculate statistics for a talent cluster"""
        # Count by skills
        skill_counts = {}
        company_counts = {}
        industry_counts = {}
        
        for alum in cluster_alumni:
            for skill in alum.get('skills', []):
                skill_counts[skill] = skill_counts.get(skill, 0) + 1
            
            company = alum.get('current_company')
            if company:
                company_counts[company] = company_counts.get(company, 0) + 1
            
            industry = alum.get('industry')
            if industry:
                industry_counts[industry] = industry_counts.get(industry, 0) + 1
        
        # Sort and get top items
        top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_companies = sorted(company_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_industries = sorted(industry_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "alumni_count": len(cluster_alumni),
            "top_skills": [{"skill": s, "count": c} for s, c in top_skills],
            "top_companies": [{"company": co, "count": c} for co, c in top_companies],
            "top_industries": [{"industry": i, "count": c} for i, c in top_industries]
        }
```

---

### 4. AI-Validated Digital Alumni ID System

#### Purpose
Generate and validate digital alumni ID cards with AI-powered:
- Identity verification (rule-based + pattern matching)
- Duplicate detection
- QR code generation and verification
- Fraud prevention

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  ID CARD GENERATION REQUEST (Alumni user)                        │
│  - User must be verified alumni (is_verified=true)               │
│  - Profile completion >= 80%                                     │
│  - Submit request via frontend                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: RULE-BASED VALIDATION                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1.1 Profile Completeness Check                            │  │
│  │  - Name, email, batch_year, department present            │  │
│  │  - Current employment information exists                   │  │
│  │  - Profile photo uploaded                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1.2 Email Verification Check                              │  │
│  │  - Email domain validation (@alumni.edu)                   │  │
│  │  - Email verification status = true                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1.3 Admin Verification Status                             │  │
│  │  - Profile must be approved by admin                       │  │
│  │  - Check verified_by field is not null                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: AI DUPLICATE DETECTION                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  2.1 Name Similarity Check (Fuzzy Matching)                │  │
│  │  - Use Levenshtein distance                                │  │
│  │  - Check for similar names in alumni_profiles              │  │
│  │  - Threshold: similarity > 0.85                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  2.2 Batch Year + Department Match                         │  │
│  │  - Check if same name exists with same batch_year          │  │
│  │  - Flag for manual review if match found                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  2.3 Photo Similarity (Optional - Computer Vision)         │  │
│  │  - Use face recognition (face_recognition library)         │  │
│  │  - Compare with existing alumni photos                     │  │
│  │  - Flag if similar face found                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: CARD NUMBER GENERATION                                  │
│  - Format: ALM-{YEAR}-{DEPT_CODE}-{SEQUENCE}                    │
│  - Example: ALM-2025-CS-001234                                   │
│  - Ensure uniqueness in alumni_cards table                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: QR CODE DATA GENERATION                                 │
│  - Create encrypted JSON payload:                                │
│    {                                                             │
│      "card_id": "uuid",                                          │
│      "user_id": "uuid",                                          │
│      "name": "John Doe",                                         │
│      "batch_year": 2020,                                         │
│      "card_number": "ALM-2025-CS-001234",                        │
│      "issued_at": "2025-01-20T10:00:00Z",                        │
│      "signature": "encrypted_hash"                               │
│    }                                                             │
│  - Encrypt with AES-256                                          │
│  - Generate QR code image (qrcode library)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: CARD IMAGE GENERATION                                   │
│  - Create digital ID card (PIL/Pillow)                           │
│  - Include: Photo, Name, Batch Year, Department                  │
│  - Add QR code to card                                           │
│  - Save as PNG/PDF (reportlab)                                   │
│  - Upload to S3/file storage                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: STORE IN DATABASE                                       │
│  - Insert record into alumni_cards table                         │
│  - Store encrypted QR data                                       │
│  - Set expiry_date (2 years from issue)                          │
│  - is_active = true                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  VERIFICATION FLOW (when QR code is scanned)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. Decode QR code data                                     │  │
│  │  2. Decrypt payload                                         │  │
│  │  3. Verify signature                                        │  │
│  │  4. Check card_id exists in alumni_cards table              │  │
│  │  5. Check is_active = true                                  │  │
│  │  6. Check expiry_date > current_date                        │  │
│  │  7. Increment verification_count                            │  │
│  │  8. Log verification in alumni_id_verifications table       │  │
│  │  9. Return verification result                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### API Endpoints

```python
# Generate digital alumni ID card
POST /api/ai/alumni-card/generate
Request: {"user_id": "uuid-123"}

Response:
{
  "success": true,
  "data": {
    "card_id": "card-uuid",
    "card_number": "ALM-2025-CS-001234",
    "qr_code_url": "https://storage.com/qr_codes/card-uuid.png",
    "card_image_url": "https://storage.com/alumni_cards/card-uuid.png",
    "card_pdf_url": "https://storage.com/alumni_cards/card-uuid.pdf",
    "issue_date": "2025-01-20",
    "expiry_date": "2027-01-20",
    "is_active": true
  }
}

# Verify alumni card by QR code
POST /api/ai/alumni-card/verify
Request: {"qr_code_data": "encrypted_string"}

Response:
{
  "success": true,
  "valid": true,
  "card_holder": {
    "name": "John Doe",
    "batch_year": 2020,
    "department": "Computer Science",
    "card_number": "ALM-2025-CS-001234",
    "verified_at": "2025-01-20T15:30:00Z"
  },
  "verification_details": {
    "duplicate_check": "passed",
    "expiry_check": "passed",
    "signature_verification": "passed"
  }
}

# Get card details
GET /api/ai/alumni-card/{user_id}

Response:
{
  "card_id": "card-uuid",
  "card_number": "ALM-2025-CS-001234",
  "issue_date": "2025-01-20",
  "expiry_date": "2027-01-20",
  "is_active": true,
  "verification_count": 15,
  "last_verified": "2025-01-19T10:00:00Z"
}
```

#### Implementation

```python
# File: /app/backend/ai/alumni_id_validation.py

from Levenshtein import distance as levenshtein_distance
import qrcode
from cryptography.fernet import Fernet
import json

class AlumniIDValidator:
    def __init__(self, encryption_key: bytes):
        self.cipher = Fernet(encryption_key)
        
    async def check_duplicate_by_name(self, name: str, batch_year: int):
        """Fuzzy name matching to detect duplicates"""
        # Query existing alumni with same batch_year
        existing_alumni = await db.query(
            "SELECT name FROM alumni_profiles WHERE batch_year = ?", 
            (batch_year,)
        )
        
        for existing in existing_alumni:
            similarity = 1 - (levenshtein_distance(name.lower(), existing['name'].lower()) / max(len(name), len(existing['name'])))
            if similarity > 0.85:
                return {
                    "duplicate_found": True,
                    "similar_name": existing['name'],
                    "similarity_score": similarity
                }
        
        return {"duplicate_found": False}
    
    async def generate_qr_code(self, card_data: dict):
        """Generate encrypted QR code"""
        # Encrypt card data
        json_data = json.dumps(card_data)
        encrypted_data = self.cipher.encrypt(json_data.encode())
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(encrypted_data.decode())
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        return img, encrypted_data.decode()
    
    async def verify_qr_code(self, encrypted_data: str):
        """Verify and decrypt QR code data"""
        try:
            decrypted_data = self.cipher.decrypt(encrypted_data.encode())
            card_data = json.loads(decrypted_data.decode())
            
            # Verify signature
            # ... signature verification logic
            
            # Check in database
            card_exists = await db.query(
                "SELECT * FROM alumni_cards WHERE card_id = ? AND is_active = true",
                (card_data['card_id'],)
            )
            
            if card_exists:
                return {"valid": True, "card_data": card_data}
            else:
                return {"valid": False, "reason": "Card not found or inactive"}
                
        except Exception as e:
            return {"valid": False, "reason": "Invalid QR code"}
```

---

### 5. Knowledge Capsules Ranking Engine

#### Purpose
Intelligently rank and recommend knowledge capsules to users based on:
- Content relevance to user's skills/interests
- Engagement metrics (views, likes, bookmarks)
- Author credibility
- Recency and trending score

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  INPUT: User Profile + All Knowledge Capsules                    │
│  - User skills, interests, role, engagement history              │
│  - Capsule: title, content, tags, category, author, metrics      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCORING COMPONENT 1: SKILL MATCH SCORE (0.0 - 1.0)              │
│  - Extract user skills from profile                              │
│  - Extract capsule tags                                          │
│  - Calculate Jaccard similarity:                                 │
│    skill_match = |user_skills ∩ capsule_tags| / |user_skills ∪ capsule_tags| │
│  - Weight: 30%                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCORING COMPONENT 2: ENGAGEMENT SCORE (0.0 - 1.0)               │
│  - Normalize engagement metrics:                                 │
│    engagement = (0.4 * views_norm + 0.35 * likes_norm +          │
│                  0.25 * bookmarks_norm)                          │
│  - Use min-max normalization across all capsules                 │
│  - Weight: 25%                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCORING COMPONENT 3: AUTHOR CREDIBILITY SCORE (0.0 - 1.0)       │
│  - Check author's engagement_score from engagement_scores table  │
│  - Check author's total capsules published                       │
│  - Check author's verification status                            │
│  - credibility = (0.5 * engagement_norm + 0.3 * capsules_norm +  │
│                   0.2 * is_verified)                             │
│  - Weight: 20%                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCORING COMPONENT 4: RECENCY SCORE (0.0 - 1.0)                  │
│  - Calculate age in days: age = (today - created_at).days        │
│  - Decay function: recency = e^(-0.01 * age)                     │
│  - Caps at 100 days old (score → 0)                              │
│  - Weight: 15%                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCORING COMPONENT 5: CONTENT RELEVANCE (LLM-based)              │
│  - Use Emergent LLM Key (GPT/Claude/Gemini)                      │
│  - Prompt: "Given user profile: {profile}, rate relevance of     │
│             capsule: {title} on scale 0-1"                       │
│  - Cache results in Redis                                        │
│  - Weight: 10%                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  FINAL RANKING CALCULATION                                       │
│  final_score = (0.30 * skill_match +                             │
│                 0.25 * engagement +                              │
│                 0.20 * credibility +                             │
│                 0.15 * recency +                                 │
│                 0.10 * content_relevance)                        │
│                                                                   │
│  - Sort capsules by final_score DESC                             │
│  - Store in capsule_rankings table                               │
│  - Cache top 100 per user in Redis (TTL: 1 hour)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT: Ranked Capsule List for User                            │
│  - Top N capsules with scores                                    │
│  - Personalized learning path suggestions                        │
│  - Trending capsules in user's domain                            │
└─────────────────────────────────────────────────────────────────┘
```

#### API Endpoints

```python
# Get personalized ranked capsules
GET /api/ai/knowledge/ranked?user_id=uuid-123&limit=20

Response:
{
  "capsules": [
    {
      "capsule_id": "cap-uuid-1",
      "title": "Advanced React Patterns",
      "author": "Jane Doe",
      "category": "technical",
      "tags": ["React", "JavaScript", "Frontend"],
      "rank_score": 0.87,
      "score_breakdown": {
        "skill_match": 0.92,
        "engagement": 0.78,
        "credibility": 0.95,
        "recency": 0.85,
        "content_relevance": 0.88
      },
      "views_count": 320,
      "likes_count": 45,
      "bookmarks_count": 28,
      "duration_minutes": 10,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}

# Get trending capsules (all users)
GET /api/ai/knowledge/trending?timeframe=week&limit=10

Response:
{
  "trending_capsules": [
    {
      "capsule_id": "cap-uuid-5",
      "title": "Introduction to AI/ML",
      "trending_score": 0.92,
      "views_growth": "+150% this week",
      "tags": ["AI", "Machine Learning"]
    }
  ]
}

# Get learning path recommendations
POST /api/ai/knowledge/learning-path
Request: {"user_id": "uuid-123", "goal": "Become Data Scientist"}

Response:
{
  "learning_path": [
    {
      "step": 1,
      "capsules": [
        {"capsule_id": "cap-1", "title": "Python Basics"},
        {"capsule_id": "cap-2", "title": "Statistics Fundamentals"}
      ],
      "estimated_time": "2 weeks"
    },
    {
      "step": 2,
      "capsules": [
        {"capsule_id": "cap-3", "title": "Machine Learning Introduction"}
      ],
      "estimated_time": "1 month"
    }
  ],
  "personalized_advice": "Based on your existing Python knowledge, you can skip step 1..."
}
```

#### Implementation

```python
# File: /app/backend/ai/capsule_ranking.py

import numpy as np
from datetime import datetime, timedelta

class CapsuleRankingEngine:
    def __init__(self):
        self.weights = {
            "skill_match": 0.30,
            "engagement": 0.25,
            "credibility": 0.20,
            "recency": 0.15,
            "content_relevance": 0.10
        }
    
    async def calculate_skill_match(self, user_skills: list, capsule_tags: list):
        """Jaccard similarity between user skills and capsule tags"""
        user_set = set([s.lower() for s in user_skills])
        capsule_set = set([t.lower() for t in capsule_tags])
        
        intersection = len(user_set.intersection(capsule_set))
        union = len(user_set.union(capsule_set))
        
        if union == 0:
            return 0.0
        
        return intersection / union
    
    async def calculate_engagement_score(self, capsule: dict, all_capsules: list):
        """Normalize engagement metrics"""
        # Get max values for normalization
        max_views = max([c['views_count'] for c in all_capsules])
        max_likes = max([c['likes_count'] for c in all_capsules])
        max_bookmarks = max([c['bookmarks_count'] for c in all_capsules])
        
        # Normalize
        views_norm = capsule['views_count'] / max_views if max_views > 0 else 0
        likes_norm = capsule['likes_count'] / max_likes if max_likes > 0 else 0
        bookmarks_norm = capsule['bookmarks_count'] / max_bookmarks if max_bookmarks > 0 else 0
        
        # Weighted combination
        engagement = 0.4 * views_norm + 0.35 * likes_norm + 0.25 * bookmarks_norm
        return engagement
    
    async def calculate_recency_score(self, created_at: datetime):
        """Exponential decay based on age"""
        age_days = (datetime.now() - created_at).days
        recency = np.exp(-0.01 * age_days)
        return max(0, recency)  # Ensure non-negative
    
    async def get_llm_relevance(self, user_profile: dict, capsule: dict):
        """Use LLM to assess content relevance"""
        # Use Emergent LLM Key
        prompt = f"""
        User Profile:
        - Role: {user_profile.get('current_role')}
        - Skills: {', '.join(user_profile.get('skills', []))}
        - Interests: {', '.join(user_profile.get('interests', []))}
        
        Knowledge Capsule:
        - Title: {capsule['title']}
        - Category: {capsule['category']}
        - Tags: {', '.join(capsule['tags'])}
        
        Rate the relevance of this capsule to this user on a scale of 0.0 to 1.0.
        Respond with just the number.
        """
        
        # Call LLM API (cached in Redis)
        # relevance = await llm_api.call(prompt)
        relevance = 0.8  # Placeholder
        return relevance
    
    async def rank_capsules(self, user_id: str, capsules: list):
        """Calculate final ranking for all capsules"""
        # Get user profile
        user_profile = await db.get_user_profile(user_id)
        user_skills = user_profile.get('skills', [])
        
        ranked_capsules = []
        
        for capsule in capsules:
            # Calculate each score component
            skill_match = await self.calculate_skill_match(user_skills, capsule['tags'])
            engagement = await self.calculate_engagement_score(capsule, capsules)
            credibility = await self.calculate_author_credibility(capsule['author_id'])
            recency = await self.calculate_recency_score(capsule['created_at'])
            content_relevance = await self.get_llm_relevance(user_profile, capsule)
            
            # Calculate final score
            final_score = (
                self.weights['skill_match'] * skill_match +
                self.weights['engagement'] * engagement +
                self.weights['credibility'] * credibility +
                self.weights['recency'] * recency +
                self.weights['content_relevance'] * content_relevance
            )
            
            ranked_capsules.append({
                "capsule": capsule,
                "rank_score": final_score,
                "score_breakdown": {
                    "skill_match": skill_match,
                    "engagement": engagement,
                    "credibility": credibility,
                    "recency": recency,
                    "content_relevance": content_relevance
                }
            })
        
        # Sort by final score
        ranked_capsules.sort(key=lambda x: x['rank_score'], reverse=True)
        
        return ranked_capsules
```

---

### 6. Engagement Scoring Model

#### Purpose
Gamify platform engagement by:
- Calculating user engagement scores based on multiple factors
- Generating dynamic leaderboards
- Awarding badges and achievements
- Encouraging active participation

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  ENGAGEMENT FACTORS (Weighted Scoring)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Factor 1: Profile Completeness (Max: 20 points)           │  │
│  │  - Profile completion % × 0.2                              │  │
│  │  - Profile photo: +5 points                                │  │
│  │  - CV uploaded: +5 points                                  │  │
│  │  - Social links: +5 points                                 │  │
│  │  - Admin verified: +5 points                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Factor 2: Mentorship Activity (Max: 30 points)            │  │
│  │  - Sessions completed: 10 points per session               │  │
│  │  - Sessions rated 5-star: +5 bonus points                  │  │
│  │  - Active mentees: 3 points per mentee                     │  │
│  │  - Mentor rating > 4.5: +10 bonus points                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Factor 3: Job Portal Activity (Max: 20 points)            │  │
│  │  - Jobs posted (recruiter/alumni): 5 points per job        │  │
│  │  - Applications submitted (student): 2 points per app      │  │
│  │  - Successful hires: +15 bonus points                      │  │
│  │  - Getting hired: +20 bonus points                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Factor 4: Event Participation (Max: 15 points)            │  │
│  │  - Events created: 8 points per event                      │  │
│  │  - Events attended: 3 points per event                     │  │
│  │  - Event RSVP with attendance: +2 bonus points             │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Factor 5: Community Forum (Max: 15 points)                │  │
│  │  - Forum posts created: 5 points per post                  │  │
│  │  - Comments: 2 points per comment                          │  │
│  │  - Likes received: 0.5 points per like                     │  │
│  │  - Helpful comments (upvoted): +1 bonus per 10 upvotes     │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Factor 6: Knowledge Sharing (Max: 20 points)              │  │
│  │  - Capsules published: 10 points per capsule               │  │
│  │  - Capsule views: 0.1 points per view                      │  │
│  │  - Capsule likes: 1 point per like                         │  │
│  │  - Capsule bookmarked: 2 points per bookmark               │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Factor 7: Platform Activity (Max: 10 points)              │  │
│  │  - Days since last login: -0.5 points per day (max -10)    │  │
│  │  - Consecutive login streak: +0.5 points per day           │  │
│  │  - Weekly active: +5 points                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  TOTAL SCORE CALCULATION                                         │
│  total_score = Σ(all factor scores)                              │
│  - Store in engagement_scores table                              │
│  - Update contribution_history table                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL ASSIGNMENT (Based on Total Score)                         │
│  - Beginner: 0-50 points                                         │
│  - Active: 51-150 points                                         │
│  - Contributor: 151-300 points                                   │
│  - Veteran: 301-500 points                                       │
│  - Legend: 501+ points                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  BADGE AWARD SYSTEM                                              │
│  - Check badge requirements                                      │
│  - Award new badges if criteria met                              │
│  - Send notification on new badge                                │
│  - Store in user_badges table                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LEADERBOARD GENERATION                                          │
│  - Rank all users by total_score                                 │
│  - Update rank_position in engagement_scores table               │
│  - Cache top 100 in Redis sorted set                             │
│  - Generate monthly/yearly leaderboards                          │
└─────────────────────────────────────────────────────────────────┘
```

#### API Endpoints

```python
# Get user engagement score
GET /api/ai/engagement/user/{user_id}

Response:
{
  "user_id": "uuid-123",
  "total_score": 285,
  "rank_position": 15,
  "level": "Contributor",
  "contributions": {
    "profile": 20,
    "mentorship": 90,
    "jobs": 40,
    "events": 30,
    "forum": 45,
    "knowledge": 50,
    "activity": 10
  },
  "last_calculated": "2025-01-20T10:00:00Z",
  "badges_earned": 8,
  "next_level": {
    "level": "Veteran",
    "points_needed": 16
  }
}

# Get leaderboard
GET /api/ai/engagement/leaderboard?timeframe=all_time&limit=50

Response:
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "uuid-456",
      "name": "Jane Doe",
      "photo_url": "...",
      "total_score": 650,
      "level": "Legend",
      "badges_count": 12
    },
    {
      "rank": 2,
      "user_id": "uuid-789",
      "name": "John Smith",
      "total_score": 580,
      "level": "Legend"
    }
  ],
  "current_user_rank": {
    "rank": 15,
    "total_score": 285
  }
}

# Get contribution history
GET /api/ai/engagement/history/{user_id}?limit=20

Response:
{
  "contributions": [
    {
      "id": "cont-1",
      "type": "mentorship_session",
      "points_earned": 10,
      "description": "Completed mentorship session",
      "created_at": "2025-01-20T10:00:00Z"
    },
    {
      "id": "cont-2",
      "type": "forum_post",
      "points_earned": 5,
      "description": "Created forum post",
      "created_at": "2025-01-19T15:30:00Z"
    }
  ],
  "total_contributions": 28
}

# Recalculate engagement score (admin/trigger)
POST /api/ai/engagement/recalculate
Request: {"user_id": "uuid-123"}  # or "all" for batch

Response:
{
  "success": true,
  "users_updated": 1,
  "processing_time_ms": 450
}
```

#### Implementation

```python
# File: /app/backend/ai/engagement_scoring.py

class EngagementScoringModel:
    def __init__(self):
        self.weights = {
            "profile": {"max": 20, "weight": 1.0},
            "mentorship": {"max": 30, "weight": 1.5},
            "jobs": {"max": 20, "weight": 1.0},
            "events": {"max": 15, "weight": 0.8},
            "forum": {"max": 15, "weight": 0.8},
            "knowledge": {"max": 20, "weight": 1.2},
            "activity": {"max": 10, "weight": 0.5}
        }
        
        self.levels = [
            {"name": "Beginner", "min": 0, "max": 50},
            {"name": "Active", "min": 51, "max": 150},
            {"name": "Contributor", "min": 151, "max": 300},
            {"name": "Veteran", "min": 301, "max": 500},
            {"name": "Legend", "min": 501, "max": float('inf')}
        ]
    
    async def calculate_profile_score(self, profile: dict):
        """Calculate profile completeness score"""
        score = 0
        
        # Base completeness
        score += profile.get('profile_completion_percentage', 0) * 0.2
        
        # Bonuses
        if profile.get('photo_url'):
            score += 5
        if profile.get('cv_url'):
            score += 5
        if profile.get('social_links'):
            score += 5
        if profile.get('is_verified'):
            score += 5
        
        return min(score, self.weights['profile']['max'])
    
    async def calculate_mentorship_score(self, user_id: str):
        """Calculate mentorship activity score"""
        score = 0
        
        # Count completed sessions
        sessions = await db.query("""
            SELECT COUNT(*) as count, AVG(rating) as avg_rating
            FROM mentorship_sessions ms
            JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.id
            WHERE (mr.mentor_id = ? OR mr.student_id = ?)
            AND ms.status = 'completed'
        """, (user_id, user_id))
        
        score += sessions['count'] * 10
        
        # 5-star bonus
        if sessions['avg_rating'] == 5.0:
            score += 5
        
        # Get mentor specific data
        mentor_data = await db.get_mentor_profile(user_id)
        if mentor_data:
            score += mentor_data['current_mentees_count'] * 3
            if mentor_data['rating'] > 4.5:
                score += 10
        
        return min(score, self.weights['mentorship']['max'])
    
    async def calculate_total_score(self, user_id: str):
        """Calculate total engagement score"""
        profile = await db.get_user_profile(user_id)
        
        scores = {
            "profile": await self.calculate_profile_score(profile),
            "mentorship": await self.calculate_mentorship_score(user_id),
            "jobs": await self.calculate_jobs_score(user_id),
            "events": await self.calculate_events_score(user_id),
            "forum": await self.calculate_forum_score(user_id),
            "knowledge": await self.calculate_knowledge_score(user_id),
            "activity": await self.calculate_activity_score(user_id)
        }
        
        total_score = sum(scores.values())
        
        # Determine level
        level = "Beginner"
        for l in self.levels:
            if l['min'] <= total_score <= l['max']:
                level = l['name']
                break
        
        # Save to database
        await db.execute("""
            INSERT INTO engagement_scores (user_id, total_score, contributions, level, last_calculated)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                total_score = VALUES(total_score),
                contributions = VALUES(contributions),
                level = VALUES(level),
                last_calculated = NOW()
        """, (user_id, total_score, json.dumps(scores), level))
        
        return {
            "total_score": total_score,
            "level": level,
            "contributions": scores
        }
    
    async def update_leaderboard(self):
        """Update global leaderboard rankings"""
        # Rank all users by score
        await db.execute("""
            SET @rank = 0;
            UPDATE engagement_scores
            SET rank_position = (@rank := @rank + 1)
            ORDER BY total_score DESC;
        """)
        
        # Cache top 100 in Redis
        top_users = await db.query("""
            SELECT user_id, total_score, rank_position
            FROM engagement_scores
            ORDER BY total_score DESC
            LIMIT 100
        """)
        
        # Store in Redis sorted set
        for user in top_users:
            await redis.zadd('leaderboard:global', {user['user_id']: user['total_score']})
```

---

## 🔌 API Architecture

### API Organization

All APIs follow RESTful conventions with `/api` prefix (mandatory for Kubernetes ingress).

```
/api
├── /auth                    # Authentication & Authorization
├── /admin                   # Admin-specific endpoints
│   ├── /datasets            # Dataset upload & management
│   ├── /verifications       # Profile verifications
│   └── /analytics           # Admin analytics
├── /ai                      # AI System Endpoints
│   ├── /skill-graph         # Skill Graph AI
│   ├── /career-path         # Career Prediction
│   ├── /heatmap             # Talent Heatmap
│   ├── /alumni-card         # Digital ID Validation
│   ├── /knowledge           # Capsule Ranking
│   └── /engagement          # Engagement Scoring
├── /profiles                # User profiles
├── /directory               # Alumni directory
├── /jobs                    # Job management
├── /applications            # Job applications
├── /mentors                 # Mentor profiles
├── /mentorship              # Mentorship system
├── /events                  # Events management
├── /forum                   # Community forum
├── /notifications           # Notifications
├── /leaderboard             # Engagement leaderboard
├── /badges                  # Achievement badges
├── /capsules                # Knowledge capsules
└── /health                  # Health check
```

### Complete API Endpoint List (100+ endpoints)

See `/app/BACKEND_API_SPECIFICATION.md` for detailed API documentation.

---

## ⚙️ Background Job Processing

### Celery Task Queue Architecture

```python
# File: /app/backend/celery_app.py

from celery import Celery
from kombu import Queue

# Initialize Celery
celery_app = Celery('alumni_portal')
celery_app.config_from_object({
    'broker_url': 'redis://localhost:6379/0',
    'result_backend': 'redis://localhost:6379/0',
    'task_serializer': 'json',
    'result_serializer': 'json',
    'accept_content': ['json'],
    'timezone': 'UTC',
    'enable_utc': True,
    'task_routes': {
        'ai.*': {'queue': 'ai_processing'},
        'upload.*': {'queue': 'file_processing'},
        'notifications.*': {'queue': 'notifications'},
    }
})

# Define queues
celery_app.conf.task_queues = (
    Queue('default'),
    Queue('ai_processing', priority=10),
    Queue('file_processing', priority=8),
    Queue('notifications', priority=5),
)
```

### Background Tasks

```python
# File: /app/backend/tasks/ai_tasks.py

from celery_app import celery_app
from ai.skill_graph import SkillGraphAI
from ai.career_prediction import CareerPathPredictor
# ... other AI imports

@celery_app.task(name='ai.update_skill_graph')
async def update_skill_graph_task():
    """Background task to update skill graph"""
    skill_graph = SkillGraphAI()
    
    # Extract all skills
    skills = await db.query("SELECT DISTINCT JSON_EXTRACT(skills, '$[*]') FROM alumni_profiles")
    
    # Generate embeddings
    embeddings = await skill_graph.generate_embeddings(skills)
    
    # Store in database
    for skill, embedding in embeddings.items():
        await db.execute(
            "INSERT INTO skill_embeddings (skill_name, embedding_vector) VALUES (?, ?) ON DUPLICATE KEY UPDATE embedding_vector = VALUES(embedding_vector)",
            (skill, json.dumps(embedding))
        )
    
    # Build FAISS index
    await skill_graph.build_faiss_index(embeddings)
    
    return {"status": "completed", "skills_processed": len(skills)}

@celery_app.task(name='ai.retrain_career_model')
async def retrain_career_model_task(college_id: str = None):
    """Background task to retrain career prediction model"""
    predictor = CareerPathPredictor()
    
    # Fetch training data
    training_data = await db.query("""
        SELECT * FROM career_paths
        WHERE college_id = ? OR ? IS NULL
    """, (college_id, college_id))
    
    # Train model
    await predictor.train_model(training_data)
    
    # Save model metadata
    await db.execute("""
        INSERT INTO ml_models (model_name, model_version, model_type, status, trained_at)
        VALUES ('career_predictor', ?, 'classification', 'active', NOW())
    """, (f"v{datetime.now().strftime('%Y%m%d')}",))
    
    return {"status": "completed", "training_samples": len(training_data)}

@celery_app.task(name='upload.process_dataset')
async def process_dataset_task(upload_id: str):
    """Background task to process uploaded dataset"""
    # Update status
    await db.execute(
        "UPDATE dataset_uploads SET status = 'processing', processing_start_time = NOW() WHERE id = ?",
        (upload_id,)
    )
    
    try:
        # Get upload details
        upload = await db.query_one("SELECT * FROM dataset_uploads WHERE id = ?", (upload_id,))
        
        # 1. Validation
        validation_result = await validate_dataset(upload['file_url'])
        await log_processing_stage(upload_id, 'validation', 'completed', validation_result)
        
        # 2. Cleaning
        cleaned_data = await clean_dataset(upload['file_url'])
        await log_processing_stage(upload_id, 'cleaning', 'completed')
        
        # 3. AI Processing
        if upload['file_type'] == 'alumni':
            await update_skill_graph_task.delay()
            await retrain_career_model_task.delay()
            # ... trigger other AI tasks
        
        # 4. Storage
        await store_cleaned_data(cleaned_data)
        
        # Update status
        await db.execute(
            "UPDATE dataset_uploads SET status = 'completed', processing_end_time = NOW() WHERE id = ?",
            (upload_id,)
        )
        
        # Send notification to admin
        await send_notification_task.delay(upload['uploaded_by'], f"Dataset {upload['file_name']} processed successfully")
        
    except Exception as e:
        await db.execute(
            "UPDATE dataset_uploads SET status = 'failed', error_log = ? WHERE id = ?",
            (str(e), upload_id)
        )
        raise

@celery_app.task(name='notifications.send_notification')
async def send_notification_task(user_id: str, message: str):
    """Background task to send notifications"""
    # Create notification in database
    await db.execute("""
        INSERT INTO notifications (user_id, type, title, message, created_at)
        VALUES (?, 'system', 'System Notification', ?, NOW())
    """, (user_id, message))
    
    # Send email (if enabled)
    user = await db.query_one("SELECT email FROM users WHERE id = ?", (user_id,))
    await send_email(user['email'], "Notification", message)
    
    # Push to real-time (WebSocket)
    await websocket_manager.send_to_user(user_id, {"type": "notification", "message": message})
```

### Task Monitoring

```python
# File: /app/backend/api/admin/tasks.py

@api_router.get("/admin/tasks/status")
async def get_task_status():
    """Get status of background tasks"""
    inspect = celery_app.control.inspect()
    
    active_tasks = inspect.active()
    scheduled_tasks = inspect.scheduled()
    
    return {
        "active": active_tasks,
        "scheduled": scheduled_tasks,
        "workers": len(active_tasks or {})
    }
```

---

## 💾 Caching Strategy

### Redis Cache Keys & TTL

```python
# File: /app/backend/cache/redis_client.py

import redis.asyncio as aioredis
import json

class RedisCache:
    def __init__(self):
        self.redis = aioredis.from_url('redis://localhost:6379/0')
    
    # API Response Caching
    async def cache_api_response(self, key: str, data: dict, ttl: int = 300):
        """Cache API response with TTL"""
        await self.redis.setex(key, ttl, json.dumps(data))
    
    async def get_cached_response(self, key: str):
        """Get cached API response"""
        data = await self.redis.get(key)
        return json.loads(data) if data else None
    
    # Leaderboard Caching (Sorted Set)
    async def update_leaderboard(self, leaderboard_name: str, user_id: str, score: float):
        """Update leaderboard (sorted set)"""
        await self.redis.zadd(f"leaderboard:{leaderboard_name}", {user_id: score})
    
    async def get_leaderboard(self, leaderboard_name: str, limit: int = 100):
        """Get top N from leaderboard"""
        result = await self.redis.zrevrange(
            f"leaderboard:{leaderboard_name}", 
            0, limit-1, 
            withscores=True
        )
        return [{"user_id": user, "score": score} for user, score in result]
    
    # AI Model Cache
    async def cache_embedding(self, skill_name: str, embedding: list):
        """Cache skill embedding"""
        await self.redis.hset("embeddings", skill_name, json.dumps(embedding))
    
    async def get_embedding(self, skill_name: str):
        """Get cached embedding"""
        data = await self.redis.hget("embeddings", skill_name)
        return json.loads(data) if data else None

# Usage in API endpoints
cache = RedisCache()

@api_router.get("/api/jobs")
async def get_jobs(filters: dict = None):
    # Create cache key from filters
    cache_key = f"api:jobs:{hash(str(filters))}"
    
    # Try cache first
    cached_data = await cache.get_cached_response(cache_key)
    if cached_data:
        return cached_data
    
    # Query database
    jobs = await db.query("SELECT * FROM jobs WHERE status = 'active'")
    
    # Cache for 5 minutes
    await cache.cache_api_response(cache_key, jobs, ttl=300)
    
    return jobs
```

---

## 🔒 Security & Authentication

### JWT Token Management

```python
# File: /app/backend/auth/jwt_handler.py

from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Dependency for protected routes
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user_id = payload.get("sub")
    user = await db.query_one("SELECT * FROM users WHERE id = ?", (user_id,))
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user
```

### Rate Limiting

```python
# File: /app/backend/middleware/rate_limiter.py

from fastapi import Request, HTTPException
import time

class RateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def check_rate_limit(self, request: Request, max_requests: int = 100, window: int = 60):
        """
        Check if user exceeded rate limit
        max_requests: Maximum requests allowed
        window: Time window in seconds
        """
        # Get user ID from token or IP
        user_id = request.state.user.get('id') if hasattr(request.state, 'user') else request.client.host
        
        # Create rate limit key
        key = f"rate_limit:{user_id}:{request.url.path}"
        
        # Increment counter
        current = await self.redis.incr(key)
        
        if current == 1:
            # First request, set expiry
            await self.redis.expire(key, window)
        
        if current > max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Max {max_requests} requests per {window} seconds"
            )
        
        return True

# Middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        rate_limiter = RateLimiter(redis_client)
        await rate_limiter.check_rate_limit(request)
    
    response = await call_next(request)
    return response
```

---

## 📝 Error Handling & Logging

### Structured Logging

```python
# File: /app/backend/logging_config.py

import logging
from pythonjsonlogger import jsonlogger

# Configure JSON logging
logger = logging.getLogger("alumni_portal")
logHandler = logging.StreamHandler()

formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d'
)
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

# Usage
logger.info("User logged in", extra={
    "user_id": "uuid-123",
    "ip_address": "192.168.1.1",
    "action": "login"
})
```

### Global Exception Handler

```python
# File: /app/backend/middleware/error_handler.py

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", extra={
        "path": request.url.path,
        "method": request.method,
        "error": str(exc)
    })
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error_code": "INTERNAL_ERROR"
        }
    )
```

---

## 🚀 Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer (Nginx)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  FastAPI Pods    │  │   Celery Workers │  │  Redis Pods   │ │
│  │  (3 replicas)    │  │   (5 workers)    │  │  (2 replicas) │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              MySQL RDS (Master + Read Replica)                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      S3 / File Storage                           │
│  - Uploaded datasets                                             │
│  - Generated reports                                             │
│  - ML model files                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variables

```bash
# /app/backend/.env

# Database
DB_HOST=mysql-host
DB_PORT=3306
DB_USER=alumni_user
DB_PASSWORD=secure_password
DB_NAME=alumni_portal

# Redis
REDIS_URL=redis://redis-host:6379/0

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256

# Celery
CELERY_BROKER_URL=redis://redis-host:6379/0
CELERY_RESULT_BACKEND=redis://redis-host:6379/0

# File Storage
S3_BUCKET=alumunity-files
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Emergent LLM Key
EMERGENT_LLM_KEY=your-emergent-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@alumni.edu
SMTP_PASSWORD=email-password

# Monitoring
SENTRY_DSN=your-sentry-dsn

# CORS
CORS_ORIGINS=https://alumni.edu,https://www.alumni.edu
```

---

## 🔗 Frontend Integration

### How Frontend Pages Use AI Systems

| Frontend Page | AI System Used | API Endpoints |
|--------------|----------------|---------------|
| **Skill Graph** | Skill Graph AI | `/api/ai/skill-graph/network`, `/api/ai/skill-graph/related/{skill}` |
| **Career Paths** | Career Path Prediction | `/api/ai/career-path/predict`, `/api/ai/career-path/transitions` |
| **Talent Heatmap** | Talent Heatmap Intelligence | `/api/ai/heatmap/global`, `/api/ai/heatmap/cluster/{id}` |
| **Alumni Card** | AI-Validated Digital ID | `/api/ai/alumni-card/generate`, `/api/ai/alumni-card/verify` |
| **Knowledge Capsules** | Capsule Ranking Engine | `/api/ai/knowledge/ranked`, `/api/ai/knowledge/trending` |
| **Leaderboard** | Engagement Scoring | `/api/ai/engagement/leaderboard`, `/api/ai/engagement/user/{id}` |
| **Alumni Directory** | Skill Graph AI (matching) | `/api/ai/skill-graph/match-alumni` |
| **Jobs** | Career Path Prediction (recommendations) | `/api/ai/career-path/learning-path` |
| **Admin Dashboard** | All AI Systems | `/api/admin/datasets/upload`, `/api/admin/datasets/uploads` |

### WebSocket for Real-time Updates

```python
# File: /app/backend/websocket/manager.py

from fastapi import WebSocket
from typing import Dict, List

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    async def disconnect(self, user_id: str, websocket: WebSocket):
        self.active_connections[user_id].remove(websocket)
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages
    except WebSocketDisconnect:
        await ws_manager.disconnect(user_id, websocket)
```

---

## 📊 Monitoring & Metrics

### Prometheus Metrics

```python
# File: /app/backend/metrics.py

from prometheus_client import Counter, Histogram, Gauge

# Request metrics
request_count = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'endpoint'])

# AI metrics
ai_processing_time = Histogram('ai_processing_duration_seconds', 'AI processing time', ['ai_system'])
ai_queue_size = Gauge('ai_queue_size', 'AI processing queue size', ['queue_name'])

# Database metrics
db_query_duration = Histogram('db_query_duration_seconds', 'Database query duration', ['query_type'])

# Middleware for metrics
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    request_count.labels(method=request.method, endpoint=request.url.path, status=response.status_code).inc()
    request_duration.labels(method=request.method, endpoint=request.url.path).observe(duration)
    
    return response
```

---

## ✅ Implementation Checklist

### Phase 1: Infrastructure Setup
- [ ] Set up MySQL database with updated schema
- [ ] Configure Redis cache
- [ ] Set up Celery workers
- [ ] Configure S3/file storage
- [ ] Set up monitoring (Prometheus + Grafana)

### Phase 2: Core APIs
- [ ] Implement authentication endpoints
- [ ] Implement profile management
- [ ] Implement job portal APIs
- [ ] Implement event management
- [ ] Implement forum APIs

### Phase 3: Admin Dataset Upload
- [ ] Implement file upload endpoint
- [ ] Create validation pipeline
- [ ] Create data cleaning pipeline
- [ ] Implement progress tracking
- [ ] Create notification system

### Phase 4: AI Systems
- [ ] **Skill Graph AI**: Embeddings + similarity
- [ ] **Career Path Prediction**: ML model training
- [ ] **Talent Heatmap**: Clustering algorithm
- [ ] **Alumni ID Validation**: QR generation + verification
- [ ] **Capsule Ranking**: Ranking algorithm
- [ ] **Engagement Scoring**: Score calculation

### Phase 5: Background Jobs
- [ ] Implement dataset processing tasks
- [ ] Implement AI training tasks
- [ ] Implement notification tasks
- [ ] Set up task monitoring

### Phase 6: Caching & Optimization
- [ ] Implement Redis caching for APIs
- [ ] Cache AI model outputs
- [ ] Optimize database queries
- [ ] Add database indexes

### Phase 7: Testing & Deployment
- [ ] Unit tests for AI systems
- [ ] Integration tests for APIs
- [ ] Load testing
- [ ] Deploy to production

---

## 📚 Additional Documentation

- **API Reference**: `/app/BACKEND_API_SPECIFICATION.md`
- **Database Schema**: `/app/database_schema.sql`
- **Frontend Integration**: `/app/FRONTEND_WORKFLOW.md`
- **Deployment Guide**: `/app/DEPLOYMENT_GUIDE.md` (to be created)

---

## 🎯 Success Metrics

### Performance Targets
- **API Response Time**: < 100ms (cached), < 500ms (database queries)
- **AI Processing Time**: 
  - Skill Graph Update: < 5 minutes
  - Career Prediction: < 2 seconds per user
  - Talent Clustering: < 10 minutes for full recalculation
- **Dataset Processing**: 1000 rows per minute
- **Uptime**: 99.9%

### Scalability Targets
- Support 10,000+ active users
- Process 100+ dataset uploads per day
- Handle 1M+ API requests per day
- Store 100K+ alumni profiles

---

## 📞 Contact & Support

For questions or issues:
- Backend Architecture: Contact DevOps team
- AI Systems: Contact ML team
- API Issues: Contact Backend team

---

**Document Version**: 2.0  
**Last Updated**: January 2025  
**Status**: Production-Ready Architecture  
**Reviewed By**: Technical Architecture Team

---

**END OF UPDATED BACKEND WORKFLOW DOCUMENTATION**
