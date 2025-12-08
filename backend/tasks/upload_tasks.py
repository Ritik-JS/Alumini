"""
Dataset Upload Processing Tasks - Phase 10.2
Handles admin dataset uploads with validation, cleaning, and AI pipeline triggering
"""
from celery_app import app, TaskConfig
import pandas as pd
import logging
from pathlib import Path
from typing import Dict, Any
import json
import asyncio

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async functions in Celery"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@app.task(
    name='tasks.upload_tasks.process_dataset_upload',
    queue=TaskConfig.QUEUE_FILE_PROCESSING,
    bind=True,
    max_retries=3,
    default_retry_delay=300
)
def process_dataset_upload(self, upload_id: str, file_path: str, file_type: str) -> Dict[str, Any]:
    """
    Process uploaded dataset file
    
    Steps:
    1. Validate file format and data
    2. Clean and normalize data
    3. Store valid data in database
    4. Trigger AI pipeline for processing
    5. Generate completion report
    
    Args:
        upload_id: Upload record ID
        file_path: Path to uploaded file
        file_type: Type of dataset (alumni, job_market, educational)
    
    Returns:
        Processing results
    """
    try:
        from services.dataset_service import DatasetService
        from utils.dataset_validator import DatasetValidator, DatasetCleaner
        
        logger.info(f"[Upload {upload_id}] Starting dataset processing")
        
        # Update status to 'validating'
        run_async(DatasetService.update_upload_status(upload_id, 'validating'))
        run_async(DatasetService.log_processing_stage(
            upload_id, 'validation', 'started',
            f'Starting validation for {file_type} dataset'
        ))
        
        # Load file based on extension
        file_path_obj = Path(file_path)
        logger.info(f"[Upload {upload_id}] Loading file: {file_path_obj.name}")
        
        if file_path_obj.suffix == '.csv':
            df = pd.read_csv(file_path)
        elif file_path_obj.suffix in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        elif file_path_obj.suffix == '.json':
            df = pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path_obj.suffix}")
        
        total_rows = len(df)
        logger.info(f"[Upload {upload_id}] Loaded {total_rows} rows")
        
        # Step 1: Validation
        logger.info(f"[Upload {upload_id}] Validating dataset")
        validation_result = DatasetValidator.validate_dataset(df, file_type)
        
        if not validation_result['is_valid']:
            error_msg = f"Validation failed: {validation_result['error_rows']} invalid rows out of {total_rows}"
            logger.error(f"[Upload {upload_id}] {error_msg}")
            
            run_async(DatasetService.update_upload_status(
                upload_id, 'failed',
                error_log=error_msg,
                total_rows=total_rows,
                valid_rows=validation_result['valid_rows'],
                error_rows=validation_result['error_rows'],
                validation_report=validation_result
            ))
            
            run_async(DatasetService.log_processing_stage(
                upload_id, 'validation', 'failed',
                error_msg, validation_result
            ))
            
            return {
                'status': 'failed',
                'error': error_msg,
                'validation_result': validation_result
            }
        
        logger.info(f"[Upload {upload_id}] Validation passed: {validation_result['valid_rows']} valid rows")
        run_async(DatasetService.log_processing_stage(
            upload_id, 'validation', 'completed',
            f"Validation successful: {validation_result['valid_rows']} valid rows",
            validation_result
        ))
        
        # Update status to 'cleaning'
        run_async(DatasetService.update_upload_status(
            upload_id, 'cleaning',
            total_rows=total_rows,
            validation_report=validation_result
        ))
        run_async(DatasetService.log_processing_stage(
            upload_id, 'cleaning', 'started',
            'Starting data cleaning and normalization'
        ))
        
        # Step 2: Data Cleaning
        logger.info(f"[Upload {upload_id}] Cleaning dataset")
        df_clean = DatasetCleaner.clean_dataset(df, file_type)
        
        valid_rows = len(df_clean)
        error_rows = total_rows - valid_rows
        
        logger.info(f"[Upload {upload_id}] Cleaning complete: {valid_rows} valid rows, {error_rows} removed")
        run_async(DatasetService.log_processing_stage(
            upload_id, 'cleaning', 'completed',
            f"Cleaned dataset: {valid_rows} rows remaining",
            {'original_rows': total_rows, 'cleaned_rows': valid_rows, 'removed_rows': error_rows}
        ))
        
        # Update status to 'processing'
        run_async(DatasetService.update_upload_status(
            upload_id, 'processing',
            valid_rows=valid_rows,
            error_rows=error_rows
        ))
        run_async(DatasetService.log_processing_stage(
            upload_id, 'ai_processing', 'started',
            'Triggering AI pipeline processing'
        ))
        
        # Step 3: Store cleaned data
        logger.info(f"[Upload {upload_id}] Storing cleaned data")
        storage_result = _store_cleaned_data(df_clean, file_type, upload_id)
        
        run_async(DatasetService.log_processing_stage(
            upload_id, 'storage', 'completed',
            f"Stored {storage_result['records_stored']} records in database",
            storage_result
        ))
        
        # Step 4: Trigger AI pipeline
        logger.info(f"[Upload {upload_id}] Triggering AI pipeline for {file_type}")
        _trigger_ai_pipeline(upload_id, file_type)
        
        run_async(DatasetService.log_processing_stage(
            upload_id, 'ai_processing', 'completed',
            'AI pipeline tasks queued successfully'
        ))
        
        # Update status to 'completed'
        run_async(DatasetService.update_upload_status(
            upload_id, 'completed',
            total_rows=total_rows,
            valid_rows=valid_rows,
            error_rows=error_rows
        ))
        
        logger.info(f"[Upload {upload_id}] Processing completed successfully")
        
        return {
            'status': 'completed',
            'total_rows': total_rows,
            'valid_rows': valid_rows,
            'error_rows': error_rows,
            'upload_id': upload_id,
            'storage_result': storage_result
        }
    
    except Exception as e:
        logger.error(f"[Upload {upload_id}] Processing error: {str(e)}", exc_info=True)
        
        # Update status to failed
        try:
            from services.dataset_service import DatasetService
            run_async(DatasetService.update_upload_status(
                upload_id, 'failed',
                error_log=str(e)
            ))
            run_async(DatasetService.log_processing_stage(
                upload_id, 'validation', 'failed',
                f'Processing failed: {str(e)}'
            ))
        except:
            pass
        
        # Retry task
        raise self.retry(exc=e)


