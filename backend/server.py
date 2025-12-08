"""
AlumUnity Backend Server
FastAPI application for Alumni Management System
"""
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import asyncio

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import database connection
from database.connection import get_db_pool, close_db_pool

# Import Phase 10.1 infrastructure
from redis_client import get_redis_client, close_redis_client
from storage import file_storage

# Import routes
from routes.auth import router as auth_router
from routes.profiles import router as profiles_router
from routes.admin import router as admin_router
from routes.jobs import router as jobs_router
from routes.applications import router as applications_router
from routes.recruiter import router as recruiter_router
from routes.mentorship import router as mentorship_router
from routes.events import router as events_router
from routes.forum import router as forum_router
from routes.notifications import router as notifications_router

# Import Phase 7 routes - Admin Dashboard & Analytics
from routes.admin_dashboard import router as admin_dashboard_router
from routes.analytics import router as analytics_router
from routes.admin_users import router as admin_users_router
from routes.admin_content import router as admin_content_router
from routes.admin_settings import router as admin_settings_router

# Import Phase 8 routes - Smart Algorithms & Matching
from routes.matching import router as matching_router
from routes.recommendations import router as recommendations_router
from routes.engagement import router as engagement_router

# Import Phase 9 routes - Innovative Features
from routes.capsules import router as capsules_router
from routes.aes import router as aes_router
from routes.skill_graph import router as skill_graph_router
from routes.career_paths import router as career_paths_router
from routes.alumni_card import router as alumni_card_router
from routes.heatmap import router as heatmap_router

# Import Phase 10.2 routes - Admin Dataset Upload
from routes.datasets import router as datasets_router

# Import middleware
from middleware.rate_limit import rate_limiter

# Create FastAPI app
app = FastAPI(
    title="AlumUnity API",
    description="Alumni Management System API with AI Features",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# Root endpoint
@api_router.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AlumUnity API",
        "version": "1.0.0",
        "status": "running"
    }

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint to verify database connection"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT 1")
                await cursor.fetchone()
        return {
            "status": "healthy",
            "database": "connected",
            "service": "AlumUnity API"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# Include authentication routes
api_router.include_router(auth_router)

# Include profile routes (Phase 2)
app.include_router(profiles_router)

# Include admin routes (Phase 2)
app.include_router(admin_router)

# Include job routes (Phase 3)
app.include_router(jobs_router)

# Include application routes (Phase 3)
app.include_router(applications_router)

# Include recruiter dashboard routes (Phase 3)
app.include_router(recruiter_router)

# Include mentorship routes (Phase 4)
app.include_router(mentorship_router)

# Include event routes (Phase 5)
app.include_router(events_router)

# Include forum routes (Phase 5)
app.include_router(forum_router)

# Include notification routes (Phase 6)
app.include_router(notifications_router)

# Include Phase 7 routes - Admin Dashboard & Analytics
app.include_router(admin_dashboard_router)
app.include_router(analytics_router)
app.include_router(admin_users_router)
app.include_router(admin_content_router)
app.include_router(admin_settings_router)

# Include Phase 8 routes - Smart Algorithms & Recommendations
app.include_router(matching_router)
app.include_router(recommendations_router)
app.include_router(engagement_router)

# Include Phase 9 routes - Innovative Features
app.include_router(capsules_router)
app.include_router(aes_router)
app.include_router(skill_graph_router)
app.include_router(career_paths_router)
app.include_router(alumni_card_router)
app.include_router(heatmap_router)

# Include Phase 10.2 routes - Admin Dataset Upload
app.include_router(datasets_router)

# Include API router in main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup():
    """Initialize services on startup"""
    try:
        # Initialize database pool
        await get_db_pool()
        logger.info("✅ Database connection pool initialized")
        
        # Initialize Redis (Phase 10.1)
        try:
            await get_redis_client()
            logger.info("✅ Redis connection established")
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {str(e)} - Continuing without Redis")
        
        # Initialize file storage (Phase 10.1)
        logger.info(f"✅ File storage initialized ({file_storage.storage_type})")
        
        # Start background cleanup task for rate limiter
        asyncio.create_task(periodic_cleanup())
        logger.info("✅ Rate limiter cleanup task started")
        
        logger.info("🚀 AlumUnity API started successfully")
        logger.info("📋 Phase 10.1: Infrastructure Setup - Active")
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    try:
        await close_db_pool()
        logger.info("✅ Database connection pool closed")
        
        # Close Redis connection (Phase 10.1)
        try:
            await close_redis_client()
            logger.info("✅ Redis connection closed")
        except Exception as e:
            logger.warning(f"⚠️ Redis close warning: {str(e)}")
        
        logger.info("👋 AlumUnity API shutdown complete")
    except Exception as e:
        logger.error(f"❌ Shutdown error: {str(e)}")

# Background task for rate limiter cleanup
async def periodic_cleanup():
    """Periodic cleanup of rate limiter entries"""
    while True:
        try:
            await asyncio.sleep(3600)  # Run every hour
            await rate_limiter.cleanup_old_entries()
        except Exception as e:
            logger.error(f"Rate limiter cleanup error: {str(e)}")