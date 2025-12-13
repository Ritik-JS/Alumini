"""Dataset Upload Routes - Phase 10.2
Admin endpoints for uploading and managing datasets
"""
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, List
import logging
import os
from pathlib import Path

from middleware.auth_middleware import require_admin
from services.dataset_service import DatasetService
from storage import file_storage
from tasks.upload_tasks import process_dataset_upload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/datasets", tags=["Admin Dataset Upload"])


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = Form(...),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(require_admin)
):
    """
    Upload a dataset file for processing
    
    File types supported: CSV, Excel (.xlsx, .xls), JSON
    Dataset types: alumni, job_market, educational
    Max file size: 50MB
    
    Returns upload_id for tracking progress
    """
    try:
        # Validate dataset type
        valid_types = ['alumni', 'job_market', 'educational', 'career_paths']
        if dataset_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid dataset_type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Validate file type
        file_extension = Path(file.filename).suffix.lower()
        valid_extensions = ['.csv', '.xlsx', '.xls', '.json']
        if file_extension not in valid_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Supported: {', '.join(valid_extensions)}"
            )
        
        # Read file content
        contents = await file.read()
        file_size_kb = len(contents) / 1024
        
        # Validate file size (50MB max)
        if file_size_kb > 50 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size exceeds 50MB limit"
            )
        
        # Upload file to storage
        logger.info(f"Uploading dataset file: {file.filename} ({file_size_kb:.2f} KB)")
        file_url = await file_storage.upload_file(
            file_content=contents,
            filename=file.filename,
            category='datasets'
        )
        
        # Create upload record in database
        upload_id = await DatasetService.create_upload_record(
            uploaded_by=current_user['id'],
            file_name=file.filename,
            file_url=file_url,
            file_type=dataset_type,
            file_size_kb=int(file_size_kb)
        )
        
        # Get local file path for processing
        local_path = file_storage.get_local_path(file_url)
        
        # Queue background processing task
        logger.info(f"Queuing processing task for upload: {upload_id}")
        task = process_dataset_upload.delay(upload_id, local_path, dataset_type)
        
        # Estimate processing time based on file size
        estimated_time = "5-10 minutes"
        if file_size_kb < 1024:  # < 1MB
            estimated_time = "1-3 minutes"
        elif file_size_kb > 10 * 1024:  # > 10MB
            estimated_time = "10-20 minutes"
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "upload_id": upload_id,
                    "task_id": task.id,
                    "status": "pending",
                    "file_name": file.filename,
                    "file_size_kb": int(file_size_kb),
                    "dataset_type": dataset_type,
                    "estimated_processing_time": estimated_time
                },
                "message": "Dataset uploaded successfully. Processing started."
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dataset upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/upload/{upload_id}")
async def get_upload_details(
    upload_id: str,
    current_user: dict = Depends(require_admin)
):
    """Get upload details by ID"""
    try:
        upload = await DatasetService.get_upload_by_id(upload_id)
        
        if not upload:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": upload
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching upload details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upload/{upload_id}/progress")
async def get_upload_progress(
    upload_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Get real-time upload processing progress
    
    Returns:
    - upload_id
    - status (pending, validating, cleaning, processing, completed, failed)
    - progress_percentage
    - current_stage
    - total_rows
    - processed_rows
    - valid_rows
    - error_rows
    - estimated_time_remaining
    """
    try:
        upload = await DatasetService.get_upload_by_id(upload_id)
        
        if not upload:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        # Calculate progress percentage
        status_progress = {
            'pending': 0,
            'validating': 20,
            'cleaning': 50,
            'processing': 75,
            'completed': 100,
            'failed': 0
        }
        
        progress_percentage = status_progress.get(upload['status'], 0)
        
        # Calculate processed rows
        total_rows = upload.get('total_rows', 0)
        valid_rows = upload.get('valid_rows', 0)
        error_rows = upload.get('error_rows', 0)
        
        if upload['status'] in ['completed', 'failed']:
            processed_rows = total_rows
        else:
            processed_rows = int(total_rows * progress_percentage / 100) if total_rows else 0
        
        # Estimate time remaining
        estimated_time_remaining = None
        if upload['status'] not in ['completed', 'failed']:
            if upload.get('processing_start_time'):
                from datetime import datetime
                elapsed = (datetime.utcnow() - upload['processing_start_time']).seconds
                if progress_percentage > 0:
                    total_estimated = elapsed / (progress_percentage / 100)
                    remaining = total_estimated - elapsed
                    estimated_time_remaining = f"{int(remaining / 60)} minutes"
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "upload_id": upload_id,
                    "status": upload['status'],
                    "progress_percentage": progress_percentage,
                    "current_stage": upload['status'],
                    "total_rows": total_rows,
                    "processed_rows": processed_rows,
                    "valid_rows": valid_rows,
                    "error_rows": error_rows,
                    "estimated_time_remaining": estimated_time_remaining,
                    "created_at": str(upload['created_at']),
                    "processing_start_time": str(upload.get('processing_start_time')) if upload.get('processing_start_time') else None
                }
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upload/{upload_id}/report")
async def get_upload_report(
    upload_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Get detailed processing report for an upload
    
    Includes:
    - Summary statistics
    - Validation errors
    - Processing logs
    - AI systems triggered
    """
    try:
        upload = await DatasetService.get_upload_by_id(upload_id)
        
        if not upload:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        # Get processing logs
        logs = await DatasetService.get_processing_logs(upload_id)
        
        # Calculate processing time
        processing_time_seconds = None
        if upload.get('processing_start_time') and upload.get('processing_end_time'):
            delta = upload['processing_end_time'] - upload['processing_start_time']
            processing_time_seconds = int(delta.total_seconds())
        
        # Determine AI systems triggered
        ai_systems_triggered = []
        if upload['file_type'] == 'alumni':
            ai_systems_triggered = [
                "skill_graph_update",
                "career_path_recalculation",
                "talent_heatmap_refresh",
                "engagement_scoring"
            ]
        elif upload['file_type'] == 'job_market':
            ai_systems_triggered = [
                "skill_graph_update",
                "career_path_market_trends"
            ]
        elif upload['file_type'] == 'educational':
            ai_systems_triggered = [
                "career_prediction_update",
                "capsule_ranking_refresh"
            ]
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "upload_id": upload_id,
                    "file_name": upload['file_name'],
                    "file_type": upload['file_type'],
                    "status": upload['status'],
                    "summary": {
                        "total_rows": upload.get('total_rows', 0),
                        "valid_rows": upload.get('valid_rows', 0),
                        "error_rows": upload.get('error_rows', 0),
                        "processing_time_seconds": processing_time_seconds
                    },
                    "validation_report": upload.get('validation_report', {}),
                    "processing_logs": logs,
                    "ai_processing_triggered": ai_systems_triggered if upload['status'] == 'completed' else [],
                    "error_log": upload.get('error_log'),
                    "created_at": str(upload['created_at']),
                    "completed_at": str(upload.get('processing_end_time')) if upload.get('processing_end_time') else None
                }
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upload/{upload_id}/errors/download")
async def download_error_report(
    upload_id: str,
    current_user: dict = Depends(require_admin)
):
    """Download error report as CSV"""
    try:
        upload = await DatasetService.get_upload_by_id(upload_id)
        
        if not upload:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        validation_report = upload.get('validation_report', {})
        errors = validation_report.get('errors', [])
        
        if not errors:
            raise HTTPException(status_code=404, detail="No errors found")
        
        # Create CSV content
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Error'])
        
        for error in errors:
            writer.writerow([error])
        
        csv_content = output.getvalue()
        
        from fastapi.responses import Response
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=errors_{upload_id}.csv"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading errors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/uploads")
async def list_uploads(
    status: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """
    List all dataset uploads with filters
    
    Filters:
    - status: pending, validating, cleaning, processing, completed, failed
    - file_type: alumni, job_market, educational
    - page: page number (default: 1)
    - limit: items per page (default: 20, max: 100)
    """
    try:
        result = await DatasetService.list_uploads(
            uploaded_by=None,  # Admin can see all
            status=status,
            file_type=file_type,
            page=page,
            limit=limit
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": result['uploads'],
                "pagination": {
                    "total": result['total'],
                    "page": result['page'],
                    "limit": result['limit'],
                    "total_pages": result['total_pages']
                }
            }
        )
    
    except Exception as e:
        logger.error(f"Error listing uploads: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/upload/{upload_id}")
async def delete_upload(
    upload_id: str,
    current_user: dict = Depends(require_admin)
):
    """Delete an upload record"""
    try:
        success = await DatasetService.delete_upload(upload_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Upload deleted successfully"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_upload_statistics(
    current_user: dict = Depends(require_admin)
):
    """Get overall upload statistics"""
    try:
        stats = await DatasetService.get_upload_statistics()
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": stats
            }
        )
    
    except Exception as e:
        logger.error(f"Error fetching statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
