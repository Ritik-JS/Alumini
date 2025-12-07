"""Admin dashboard routes"""
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional

from database.models import (
    DashboardMetrics, DashboardCharts, AdminActionResponse,
    UserResponse
)
from services.analytics_service import AnalyticsService
from services.admin_service import AdminService
from middleware.auth_middleware import get_current_user, require_admin

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get key metrics for admin dashboard
    
    **Admin only**
    
    Returns:
    - Total users by role
    - Verified alumni count
    - Pending verifications
    - Job statistics
    - Event statistics
    - Mentorship statistics
    - Forum statistics
    """
    try:
        metrics = await AnalyticsService.get_dashboard_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/charts", response_model=DashboardCharts)
async def get_dashboard_charts(
    days: int = Query(30, ge=7, le=365, description="Number of days to fetch data for"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get chart data for admin dashboard
    
    **Admin only**
    
    Returns time-series data for:
    - User growth
    - Job posting trends
    - Event participation
    - Mentorship activity
    """
    try:
        charts = await AnalyticsService.get_dashboard_charts(days=days)
        return charts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit-log")
async def get_audit_log(
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    admin_id: Optional[str] = Query(None, description="Filter by admin ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Get admin action audit log
    
    **Admin only**
    
    Returns paginated list of all admin actions with details
    """
    try:
        result = await AdminService.get_audit_log(
            action_type=action_type,
            admin_id=admin_id,
            page=page,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
