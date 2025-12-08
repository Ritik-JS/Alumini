"""
File Storage Management
Handles file uploads for datasets, ML models, photos, CVs, and documents
"""
import os
import boto3
from botocore.exceptions import ClientError
from pathlib import Path
from typing import Optional, BinaryIO
import logging
import hashlib
from datetime import datetime
import shutil

logger = logging.getLogger(__name__)


class StorageConfig:
    """Storage configuration"""
    
    # Storage type: 's3' or 'local'
    STORAGE_TYPE = os.getenv('STORAGE_TYPE', 'local')
    
    # Local Storage Settings
    LOCAL_STORAGE_PATH = os.getenv('LOCAL_STORAGE_PATH', '/app/storage')
    
    # S3 Settings
    S3_BUCKET = os.getenv('S3_BUCKET', 'alumunity-storage')
    S3_REGION = os.getenv('S3_REGION', 'us-east-1')
    S3_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID', '')
    S3_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    
    # File Size Limits (in bytes)
    MAX_DATASET_SIZE = 50 * 1024 * 1024  # 50 MB
    MAX_CV_SIZE = 5 * 1024 * 1024  # 5 MB
    MAX_PHOTO_SIZE = 2 * 1024 * 1024  # 2 MB
    
    # Allowed File Types
    ALLOWED_DATASET_TYPES = ['.csv', '.xlsx', '.xls', '.json']
    ALLOWED_CV_TYPES = ['.pdf', '.doc', '.docx']
    ALLOWED_PHOTO_TYPES = ['.jpg', '.jpeg', '.png', '.webp']