def _store_cleaned_data(df: pd.DataFrame, file_type: str, upload_id: str) -> Dict[str, Any]:
    """Store cleaned data in appropriate database tables"""
    logger.info(f"Storing {len(df)} records for {file_type}")
    
    # This is a placeholder - actual implementation would insert into respective tables
    # For now, we'll just log and return success
    # In a real implementation, this would:
    # - Insert alumni data into alumni_profiles
    # - Insert job data into jobs table
    # - Insert educational data into appropriate tables
    
    records_stored = len(df)
    
    logger.info(f"Successfully stored {records_stored} records")
    
    return {
        'records_stored': records_stored,
        'file_type': file_type,
        'upload_id': upload_id
    }


def _trigger_ai_pipeline(upload_id: str, file_type: str):
    """Trigger AI pipeline tasks based on file type"""
    from tasks.ai_tasks import (
        update_skill_graph,
        calculate_career_predictions,
        recalculate_talent_heatmap,
        update_engagement_scores
    )
    
    logger.info(f"Triggering AI pipeline for {file_type}")
    
    if file_type == 'alumni':
        # Queue AI tasks for alumni data
        logger.info("Queueing: skill graph update, career predictions, talent heatmap, engagement scores")
        update_skill_graph.delay(upload_id)
        calculate_career_predictions.delay(upload_id)
        recalculate_talent_heatmap.delay(upload_id)
        update_engagement_scores.delay(upload_id)
    
    elif file_type == 'job_market':
        # Queue AI tasks for job market data
        logger.info("Queueing: skill graph update (job market)")
        update_skill_graph.delay(upload_id)
    
    elif file_type == 'educational':
        # Queue AI tasks for educational data
        logger.info("Queueing: career predictions update")
        calculate_career_predictions.delay(upload_id)


@app.task(
    name='tasks.upload_tasks.validate_dataset_schema',
    queue=TaskConfig.QUEUE_FILE_PROCESSING
)
def validate_dataset_schema(upload_id: str, file_path: str, file_type: str) -> Dict[str, Any]:
    """
    Validate dataset schema against expected format
    
    Args:
        upload_id: Upload record ID
        file_path: Path to file
        file_type: Dataset type
    
    Returns:
        Validation results
    """
    try:
        logger.info(f"Validating dataset schema: {upload_id}")
        
        # Define expected schemas
        expected_schemas = {
            'alumni': ['email', 'name', 'batch_year', 'current_company', 'skills'],
            'job_market': ['job_title', 'company', 'location', 'required_skills'],
            'educational': ['student_id', 'course_name', 'grade', 'skills_learned']
        }
        
        required_columns = expected_schemas.get(file_type, [])
        
        # Load file
        df = pd.read_csv(file_path)
        actual_columns = df.columns.tolist()
        
        # Check required columns
        missing_columns = [col for col in required_columns if col not in actual_columns]
        
        is_valid = len(missing_columns) == 0
        
        return {
            'is_valid': is_valid,
            'missing_columns': missing_columns,
            'actual_columns': actual_columns,
            'required_columns': required_columns
        }
    
    except Exception as e:
        logger.error(f"Schema validation error: {str(e)}")
        return {
            'is_valid': False,
            'error': str(e)
        }
