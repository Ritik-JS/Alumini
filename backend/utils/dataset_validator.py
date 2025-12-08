"""Dataset Validation and Cleaning Utilities - Phase 10.2"""
import re
import pandas as pd
import logging
from typing import Dict, Any, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


class DatasetValidator:
    """Validate dataset files"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        if not email or not isinstance(email, str):
            return False
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_alumni_row(row: pd.Series, row_num: int) -> Tuple[bool, List[str]]:
        """Validate a single alumni data row"""
        errors = []
        
        # Required fields
        if pd.isna(row.get('email')) or not DatasetValidator.validate_email(str(row.get('email', ''))):
            errors.append(f"Row {row_num}: Invalid or missing email")
        
        if pd.isna(row.get('name')) or not str(row.get('name', '')).strip():
            errors.append(f"Row {row_num}: Missing name")
        
        if pd.isna(row.get('batch_year')):
            errors.append(f"Row {row_num}: Missing batch_year")
        else:
            try:
                year = int(row.get('batch_year'))
                if year < 1950 or year > datetime.now().year:
                    errors.append(f"Row {row_num}: Invalid batch_year {year}")
            except (ValueError, TypeError):
                errors.append(f"Row {row_num}: Invalid batch_year format")
        
        is_valid = len(errors) == 0
        return is_valid, errors
    
    @staticmethod
    def validate_job_market_row(row: pd.Series, row_num: int) -> Tuple[bool, List[str]]:
        """Validate a single job market data row"""
        errors = []
        
        # Required fields
        if pd.isna(row.get('job_title')) or not str(row.get('job_title', '')).strip():
            errors.append(f"Row {row_num}: Missing job_title")
        
        if pd.isna(row.get('company')) or not str(row.get('company', '')).strip():
            errors.append(f"Row {row_num}: Missing company")
        
        if pd.isna(row.get('location')) or not str(row.get('location', '')).strip():
            errors.append(f"Row {row_num}: Missing location")
        
        # Validate salary range if provided
        if not pd.isna(row.get('salary_min')) and not pd.isna(row.get('salary_max')):
            try:
                salary_min = float(row.get('salary_min'))
                salary_max = float(row.get('salary_max'))
                if salary_min > salary_max:
                    errors.append(f"Row {row_num}: salary_min > salary_max")
            except (ValueError, TypeError):
                errors.append(f"Row {row_num}: Invalid salary format")
        
        is_valid = len(errors) == 0
        return is_valid, errors
    
    @staticmethod
    def validate_educational_row(row: pd.Series, row_num: int) -> Tuple[bool, List[str]]:
        """Validate a single educational data row"""
        errors = []
        
        # Required fields
        if pd.isna(row.get('student_id')) or not str(row.get('student_id', '')).strip():
            errors.append(f"Row {row_num}: Missing student_id")
        
        if pd.isna(row.get('email')) or not DatasetValidator.validate_email(str(row.get('email', ''))):
            errors.append(f"Row {row_num}: Invalid or missing email")
        
        if pd.isna(row.get('course_name')) or not str(row.get('course_name', '')).strip():
            errors.append(f"Row {row_num}: Missing course_name")
        
        is_valid = len(errors) == 0
        return is_valid, errors
    
    @staticmethod
    def validate_dataset(df: pd.DataFrame, file_type: str) -> Dict[str, Any]:
        """Validate entire dataset"""
        logger.info(f"Validating {file_type} dataset with {len(df)} rows")
        
        validation_errors = []
        valid_rows = 0
        error_rows = 0
        
        # Select validation function based on file type
        if file_type == 'alumni':
            validate_func = DatasetValidator.validate_alumni_row
        elif file_type == 'job_market':
            validate_func = DatasetValidator.validate_job_market_row
        elif file_type == 'educational':
            validate_func = DatasetValidator.validate_educational_row
        else:
            return {
                'is_valid': False,
                'total_rows': len(df),
                'valid_rows': 0,
                'error_rows': len(df),
                'errors': [f"Unknown file type: {file_type}"]
            }
        
        # Validate each row
        for idx, row in df.iterrows():
            is_valid, errors = validate_func(row, idx + 2)  # +2 for Excel row number (header + 0-index)
            
            if is_valid:
                valid_rows += 1
            else:
                error_rows += 1
                validation_errors.extend(errors)
        
        # Overall validation passes if at least 80% rows are valid
        success_rate = valid_rows / len(df) if len(df) > 0 else 0
        is_valid = success_rate >= 0.8
        
        return {
            'is_valid': is_valid,
            'success_rate': success_rate,
            'total_rows': len(df),
            'valid_rows': valid_rows,
            'error_rows': error_rows,
            'errors': validation_errors[:100]  # Limit to first 100 errors
        }


class DatasetCleaner:
    """Clean and normalize dataset data"""
    
    @staticmethod
    def clean_text_field(value: Any) -> str:
        """Clean and normalize text field"""
        if pd.isna(value):
            return None
        
        text = str(value).strip()
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text if text else None
    
    @staticmethod
    def clean_email(email: Any) -> str:
        """Clean and normalize email"""
        if pd.isna(email):
            return None
        
        email_str = str(email).strip().lower()
        return email_str if DatasetValidator.validate_email(email_str) else None
    
    @staticmethod
    def clean_skills_field(skills: Any) -> List[str]:
        """Clean and parse skills field"""
        if pd.isna(skills):
            return []
        
        skills_str = str(skills)
        
        # Try to parse as JSON array
        import json
        try:
            skills_list = json.loads(skills_str)
            if isinstance(skills_list, list):
                return [DatasetCleaner.clean_text_field(s) for s in skills_list if s]
        except:
            pass
        
        # Try comma-separated
        skills_list = [s.strip() for s in skills_str.split(',')]
        return [s for s in skills_list if s]
    
    @staticmethod
    def clean_alumni_data(df: pd.DataFrame) -> pd.DataFrame:
        """Clean alumni dataset"""
        logger.info(f"Cleaning alumni dataset with {len(df)} rows")
        
        df_clean = df.copy()
        
        # Clean text fields
        if 'name' in df_clean.columns:
            df_clean['name'] = df_clean['name'].apply(DatasetCleaner.clean_text_field)
        
        if 'email' in df_clean.columns:
            df_clean['email'] = df_clean['email'].apply(DatasetCleaner.clean_email)
        
        if 'current_company' in df_clean.columns:
            df_clean['current_company'] = df_clean['current_company'].apply(DatasetCleaner.clean_text_field)
        
        if 'current_role' in df_clean.columns:
            df_clean['current_role'] = df_clean['current_role'].apply(DatasetCleaner.clean_text_field)
        
        if 'location' in df_clean.columns:
            df_clean['location'] = df_clean['location'].apply(DatasetCleaner.clean_text_field)
        
        # Clean skills
        if 'skills' in df_clean.columns:
            df_clean['skills'] = df_clean['skills'].apply(DatasetCleaner.clean_skills_field)
        
        # Clean batch_year
        if 'batch_year' in df_clean.columns:
            df_clean['batch_year'] = pd.to_numeric(df_clean['batch_year'], errors='coerce')
        
        # Remove duplicates based on email
        if 'email' in df_clean.columns:
            df_clean = df_clean.drop_duplicates(subset=['email'], keep='first')
        
        # Remove rows with null required fields
        required_fields = ['email', 'name', 'batch_year']
        df_clean = df_clean.dropna(subset=[f for f in required_fields if f in df_clean.columns])
        
        logger.info(f"Cleaned dataset: {len(df_clean)} rows remaining")
        return df_clean
    
    @staticmethod
    def clean_job_market_data(df: pd.DataFrame) -> pd.DataFrame:
        """Clean job market dataset"""
        logger.info(f"Cleaning job market dataset with {len(df)} rows")
        
        df_clean = df.copy()
        
        # Clean text fields
        text_fields = ['job_title', 'company', 'location', 'industry', 'experience_level']
        for field in text_fields:
            if field in df_clean.columns:
                df_clean[field] = df_clean[field].apply(DatasetCleaner.clean_text_field)
        
        # Clean skills
        if 'required_skills' in df_clean.columns:
            df_clean['required_skills'] = df_clean['required_skills'].apply(DatasetCleaner.clean_skills_field)
        
        # Clean salary fields
        for salary_field in ['salary_min', 'salary_max']:
            if salary_field in df_clean.columns:
                df_clean[salary_field] = pd.to_numeric(df_clean[salary_field], errors='coerce')
        
        # Remove duplicates
        df_clean = df_clean.drop_duplicates(subset=['job_title', 'company'], keep='first')
        
        # Remove rows with null required fields
        required_fields = ['job_title', 'company', 'location']
        df_clean = df_clean.dropna(subset=[f for f in required_fields if f in df_clean.columns])
        
        logger.info(f"Cleaned dataset: {len(df_clean)} rows remaining")
        return df_clean
    
    @staticmethod
    def clean_educational_data(df: pd.DataFrame) -> pd.DataFrame:
        """Clean educational dataset"""
        logger.info(f"Cleaning educational dataset with {len(df)} rows")
        
        df_clean = df.copy()
        
        # Clean text fields
        text_fields = ['student_id', 'course_name', 'instructor']
        for field in text_fields:
            if field in df_clean.columns:
                df_clean[field] = df_clean[field].apply(DatasetCleaner.clean_text_field)
        
        # Clean email
        if 'email' in df_clean.columns:
            df_clean['email'] = df_clean['email'].apply(DatasetCleaner.clean_email)
        
        # Clean skills
        if 'skills_learned' in df_clean.columns:
            df_clean['skills_learned'] = df_clean['skills_learned'].apply(DatasetCleaner.clean_skills_field)
        
        # Remove duplicates
        df_clean = df_clean.drop_duplicates(subset=['student_id', 'course_name'], keep='first')
        
        # Remove rows with null required fields
        required_fields = ['student_id', 'email', 'course_name']
        df_clean = df_clean.dropna(subset=[f for f in required_fields if f in df_clean.columns])
        
        logger.info(f"Cleaned dataset: {len(df_clean)} rows remaining")
        return df_clean
    
    @staticmethod
    def clean_dataset(df: pd.DataFrame, file_type: str) -> pd.DataFrame:
        """Clean dataset based on file type"""
        if file_type == 'alumni':
            return DatasetCleaner.clean_alumni_data(df)
        elif file_type == 'job_market':
            return DatasetCleaner.clean_job_market_data(df)
        elif file_type == 'educational':
            return DatasetCleaner.clean_educational_data(df)
        else:
            logger.error(f"Unknown file type: {file_type}")
            return df
