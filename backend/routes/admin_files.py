"""
Admin File Management Routes
Handles file uploads management and monitoring
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging
from database.connection import get_sync_db_connection
from middleware.auth_middleware import require_admin, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/files", tags=["admin-files"])


@router.get("", dependencies=[Depends(require_admin)])
async def get_all_files(
    file_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get all uploaded files with filters"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        query = """
            SELECT 
                f.id,
                f.user_id,
                f.file_name,
                f.file_url,
                f.file_type,
                f.mime_type,
                f.file_size_kb,
                f.uploaded_at,
                u.email as user_email
            FROM file_uploads f
            JOIN users u ON f.user_id = u.id
            WHERE 1=1
        """
        
        params = []
        
        if file_type and file_type != 'all':
            query += " AND f.file_type = %s"
            params.append(file_type)
        
        if search:
            query += " AND (f.file_name LIKE %s OR u.email LIKE %s)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term])
        
        query += " ORDER BY f.uploaded_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        files = cursor.fetchall()
        
        # Format dates
        for file in files:
            file['uploaded_at'] = file['uploaded_at'].isoformat() if file.get('uploaded_at') else None
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": files
        }
    
    except Exception as e:
        logger.error(f"Error fetching files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{file_id}", dependencies=[Depends(require_admin)])
async def get_file_details(file_id: str):
    """Get detailed file information"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT 
                f.*,
                u.email as user_email,
                u.role as user_role,
                ap.name as user_name
            FROM file_uploads f
            JOIN users u ON f.user_id = u.id
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            WHERE f.id = %s
        """, (file_id,))
        
        file = cursor.fetchone()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Format dates
        file['uploaded_at'] = file['uploaded_at'].isoformat() if file.get('uploaded_at') else None
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": file
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching file details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{file_id}", dependencies=[Depends(require_admin)])
async def delete_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a file from the system"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Get file info before deletion
        cursor.execute("SELECT file_name, user_id FROM file_uploads WHERE id = %s", (file_id,))
        file_info = cursor.fetchone()
        
        if not file_info:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete file record
        cursor.execute("DELETE FROM file_uploads WHERE id = %s", (file_id,))
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'file_management', 'file', %s, %s)
        """, (current_user['id'], file_id, f"Deleted file: {file_info['file_name']}"))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "File deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", dependencies=[Depends(require_admin)])
async def get_file_stats():
    """Get file statistics"""
    try:
        connection = get_sync_db_connection()
        cursor = connection.cursor()
        
        # Total files and size
        cursor.execute("""
            SELECT 
                COUNT(*) as total_files,
                SUM(file_size_kb) as total_size_kb,
                COUNT(DISTINCT user_id) as unique_uploaders
            FROM file_uploads
        """)
        stats = cursor.fetchone()
        
        # Files by type
        cursor.execute("""
            SELECT 
                file_type,
                COUNT(*) as count,
                SUM(file_size_kb) as total_size_kb
            FROM file_uploads
            GROUP BY file_type
        """)
        by_type = cursor.fetchall()
        
        # Recent uploads (last 7 days)
        cursor.execute("""
            SELECT COUNT(*) as recent_uploads
            FROM file_uploads
            WHERE uploaded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        """)
        recent = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": {
                **stats,
                "by_type": by_type,
                "recent_uploads": recent['recent_uploads']
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching file stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
