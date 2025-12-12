from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging
from database.connection import get_db_connection
from middleware.auth_middleware import require_admin, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/jobs", tags=["admin-jobs"])

@router.get("", dependencies=[Depends(require_admin)])
async def get_all_jobs(
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get all jobs with application counts"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT 
                j.*,
                u.email as posted_by_email,
                COUNT(DISTINCT ja.id) as applications_count
            FROM jobs j
            LEFT JOIN users u ON j.posted_by = u.id
            LEFT JOIN job_applications ja ON j.id = ja.job_id
            WHERE 1=1
        """
        
        params = []
        
        if status:
            query += " AND j.status = %s"
            params.append(status)
        
        if search:
            query += " AND (j.title LIKE %s OR j.company LIKE %s)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term])
        
        query += " GROUP BY j.id ORDER BY j.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        jobs = cursor.fetchall()
        
        # Parse JSON fields and format dates
        import json
        for job in jobs:
            if job.get('skills_required'):
                try:
                    job['skills_required'] = json.loads(job['skills_required']) if isinstance(job['skills_required'], str) else job['skills_required']
                except:
                    job['skills_required'] = []
            
            job['created_at'] = job['created_at'].isoformat()
            job['updated_at'] = job['updated_at'].isoformat()
            if job.get('application_deadline'):
                job['application_deadline'] = job['application_deadline'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": jobs
        }
    
    except Exception as e:
        logger.error(f"Error fetching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}", dependencies=[Depends(require_admin)])
async def get_job_by_id(job_id: str):
    """Get detailed job information"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                j.*,
                u.email as posted_by_email,
                COUNT(DISTINCT ja.id) as applications_count
            FROM jobs j
            LEFT JOIN users u ON j.posted_by = u.id
            LEFT JOIN job_applications ja ON j.id = ja.job_id
            WHERE j.id = %s
            GROUP BY j.id
        """, (job_id,))
        
        job = cursor.fetchone()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Parse JSON fields
        import json
        if job.get('skills_required'):
            try:
                job['skills_required'] = json.loads(job['skills_required']) if isinstance(job['skills_required'], str) else job['skills_required']
            except:
                job['skills_required'] = []
        
        # Format dates
        job['created_at'] = job['created_at'].isoformat()
        job['updated_at'] = job['updated_at'].isoformat()
        if job.get('application_deadline'):
            job['application_deadline'] = job['application_deadline'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": job
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{job_id}", dependencies=[Depends(require_admin)])
async def update_job(job_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    """Update job details (typically status)"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Build dynamic update query
        update_fields = []
        params = []
        
        if 'status' in update_data:
            update_fields.append("status = %s")
            params.append(update_data['status'])
        
        if 'title' in update_data:
            update_fields.append("title = %s")
            params.append(update_data['title'])
        
        if 'description' in update_data:
            update_fields.append("description = %s")
            params.append(update_data['description'])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = NOW()")
        params.append(job_id)
        
        query = f"UPDATE jobs SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, params)
        
        # Log admin action
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description, metadata)
            VALUES (%s, 'content_moderation', 'job', %s, 'Updated job', %s)
        """, (current_user['id'], job_id, str(update_data)))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Job updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{job_id}", dependencies=[Depends(require_admin)])
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a job posting"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Log before deletion
        cursor.execute("""
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
            VALUES (%s, 'content_moderation', 'job', %s, 'Deleted job')
        """, (current_user['id'], job_id))
        
        cursor.execute("DELETE FROM jobs WHERE id = %s", (job_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Job not found")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Job deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}/applications", dependencies=[Depends(require_admin)])
async def get_job_applications(job_id: str):
    """Get all applications for a specific job"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                ja.*,
                u.email as applicant_email,
                ap.name as applicant_name,
                ap.photo_url as applicant_photo
            FROM job_applications ja
            JOIN users u ON ja.applicant_id = u.id
            LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
            WHERE ja.job_id = %s
            ORDER BY ja.applied_at DESC
        """, (job_id,))
        
        applications = cursor.fetchall()
        
        # Format dates
        for app in applications:
            app['applied_at'] = app['applied_at'].isoformat()
            app['updated_at'] = app['updated_at'].isoformat()
            if app.get('viewed_at'):
                app['viewed_at'] = app['viewed_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "data": applications
        }
    
    except Exception as e:
        logger.error(f"Error fetching applications for job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))