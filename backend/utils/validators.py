"""
Validation utilities for input validation
"""
import re
from fastapi import HTTPException
from typing import Any, Optional


def validate_uuid(value: str, field_name: str = "ID") -> str:
    """
    Validate UUID format (with optional prefix support)
    
    Handles prefixed UUIDs like:
    - job-550e8400-e29b-41d4-a716-446655440014
    - user-550e8400-e29b-41d4-a716-446655440014
    
    Returns the clean UUID without prefix
    
    Args:
        value: String to validate as UUID
        field_name: Name of the field for error messages
        
    Returns:
        The validated UUID string (cleaned of prefix)
        
    Raises:
        HTTPException: If UUID format is invalid
    """
    if not value:
        raise HTTPException(status_code=400, detail=f"{field_name} is required")
    
    # Strip common prefixes
    prefixes = ['job-', 'user-', 'profile-', 'event-', 'mentor-', 'application-', 
                'post-', 'comment-', 'badge-', 'session-', 'capsule-']
    clean_value = value
    for prefix in prefixes:
        if value.startswith(prefix):
            clean_value = value[len(prefix):]
            break
    
    # UUID v4 format: 8-4-4-4-12 hex characters
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    
    if not uuid_pattern.match(clean_value):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name} format. Must be a valid UUID."
        )
    
    return clean_value  # Return clean UUID without prefix


def validate_email(email: str) -> str:
    """
    Validate email format
    
    Args:
        email: Email address to validate
        
    Returns:
        The validated email string
        
    Raises:
        HTTPException: If email format is invalid
    """
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    email_pattern = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    
    if not email_pattern.match(email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format"
        )
    
    return email.lower()


def validate_password(password: str) -> str:
    """
    Validate password strength
    
    Args:
        password: Password to validate
        
    Returns:
        The validated password string
        
    Raises:
        HTTPException: If password doesn't meet requirements
    """
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long"
        )
    
    # Check for at least one uppercase, one lowercase, and one digit
    if not re.search(r'[A-Z]', password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter"
        )
    
    if not re.search(r'[a-z]', password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter"
        )
    
    if not re.search(r'\d', password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one digit"
        )
    
    return password


def validate_role(role: str) -> str:
    """
    Validate user role
    
    Args:
        role: Role to validate
        
    Returns:
        The validated role string
        
    Raises:
        HTTPException: If role is invalid
    """
    valid_roles = ['student', 'alumni', 'recruiter', 'admin']
    
    if role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    return role


def validate_positive_int(value: Any, field_name: str = "Value") -> int:
    """
    Validate positive integer
    
    Args:
        value: Value to validate
        field_name: Name of the field for error messages
        
    Returns:
        The validated integer
        
    Raises:
        HTTPException: If value is not a positive integer
    """
    try:
        int_value = int(value)
        if int_value <= 0:
            raise ValueError()
        return int_value
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be a positive integer"
        )


def validate_url(url: str, field_name: str = "URL") -> str:
    """
    Validate URL format
    
    Args:
        url: URL to validate
        field_name: Name of the field for error messages
        
    Returns:
        The validated URL string
        
    Raises:
        HTTPException: If URL format is invalid
    """
    if not url:
        return url  # Allow empty URLs
    
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )
    
    if not url_pattern.match(url):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name} format"
        )
    
    return url


def validate_phone(phone: str) -> str:
    """
    Validate phone number format
    
    Args:
        phone: Phone number to validate
        
    Returns:
        The validated phone string
        
    Raises:
        HTTPException: If phone format is invalid
    """
    if not phone:
        return phone  # Allow empty phone
    
    # Remove common separators
    clean_phone = re.sub(r'[\s\-\(\)\.]', '', phone)
    
    # Check if it's a valid phone number (10-15 digits, optionally starting with +)
    phone_pattern = re.compile(r'^\+?[1-9]\d{9,14}$')
    
    if not phone_pattern.match(clean_phone):
        raise HTTPException(
            status_code=400,
            detail="Invalid phone number format"
        )
    
    return phone