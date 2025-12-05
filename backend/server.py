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

# Import routes
from routes.auth import router as auth_router
from routes.profiles import router as profiles_router
from routes.admin import router as admin_router
from routes.jobs import router as jobs_router
from routes.applications import router as applications_router
from routes.recruiter import router as recruiter_router
from routes.mentorship import router as mentorship_router

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
        
        # Start background cleanup task for rate limiter
        asyncio.create_task(periodic_cleanup())
        logger.info("✅ Rate limiter cleanup task started")
        
        logger.info("🚀 AlumUnity API started successfully")
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