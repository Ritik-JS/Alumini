"""
Career Data Collection Routes
Endpoints for collecting career transition data for ML training
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, validator
from typing import List, Optional
from datetime import datetime, date
import logging
import json
import csv
import io
import uuid

from middleware.auth_middleware import get_current_user, require_role
from database.connection import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/career-data", tags=["Career Data Collection"])


# ============================================================================
# REQUEST MODELS
# ============================================================================

class CareerTransitionInput(BaseModel):
    """Model for career transition submission"""
    from_role: str
    to_role: str
    from_company: Optional[str] = None
    to_company: Optional[str] = None
    transition_date: date
    skills_acquired: List[str] = []
    success_rating: int
    
    @validator('success_rating')
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('success_rating must be between 1 and 5')
        return v
    
    @validator('from_role', 'to_role')
    def validate_roles(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('Role must be at least 3 characters')
        return v.strip()
    
    def calculate_duration(self) -> int:
        """Calculate duration in months (default 24 if not calculable)"""
        return 24  # Default duration


# ============================================================================
# USER ENDPOINTS - Add Career Transitions
# ============================================================================

@router.post("")
async def add_career_transition(
    career_data: CareerTransitionInput,
    current_user: dict = Depends(get_current_user)
):
    """
    Add a career transition record
    
    Users can submit their career history to help train the ML model.
    Requires authenticated user.
    
    **Request Body:**
    - from_role: Previous job role
    - to_role: New job role  
    - from_company: Previous company (optional)
    - to_company: New company (optional)
    - transition_date: Date of transition
    - skills_acquired: List of skills learned
    - success_rating: 1-5 rating of transition success
    
    **Returns:**
    - Success message with career path ID
    """
    try:
        user_id = current_user['id']
        pool = await get_db_pool()
        
        # Calculate duration
        duration_months = career_data.calculate_duration()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Insert career path
                await cursor.execute("""
                    INSERT INTO career_paths
                    (user_id, from_role, to_role, from_company, to_company,
                     transition_date, transition_duration_months, skills_acquired, success_rating)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id,
                    career_data.from_role,
                    career_data.to_role,
                    career_data.from_company,
                    career_data.to_company,
                    career_data.transition_date,
                    duration_months,
                    json.dumps(career_data.skills_acquired),
                    career_data.success_rating
                ))
                
                await conn.commit()
                
                # Get the inserted ID
                await cursor.execute("SELECT LAST_INSERT_ID()")
                result = await cursor.fetchone()
                path_id = result[0] if result else None
        
        logger.info(f"Career transition added by user {user_id}: {career_data.from_role} -> {career_data.to_role}")
        
        return {
            "success": True,
            "message": "Career transition added successfully",
            "data": {
                "path_id": str(path_id),
                "from_role": career_data.from_role,
                "to_role": career_data.to_role
            }
        }
    
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error adding career transition: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add career transition: {str(e)}"
        )


