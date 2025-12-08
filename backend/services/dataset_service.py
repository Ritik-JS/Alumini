"""Dataset Upload Service - Phase 10.2
Handles admin dataset uploads with validation, cleaning, and processing
"""
import uuid
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import aiomysql

from database.connection import get_db_pool

logger = logging.getLogger(__name__)


class DatasetService:
    """Service for managing dataset uploads"""
    
    # File type schemas
    ALUMNI_SCHEMA = {
        'required': ['email', 'name', 'batch_year'],
        'optional': ['department', 'current_company', 'current_role', 'location', 'skills', 'linkedin_url']
    }
    
    JOB_MARKET_SCHEMA = {
        'required': ['job_title', 'company', 'location'],
        'optional': ['industry', 'salary_min', 'salary_max', 'required_skills', 'experience_level']
    }
    
    EDUCATIONAL_SCHEMA = {
        'required': ['student_id', 'email', 'course_name'],
        'optional': ['grade', 'completion_date', 'skills_learned', 'instructor']
    }
    
    @staticmethod
    def get_schema_for_type(file_type: str) -> Dict[str, List[str]]:
        """Get validation schema for file type"""
        schemas = {
            'alumni': DatasetService.ALUMNI_SCHEMA,
            'job_market': DatasetService.JOB_MARKET_SCHEMA,
            'educational': DatasetService.EDUCATIONAL_SCHEMA
        }
        return schemas.get(file_type, {})
    
    @staticmethod
    async def create_upload_record(
        uploaded_by: str,
        file_name: str,
        file_url: str,
        file_type: str,
        file_size_kb: int,
        description: str = None
    ) -> str:
        """Create a new dataset upload record"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                upload_id = str(uuid.uuid4())
                
                query = """
                INSERT INTO dataset_uploads (
                    id, uploaded_by, file_name, file_url, file_type, 
                    file_size_kb, status, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                await cursor.execute(query, (
                    upload_id, uploaded_by, file_name, file_url, file_type,
                    file_size_kb, 'pending', datetime.utcnow()
                ))
                await conn.commit()
                
                logger.info(f"Created upload record: {upload_id}")
                return upload_id
    
    @staticmethod
    async def get_upload_by_id(upload_id: str) -> Optional[Dict[str, Any]]:
        """Get upload record by ID"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = "SELECT * FROM dataset_uploads WHERE id = %s"
                await cursor.execute(query, (upload_id,))
                upload = await cursor.fetchone()
                
                if upload and upload.get('validation_report'):
                    try:
                        upload['validation_report'] = json.loads(upload['validation_report'])
                    except:
                        pass
                
                return upload
    
    @staticmethod
    async def update_upload_status(
        upload_id: str,
        status: str,
        error_log: str = None,
        total_rows: int = None,
        valid_rows: int = None,
        error_rows: int = None,
        validation_report: Dict = None
    ) -> bool:
        """Update upload status and metadata"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                updates = ["status = %s"]
                values = [status]
                
                if status == 'processing':
                    updates.append("processing_start_time = %s")
                    values.append(datetime.utcnow())
                elif status in ['completed', 'failed']:
                    updates.append("processing_end_time = %s")
                    values.append(datetime.utcnow())
                
                if error_log:
                    updates.append("error_log = %s")
                    values.append(error_log)
                
                if total_rows is not None:
                    updates.append("total_rows = %s")
                    values.append(total_rows)
                
                if valid_rows is not None:
                    updates.append("valid_rows = %s")
                    values.append(valid_rows)
                
                if error_rows is not None:
                    updates.append("error_rows = %s")
                    values.append(error_rows)
                
                if validation_report:
                    updates.append("validation_report = %s")
                    values.append(json.dumps(validation_report))
                
                values.append(upload_id)
                
                query = f"""
                UPDATE dataset_uploads 
                SET {', '.join(updates)}
                WHERE id = %s
                """
                
                await cursor.execute(query, values)
                await conn.commit()
                
                logger.info(f"Updated upload {upload_id} status to {status}")
                return cursor.rowcount > 0
    
    @staticmethod
    async def log_processing_stage(
        upload_id: str,
        stage: str,
        status: str,
        message: str = None,
        details: Dict = None
    ) -> None:
        """Log a processing stage"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                log_id = str(uuid.uuid4())
                
                query = """
                INSERT INTO dataset_processing_logs (
                    id, upload_id, stage, status, message, details, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                
                await cursor.execute(query, (
                    log_id, upload_id, stage, status, message,
                    json.dumps(details) if details else None,
                    datetime.utcnow()
                ))
                await conn.commit()
                
                logger.info(f"Logged {stage} stage for upload {upload_id}: {status}")
    
    @staticmethod
    async def get_processing_logs(upload_id: str) -> List[Dict[str, Any]]:
        """Get all processing logs for an upload"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = """
                SELECT * FROM dataset_processing_logs 
                WHERE upload_id = %s 
                ORDER BY created_at ASC
                """
                await cursor.execute(query, (upload_id,))
                logs = await cursor.fetchall()
                
                # Parse JSON details
                for log in logs:
                    if log.get('details'):
                        try:
                            log['details'] = json.loads(log['details'])
                        except:
                            pass
                
                return logs
    
    @staticmethod
    async def list_uploads(
        uploaded_by: str = None,
        status: str = None,
        file_type: str = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """List dataset uploads with filters"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Build WHERE clause
                where_clauses = []
                values = []
                
                if uploaded_by:
                    where_clauses.append("uploaded_by = %s")
                    values.append(uploaded_by)
                
                if status:
                    where_clauses.append("status = %s")
                    values.append(status)
                
                if file_type:
                    where_clauses.append("file_type = %s")
                    values.append(file_type)
                
                where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
                
                # Count total
                count_query = f"SELECT COUNT(*) as total FROM dataset_uploads {where_sql}"
                await cursor.execute(count_query, values)
                total_result = await cursor.fetchone()
                total = total_result['total'] if total_result else 0
                
                # Get paginated results
                offset = (page - 1) * limit
                query = f"""
                SELECT * FROM dataset_uploads 
                {where_sql}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """
                values.extend([limit, offset])
                
                await cursor.execute(query, values)
                uploads = await cursor.fetchall()
                
                # Parse JSON fields
                for upload in uploads:
                    if upload.get('validation_report'):
                        try:
                            upload['validation_report'] = json.loads(upload['validation_report'])
                        except:
                            pass
                
                return {
                    'uploads': uploads,
                    'total': total,
                    'page': page,
                    'limit': limit,
                    'total_pages': (total + limit - 1) // limit
                }
    
    @staticmethod
    async def delete_upload(upload_id: str) -> bool:
        """Delete an upload record"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                query = "DELETE FROM dataset_uploads WHERE id = %s"
                await cursor.execute(query, (upload_id,))
                await conn.commit()
                
                logger.info(f"Deleted upload record: {upload_id}")
                return cursor.rowcount > 0
    
    @staticmethod
    async def get_upload_statistics() -> Dict[str, Any]:
        """Get overall upload statistics"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Total uploads
                await cursor.execute("SELECT COUNT(*) as total FROM dataset_uploads")
                total_result = await cursor.fetchone()
                total_uploads = total_result['total'] if total_result else 0
                
                # By status
                await cursor.execute("""
                    SELECT status, COUNT(*) as count 
                    FROM dataset_uploads 
                    GROUP BY status
                """)
                status_counts = {row['status']: row['count'] for row in await cursor.fetchall()}
                
                # By file type
                await cursor.execute("""
                    SELECT file_type, COUNT(*) as count 
                    FROM dataset_uploads 
                    GROUP BY file_type
                """)
                type_counts = {row['file_type']: row['count'] for row in await cursor.fetchall()}
                
                # Recent uploads (last 24 hours)
                await cursor.execute("""
                    SELECT COUNT(*) as count 
                    FROM dataset_uploads 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                """)
                recent_result = await cursor.fetchone()
                recent_uploads = recent_result['count'] if recent_result else 0
                
                return {
                    'total_uploads': total_uploads,
                    'by_status': status_counts,
                    'by_file_type': type_counts,
                    'recent_24h': recent_uploads
                }
