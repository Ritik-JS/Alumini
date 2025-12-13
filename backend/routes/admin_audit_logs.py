"""Admin Audit Logs Routes"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging
from datetime import datetime, timedelta
from database.connection import get_sync_db_connection
from middleware.auth_middleware import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/audit-logs", tags=["admin-audit-logs"])


@router.get("", dependencies=[Depends(require_admin)])
async def get_audit_logs(
    action_type: Optional[str] = None,
    admin_id: Optional[str] = None,
    target_type: Optional[str] = None,
    search: Optional[str] = None,
    days: Optional[int] = 30,
    limit: int = 100,
    offset: int = 0
):
    """
    Get audit logs from admin_actions table with filters
    
    - **action_type**: Filter by action type (user_management, content_moderation, verification, system_config, other)
    - **admin_id**: Filter by specific admin user ID
    - **target_type**: Filter by target type (user, post, job, event, etc.)
    - **search**: Search in description field
    - **days**: Get logs from last N days (default: 30)
    - **limit**: Number of records to return (default: 100)
    - **offset**: Pagination offset (default: 0)
    """
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Base query - join with users table to get admin details
        query = """
            SELECT 
                aa.id,
                aa.admin_id,
                u.email as admin_email,
                ap.name as admin_name,
                aa.action_type,
                aa.target_type,
                aa.target_id,
                aa.description,
                aa.metadata,
                aa.ip_address,
                aa.timestamp
            FROM admin_actions aa
            LEFT JOIN users u ON aa.admin_id = u.id
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            WHERE 1=1
        """
        
        params = []
        
        # Date filter - get logs from last N days
        if days:
            query += " AND aa.timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)"
            params.append(days)
        
        # Action type filter
        if action_type:
            query += " AND aa.action_type = %s"
            params.append(action_type)
        
        # Admin ID filter
        if admin_id:
            query += " AND aa.admin_id = %s"
            params.append(admin_id)
        
        # Target type filter
        if target_type:
            query += " AND aa.target_type = %s"
            params.append(target_type)
        
        # Search in description
        if search:
            query += " AND aa.description LIKE %s"
            params.append(f"%{search}%")
        
        # Order by timestamp descending (most recent first)
        query += " ORDER BY aa.timestamp DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) as total
            FROM admin_actions aa
            WHERE 1=1
        """
        count_params = []
        
        if days:
            count_query += " AND aa.timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)"
            count_params.append(days)
        if action_type:
            count_query += " AND aa.action_type = %s"
            count_params.append(action_type)
        if admin_id:
            count_query += " AND aa.admin_id = %s"
            count_params.append(admin_id)
        if target_type:
            count_query += " AND aa.target_type = %s"
            count_params.append(target_type)
        if search:
            count_query += " AND aa.description LIKE %s"
            count_params.append(f"%{search}%")
        
        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']
        
        # Transform data
        logs = []
        for row in rows:
            import json
            
            # Parse metadata JSON if it exists
            metadata = None
            if row.get('metadata'):
                try:
                    metadata = json.loads(row['metadata']) if isinstance(row['metadata'], str) else row['metadata']
                except (json.JSONDecodeError, TypeError):
                    metadata = None
            
            log = {
                'id': row['id'],
                'admin_id': row['admin_id'],
                'admin_email': row['admin_email'],
                'admin_name': row['admin_name'],
                'action_type': row['action_type'],
                'target_type': row['target_type'],
                'target_id': row['target_id'],
                'description': row['description'],
                'metadata': metadata,
                'ip_address': row['ip_address'],
                'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None
            }
            logs.append(log)
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": logs,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
    
    except Exception as e:
        logger.error(f"Error fetching audit logs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", dependencies=[Depends(require_admin)])
async def get_audit_stats():
    """Get audit log statistics"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Get stats by action type
        cursor.execute("""
            SELECT 
                action_type,
                COUNT(*) as count,
                MAX(timestamp) as last_action
            FROM admin_actions
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY action_type
        """)
        
        action_stats = cursor.fetchall()
        
        # Get total actions in last 24 hours
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM admin_actions
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """)
        
        last_24h = cursor.fetchone()['count']
        
        # Get most active admins
        cursor.execute("""
            SELECT 
                aa.admin_id,
                u.email as admin_email,
                ap.name as admin_name,
                COUNT(*) as action_count
            FROM admin_actions aa
            LEFT JOIN users u ON aa.admin_id = u.id
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            WHERE aa.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY aa.admin_id, u.email, ap.name
            ORDER BY action_count DESC
            LIMIT 5
        """)
        
        top_admins = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": {
                "action_stats": [dict(row) for row in action_stats],
                "last_24h_count": last_24h,
                "top_admins": [dict(row) for row in top_admins]
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching audit stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