@router.get("/my-transitions")
async def get_my_career_transitions(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all career transitions for the current user
    
    Returns the user's submitted career history.
    """
    try:
        user_id = current_user['id']
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, from_role, to_role, from_company, to_company,
                        transition_date, transition_duration_months, 
                        skills_acquired, success_rating, created_at
                    FROM career_paths
                    WHERE user_id = %s
                    ORDER BY transition_date DESC
                """, (user_id,))
                transitions = await cursor.fetchall()
        
        result = []
        for trans in transitions:
            skills = []
            if trans[7]:
                try:
                    skills = json.loads(trans[7]) if isinstance(trans[7], str) else trans[7]
                except (json.JSONDecodeError, TypeError):
                    skills = []
            
            result.append({
                "id": trans[0],
                "from_role": trans[1],
                "to_role": trans[2],
                "from_company": trans[3],
                "to_company": trans[4],
                "transition_date": trans[5].isoformat() if trans[5] else None,
                "duration_months": trans[6],
                "skills_acquired": skills,
                "success_rating": trans[8],
                "created_at": trans[9].isoformat() if trans[9] else None
            })
        
        return {
            "success": True,
            "data": {
                "transitions": result,
                "total": len(result)
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting user transitions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get transitions: {str(e)}"
        )


# ============================================================================
# ADMIN ENDPOINTS - Bulk Upload & Statistics
# ============================================================================

@router.post("/admin/upload", dependencies=[Depends(require_role(["admin"]))])
async def bulk_upload_career_data(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["admin"]))
):
    """
    Bulk upload career transition data via CSV
    
    **Admin Only**
    
    CSV Format:
    - email, from_role, to_role, from_company, to_company, transition_date, skills_acquired, success_rating
    - Skills should be separated by pipes (|): "Skill1|Skill2|Skill3"
    - Transition date format: YYYY-MM-DD
    - Success rating: 1-5
    
    **Auto-User Creation:**
    - If a user email doesn't exist, a basic user profile will be automatically created
    - Auto-created users have role 'alumni' with no password (must reset to login)
    
    **Returns:**
    - success_count: Number of records imported
    - failed_count: Number of records failed
    - errors: List of error messages
    """
    try:
        # Read CSV file
        content = await file.read()
        csv_file = io.StringIO(content.decode('utf-8'))
        reader = csv.DictReader(csv_file)
        
        success_count = 0
        error_count = 0
        errors = []
        
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (1 is header)
                try:
                    # Validate required fields
                    if not row.get('email'):
                        errors.append(f"Row {row_num}: Missing email")
                        error_count += 1
                        continue
                    
                    async with conn.cursor() as cursor:
                        # Get user_id from email, create user if doesn't exist
                        await cursor.execute(
                            "SELECT id FROM users WHERE email = %s",
                            (row['email'],)
                        )
                        user = await cursor.fetchone()
                        
                        if not user:
                            # Auto-create user and profile
                            try:
                                # Generate UUID for new user
                                new_user_id = str(uuid.uuid4())
                                
                                # Extract name from email (before @)
                                email_prefix = row['email'].split('@')[0]
                                # Convert john.doe or john_doe to John Doe
                                name_parts = email_prefix.replace('.', ' ').replace('_', ' ').split()
                                display_name = ' '.join([part.capitalize() for part in name_parts])
                                
                                # Create user with placeholder password
                                await cursor.execute("""
                                    INSERT INTO users (id, email, password_hash, role, is_verified, is_active)
                                    VALUES (%s, %s, %s, 'alumni', FALSE, TRUE)
                                """, (
                                    new_user_id,
                                    row['email'],
                                    'IMPORTED_FROM_CSV_NO_PASSWORD'  # Placeholder - user must reset password to login
                                ))
                                
                                # Create alumni profile
                                await cursor.execute("""
                                    INSERT INTO alumni_profiles (user_id, name, bio, profile_completion_percentage)
                                    VALUES (%s, %s, %s, 10)
                                """, (
                                    new_user_id,
                                    display_name,
                                    'Profile auto-created from career data import'
                                ))
                                
                                user_id = new_user_id
                                logger.info(f"Auto-created user and profile for {row['email']} during CSV import")
                                    
                            except Exception as create_error:
                                errors.append(f"Row {row_num}: Failed to auto-create user {row['email']}: {str(create_error)}")
                                error_count += 1
                                logger.error(f"Error creating user {row['email']}: {str(create_error)}")
                                continue
                        else:
                            user_id = user[0]
                        
                        # Parse skills (pipe-separated)
                        skills = []
                        if row.get('skills_acquired'):
                            skills = [s.strip() for s in row['skills_acquired'].split('|') if s.strip()]
                        
                        # Parse transition date
                        try:
                            transition_date = datetime.strptime(row['transition_date'], '%Y-%m-%d').date()
                        except (ValueError, KeyError):
                            errors.append(f"Row {row_num}: Invalid date format (use YYYY-MM-DD)")
                            error_count += 1
                            continue
                        
                        # Default duration
                        duration_months = 24
                        
                        # Validate success rating
                        try:
                            success_rating = int(row.get('success_rating', 3))
                            if not 1 <= success_rating <= 5:
                                raise ValueError()
                        except ValueError:
                            errors.append(f"Row {row_num}: Invalid success_rating (must be 1-5)")
                            error_count += 1
                            continue
                        
                        # Insert career path
                        await cursor.execute("""
                            INSERT INTO career_paths
                            (user_id, from_role, to_role, from_company, to_company,
                             transition_date, transition_duration_months, skills_acquired, success_rating)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            user_id,
                            row.get('from_role', '').strip(),
                            row.get('to_role', '').strip(),
                            row.get('from_company', '').strip() or None,
                            row.get('to_company', '').strip() or None,
                            transition_date,
                            duration_months,
                            json.dumps(skills),
                            success_rating
                        ))
                        
                        success_count += 1
                
                except Exception as e:
                    error_msg = f"Row {row_num}: {str(e)}"
                    errors.append(error_msg)
                    error_count += 1
                    logger.error(error_msg)
            
            # Commit all successful inserts
            await conn.commit()
        
        logger.info(f"Bulk upload completed by admin {current_user['id']}: {success_count} success, {error_count} failed")
        
        return {
            "success": True,
            "message": f"Upload completed: {success_count} records imported, {error_count} failed",
            "data": {
                "success_count": success_count,
                "failed_count": error_count,
                "errors": errors[:50]  # Limit to first 50 errors
            }
        }
    
    except Exception as e:
        logger.error(f"Error in bulk upload: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Bulk upload failed: {str(e)}"
        )


@router.get("/admin/stats", dependencies=[Depends(require_role(["admin"]))])
async def get_career_data_statistics(
    current_user: dict = Depends(require_role(["admin"]))
):
    """
    Get statistics about career data collection for ML training
    
    **Admin Only**
    
    Returns:
    - total_transitions: Total career paths in database
    - unique_from_roles: Number of unique source roles
    - unique_to_roles: Number of unique target roles
    - contributing_alumni: Number of users who contributed
    - recent_additions: Additions in last 7 days
    - ml_ready: Whether sufficient data for ML training (50+)
    - progress_percentage: Progress toward ML training goal
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Total transitions
                await cursor.execute("""
                    SELECT COUNT(*) FROM career_paths
                    WHERE from_role IS NOT NULL AND to_role IS NOT NULL
                """)
                total_transitions = (await cursor.fetchone())[0]
                
                # Unique from roles
                await cursor.execute("""
                    SELECT COUNT(DISTINCT from_role) FROM career_paths
                    WHERE from_role IS NOT NULL
                """)
                unique_from_roles = (await cursor.fetchone())[0]
                
                # Unique to roles
                await cursor.execute("""
                    SELECT COUNT(DISTINCT to_role) FROM career_paths
                    WHERE to_role IS NOT NULL
                """)
                unique_to_roles = (await cursor.fetchone())[0]
                
                # Contributing alumni
                await cursor.execute("""
                    SELECT COUNT(DISTINCT user_id) FROM career_paths
                """)
                contributing_alumni = (await cursor.fetchone())[0]
                
                # Recent additions (last 7 days)
                await cursor.execute("""
                    SELECT COUNT(*) FROM career_paths
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                """)
                recent_additions = (await cursor.fetchone())[0]
                
                # Get top transitions
                await cursor.execute("""
                    SELECT from_role, to_role, COUNT(*) as count
                    FROM career_paths
                    WHERE from_role IS NOT NULL AND to_role IS NOT NULL
                    GROUP BY from_role, to_role
                    ORDER BY count DESC
                    LIMIT 5
                """)
                top_transitions = await cursor.fetchall()
        
        # Calculate progress
        ml_ready = total_transitions >= 50
        progress_percentage = min(100, (total_transitions / 50) * 100)
        
        top_transitions_list = [
            {
                "from_role": t[0],
                "to_role": t[1],
                "count": t[2]
            }
            for t in top_transitions
        ]
        
        return {
            "success": True,
            "data": {
                "total_transitions": total_transitions,
                "unique_from_roles": unique_from_roles,
                "unique_to_roles": unique_to_roles,
                "contributing_alumni": contributing_alumni,
                "recent_additions": recent_additions,
                "ml_ready": ml_ready,
                "progress_percentage": round(progress_percentage, 1),
                "ml_target": 50,
                "remaining_needed": max(0, 50 - total_transitions),
                "top_transitions": top_transitions_list
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting career data stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics: {str(e)}"
        )


@router.get("/admin/csv-template")
async def download_csv_template(
    current_user: dict = Depends(require_role(["admin"]))
):
    """
    Download CSV template for bulk career data upload
    
    **Admin Only**
    
    Returns a CSV template with proper headers and example data.
    """
    template_content = """email,from_role,to_role,from_company,to_company,transition_date,skills_acquired,success_rating
john.doe@alumni.edu,Software Engineer,Senior Software Engineer,Microsoft,Google,2022-03-01,System Design|Leadership|Kubernetes,4
jane.smith@alumni.edu,Software Engineer,Product Manager,Meta,Amazon,2021-08-01,Product Strategy|Stakeholder Management,5
sarah.wilson@alumni.edu,UX Designer,Lead UX Designer,Dropbox,Airbnb,2023-01-01,Design Systems|Team Leadership,5"""
    
    return {
        "success": True,
        "data": {
            "template": template_content,
            "filename": "career_transitions_template.csv",
            "instructions": {
                "email": "User's email address (auto-creates user if not found)",
                "from_role": "Previous job role",
                "to_role": "New job role",
                "from_company": "Previous company (optional)",
                "to_company": "New company (optional)",
                "transition_date": "Date in YYYY-MM-DD format",
                "skills_acquired": "Skills separated by | (pipe), e.g., 'Skill1|Skill2|Skill3'",
                "success_rating": "Rating from 1 to 5"
            }
        }
    }