class FileStorage:
    """Base file storage handler"""
    
    def __init__(self):
        self.storage_type = StorageConfig.STORAGE_TYPE
        
        if self.storage_type == 'local':
            self._init_local_storage()
        elif self.storage_type == 's3':
            self._init_s3_storage()
    
    def _init_local_storage(self):
        """Initialize local file storage"""
        base_path = Path(StorageConfig.LOCAL_STORAGE_PATH)
        
        # Create directories
        self.paths = {
            'datasets': base_path / 'datasets',
            'ml_models': base_path / 'ml_models',
            'photos': base_path / 'photos',
            'cvs': base_path / 'cvs',
            'documents': base_path / 'documents',
            'qr_codes': base_path / 'qr_codes',
            'temp': base_path / 'temp'
        }
        
        for path in self.paths.values():
            path.mkdir(parents=True, exist_ok=True)
        
        logger.info("✅ Local storage initialized")
    
    def _init_s3_storage(self):
        """Initialize S3 storage"""
        try:
            self.s3_client = boto3.client(
                's3',
                region_name=StorageConfig.S3_REGION,
                aws_access_key_id=StorageConfig.S3_ACCESS_KEY,
                aws_secret_access_key=StorageConfig.S3_SECRET_KEY
            )
            
            # Test connection
            self.s3_client.head_bucket(Bucket=StorageConfig.S3_BUCKET)
            logger.info("✅ S3 storage initialized")
        except ClientError as e:
            logger.error(f"❌ S3 initialization failed: {str(e)}")
            raise
    
    def _generate_filename(self, original_filename: str, prefix: str = "") -> str:
        """Generate unique filename with hash"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_hash = hashlib.md5(f"{original_filename}{timestamp}".encode()).hexdigest()[:8]
        
        file_ext = Path(original_filename).suffix
        filename = f"{prefix}_{timestamp}_{file_hash}{file_ext}" if prefix else f"{timestamp}_{file_hash}{file_ext}"
        
        return filename
    
    async def upload_file(
        self,
        file: BinaryIO,
        original_filename: str,
        category: str,
        prefix: str = ""
    ) -> dict:
        """
        Upload a file to storage
        
        Args:
            file: File binary data
            original_filename: Original filename
            category: Storage category (datasets, photos, cvs, etc.)
            prefix: Optional prefix for filename
        
        Returns:
            dict with file_url, file_path, file_size
        """
        try:
            filename = self._generate_filename(original_filename, prefix)
            
            if self.storage_type == 'local':
                return await self._upload_local(file, filename, category)
            elif self.storage_type == 's3':
                return await self._upload_s3(file, filename, category)
        except Exception as e:
            logger.error(f"File upload error: {str(e)}")
            raise
    
    async def _upload_local(self, file: BinaryIO, filename: str, category: str) -> dict:
        """Upload file to local storage"""
        try:
            file_path = self.paths[category] / filename
            
            # Read file content
            content = await file.read() if hasattr(file, 'read') else file
            
            # Write to disk
            with open(file_path, 'wb') as f:
                f.write(content)
            
            file_size = file_path.stat().st_size
            
            return {
                'file_url': f'/storage/{category}/{filename}',
                'file_path': str(file_path),
                'file_size_kb': file_size // 1024,
                'storage_type': 'local'
            }
        except Exception as e:
            logger.error(f"Local upload error: {str(e)}")
            raise
    
    async def _upload_s3(self, file: BinaryIO, filename: str, category: str) -> dict:
        """Upload file to S3"""
        try:
            s3_key = f"{category}/{filename}"
            
            # Read file content
            content = await file.read() if hasattr(file, 'read') else file
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=StorageConfig.S3_BUCKET,
                Key=s3_key,
                Body=content
            )
            
            file_url = f"https://{StorageConfig.S3_BUCKET}.s3.{StorageConfig.S3_REGION}.amazonaws.com/{s3_key}"
            
            return {
                'file_url': file_url,
                'file_path': s3_key,
                'file_size_kb': len(content) // 1024,
                'storage_type': 's3'
            }
        except Exception as e:
            logger.error(f"S3 upload error: {str(e)}")
            raise
    
    async def delete_file(self, file_path: str, category: str) -> bool:
        """Delete a file from storage"""
        try:
            if self.storage_type == 'local':
                full_path = self.paths[category] / Path(file_path).name
                if full_path.exists():
                    full_path.unlink()
                return True
            elif self.storage_type == 's3':
                self.s3_client.delete_object(
                    Bucket=StorageConfig.S3_BUCKET,
                    Key=file_path
                )
                return True
        except Exception as e:
            logger.error(f"File deletion error: {str(e)}")
            return False
    
    async def get_file_url(self, file_path: str, category: str) -> Optional[str]:
        """Get public URL for a file"""
        try:
            if self.storage_type == 'local':
                return f'/storage/{category}/{Path(file_path).name}'
            elif self.storage_type == 's3':
                return f"https://{StorageConfig.S3_BUCKET}.s3.{StorageConfig.S3_REGION}.amazonaws.com/{file_path}"
        except Exception as e:
            logger.error(f"Get file URL error: {str(e)}")
            return None
    
    def validate_file(
        self,
        filename: str,
        file_size: int,
        file_category: str
    ) -> tuple[bool, str]:
        """
        Validate file based on category rules
        
        Returns:
            (is_valid, error_message)
        """
        file_ext = Path(filename).suffix.lower()
        
        # Check file type
        if file_category == 'datasets':
            if file_ext not in StorageConfig.ALLOWED_DATASET_TYPES:
                return False, f"Invalid dataset file type. Allowed: {StorageConfig.ALLOWED_DATASET_TYPES}"
            if file_size > StorageConfig.MAX_DATASET_SIZE:
                return False, f"Dataset file too large. Max: {StorageConfig.MAX_DATASET_SIZE // (1024*1024)} MB"
        
        elif file_category == 'cvs':
            if file_ext not in StorageConfig.ALLOWED_CV_TYPES:
                return False, f"Invalid CV file type. Allowed: {StorageConfig.ALLOWED_CV_TYPES}"
            if file_size > StorageConfig.MAX_CV_SIZE:
                return False, f"CV file too large. Max: {StorageConfig.MAX_CV_SIZE // (1024*1024)} MB"
        
        elif file_category == 'photos':
            if file_ext not in StorageConfig.ALLOWED_PHOTO_TYPES:
                return False, f"Invalid photo file type. Allowed: {StorageConfig.ALLOWED_PHOTO_TYPES}"
            if file_size > StorageConfig.MAX_PHOTO_SIZE:
                return False, f"Photo file too large. Max: {StorageConfig.MAX_PHOTO_SIZE // (1024*1024)} MB"
        
        return True, ""


# Global storage instance
file_storage = FileStorage()


# Utility functions
async def upload_dataset(file: BinaryIO, filename: str) -> dict:
    """Upload dataset file"""
    return await file_storage.upload_file(file, filename, 'datasets', prefix='dataset')


async def upload_cv(file: BinaryIO, filename: str, user_id: str) -> dict:
    """Upload CV file"""
    return await file_storage.upload_file(file, filename, 'cvs', prefix=f'cv_{user_id}')


async def upload_photo(file: BinaryIO, filename: str, user_id: str) -> dict:
    """Upload profile photo"""
    return await file_storage.upload_file(file, filename, 'photos', prefix=f'photo_{user_id}')


async def upload_ml_model(file: BinaryIO, filename: str, model_name: str) -> dict:
    """Upload ML model file"""
    return await file_storage.upload_file(file, filename, 'ml_models', prefix=f'model_{model_name}')
