"""
Career Predictions Router
Frontend-compatible endpoints for /api/career-predictions/*
Maps to existing career prediction service
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
import logging
import json

from middleware.auth_middleware import get_current_user
from database.connection import get_db_pool
from services.career_prediction_service import CareerPredictionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/career-predictions", tags=["Career Predictions"])
career_service = CareerPredictionService()


class LearningResourceRequest(BaseModel):
    """Request model for learning resources"""
    skills: List[str]


@router.get("/user/{user_id}")
async def get_user_prediction(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get career prediction for a specific user
    Frontend endpoint: matches apiCareerPredictionService.getUserPrediction()
    
    Returns prediction with fields matching frontend expectations:
    - role_name (instead of role)
    - skills_gap (instead of required_skills)
    - similar_alumni_count
    - etc.
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # First, try to get cached prediction
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, user_id, current_role, predicted_roles, 
                        recommended_skills, similar_alumni, 
                        confidence_score, created_at
                    FROM career_predictions
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (user_id,))
                cached_result = await cursor.fetchone()
            
            # If no cached prediction exists, generate new one
            if not cached_result:
                prediction = await career_service.predict_career_path(conn, user_id)
            else:
                # Use cached prediction but format it properly
                prediction = await _format_cached_prediction(conn, cached_result, user_id)
            
            # Transform data structure to match frontend expectations
            formatted_prediction = await _transform_for_frontend(prediction)
            
            return {
                "success": True,
                "data": formatted_prediction
            }
    
    except ValueError as ve:
        raise HTTPException(
            status_code=404,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error getting user prediction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get prediction: {str(e)}"
        )


@router.get("")
async def get_all_predictions(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all career predictions (admin endpoint)
    Frontend endpoint: matches apiCareerPredictionService.getAllPredictions()
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        cp.id, cp.user_id, cp.current_role, 
                        cp.predicted_roles, cp.confidence_score, 
                        cp.created_at,
                        ap.name
                    FROM career_predictions cp
                    LEFT JOIN alumni_profiles ap ON cp.user_id = ap.user_id
                    ORDER BY cp.created_at DESC
                    LIMIT %s
                """, (limit,))
                results = await cursor.fetchall()
        
        predictions = []
        for row in results:
            predicted_roles = json.loads(row[3]) if row[3] else []
            predictions.append({
                "prediction_id": row[0],
                "user_id": row[1],
                "user_name": row[6] or "Unknown",
                "current_role": row[2],
                "top_predicted_role": predicted_roles[0].get('role', 'N/A') if predicted_roles else 'N/A',
                "confidence_score": float(row[4]) if row[4] else 0,
                "prediction_date": row[5].isoformat() if row[5] else None
            })
        
        return {
            "success": True,
            "data": {
                "predictions": predictions,
                "total": len(predictions)
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting all predictions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get predictions: {str(e)}"
        )


@router.get("/by-role")
async def get_predictions_by_role(
    role: str = Query(..., description="Role to filter by"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get predictions filtered by current role
    Frontend endpoint: matches apiCareerPredictionService.getPredictionsByRole()
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        cp.id, cp.user_id, cp.current_role, 
                        cp.predicted_roles, cp.confidence_score, 
                        cp.created_at,
                        ap.name
                    FROM career_predictions cp
                    LEFT JOIN alumni_profiles ap ON cp.user_id = ap.user_id
                    WHERE cp.current_role = %s
                    ORDER BY cp.created_at DESC
                    LIMIT 100
                """, (role,))
                results = await cursor.fetchall()
        
        predictions = []
        for row in results:
            predicted_roles = json.loads(row[3]) if row[3] else []
            predictions.append({
                "prediction_id": row[0],
                "user_id": row[1],
                "user_name": row[6] or "Unknown",
                "current_role": row[2],
                "predicted_roles": predicted_roles,
                "confidence_score": float(row[4]) if row[4] else 0,
                "prediction_date": row[5].isoformat() if row[5] else None
            })
        
        return {
            "success": True,
            "data": {
                "role": role,
                "predictions": predictions,
                "total": len(predictions)
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting predictions by role: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get predictions by role: {str(e)}"
        )


@router.get("/user/{user_id}/role/{role_name}")
async def get_predicted_role_details(
    user_id: str,
    role_name: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific predicted role for a user
    Frontend endpoint: matches apiCareerPredictionService.getPredictedRoleDetails()
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Get user's prediction
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT predicted_roles
                    FROM career_predictions
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (user_id,))
                result = await cursor.fetchone()
            
            if not result or not result[0]:
                raise HTTPException(
                    status_code=404,
                    detail="No predictions found for this user"
                )
            
            predicted_roles = json.loads(result[0]) if isinstance(result[0], str) else result[0]
            
            # Find the specific role
            role_details = None
            for pred in predicted_roles:
                if pred.get('role', '').lower() == role_name.lower():
                    role_details = pred
                    break
            
            if not role_details:
                raise HTTPException(
                    status_code=404,
                    detail=f"Predicted role '{role_name}' not found for this user"
                )
            
            # Get additional data from career transition matrix
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        avg_duration_months, required_skills, 
                        success_rate, transition_count
                    FROM career_transition_matrix
                    WHERE to_role = %s
                    ORDER BY transition_probability DESC
                    LIMIT 1
                """, (role_name,))
                matrix_data = await cursor.fetchone()
            
            # Enhance role details
            if matrix_data:
                role_details['avg_duration_months'] = matrix_data[0] or role_details.get('timeframe_months', 24)
                role_details['success_rate'] = float(matrix_data[2]) if matrix_data[2] else role_details.get('success_rate', 0.7)
                role_details['sample_size'] = matrix_data[3] or 0
            
            # Transform field names for frontend
            formatted_details = {
                "role_name": role_details.get('role', role_name),
                "probability": role_details.get('probability', 0.5),
                "timeframe_months": role_details.get('timeframe_months', 24),
                "skills_gap": role_details.get('required_skills', []),
                "skill_match_percentage": role_details.get('skill_match_percentage', 50.0),
                "success_rate": role_details.get('success_rate', 0.7),
                "avg_duration_months": role_details.get('avg_duration_months', 24),
                "sample_size": role_details.get('sample_size', 0),
                "confidence": role_details.get('confidence', 'medium')
            }
            
            return {
                "success": True,
                "data": formatted_details
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting predicted role details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get role details: {str(e)}"
        )


@router.get("/similar-alumni")
async def get_similar_alumni(
    role: str = Query(..., description="Target role to find alumni"),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Get alumni who successfully transitioned to a specific role
    Frontend endpoint: matches apiCareerPredictionService.getSimilarAlumni()
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Find alumni currently in the target role
                await cursor.execute("""
                    SELECT 
                        ap.user_id, ap.name, ap.current_role, 
                        ap.current_company, ap.years_of_experience,
                        ap.skills, ap.photo_url, 
                        JSON_UNQUOTE(JSON_EXTRACT(ap.social_links, '$.linkedin')) as linkedin_url
                    FROM alumni_profiles ap
                    WHERE ap.current_role = %s
                    AND ap.user_id != %s
                    ORDER BY ap.years_of_experience DESC
                    LIMIT %s
                """, (role, current_user['id'], limit))
                alumni_results = await cursor.fetchall()
        
        similar_alumni = []
        for alum in alumni_results:
            skills = []
            if alum[5]:
                try:
                    skills = json.loads(alum[5]) if isinstance(alum[5], str) else alum[5]
                    if not isinstance(skills, list):
                        skills = []
                except (json.JSONDecodeError, TypeError):
                    skills = []
            
            similar_alumni.append({
                "user_id": alum[0],
                "name": alum[1],
                "current_role": alum[2],
                "company": alum[3],
                "years_of_experience": alum[4] or 0,
                "skills": skills,
                "photo_url": alum[6],
                "linkedin_url": alum[7],
                "successfully_transitioned": True
            })
        
        return {
            "success": True,
            "data": {
                "role": role,
                "alumni": similar_alumni,
                "total": len(similar_alumni)
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting similar alumni: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get similar alumni: {str(e)}"
        )


@router.post("/learning-resources")
async def get_learning_resources(
    request: LearningResourceRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Get recommended learning resources for specific skills
    Frontend endpoint: matches apiCareerPredictionService.getLearningResources()
    """
    try:
        skills = request.skills
        
        # Generate learning resources for each skill
        resources = []
        for skill in skills:
            # In a real implementation, this would query a learning resources database
            # or integrate with platforms like Coursera, Udemy, etc.
            resources.append({
                "skill": skill,
                "resources": [
                    {
                        "title": f"Master {skill} - Complete Guide",
                        "type": "course",
                        "provider": "Online Learning Platform",
                        "duration": "4-6 weeks",
                        "level": "Intermediate",
                        "url": f"https://example.com/courses/{skill.lower().replace(' ', '-')}",
                        "rating": 4.5
                    },
                    {
                        "title": f"{skill} Fundamentals",
                        "type": "tutorial",
                        "provider": "Tech Blog",
                        "duration": "2-3 hours",
                        "level": "Beginner",
                        "url": f"https://example.com/tutorials/{skill.lower().replace(' ', '-')}",
                        "rating": 4.3
                    },
                    {
                        "title": f"Advanced {skill} Techniques",
                        "type": "book",
                        "provider": "Tech Publishers",
                        "duration": "Self-paced",
                        "level": "Advanced",
                        "url": f"https://example.com/books/{skill.lower().replace(' ', '-')}",
                        "rating": 4.7
                    }
                ]
            })
        
        return {
            "success": True,
            "data": {
                "skills": skills,
                "resources": resources,
                "total_resources": len(resources) * 3
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting learning resources: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get learning resources: {str(e)}"
        )


# ============================================================================
# PHASE 3: ML MODEL TRAINING ENDPOINTS
# ============================================================================

@router.post("/train-model")
async def train_ml_model(
    min_samples: int = Query(50, ge=10, le=1000, description="Minimum training samples required"),
    current_user: dict = Depends(get_current_user)
):
    """
    Train career prediction ML model
    Requires admin privileges
    
    This endpoint:
    1. Extracts career transition data from database
    2. Trains a Random Forest classifier
    3. Saves the model to disk
    4. Stores model metadata in database
    
    Minimum 50 career transitions recommended for good accuracy
    """
    try:
        # Check if user is admin
        if current_user.get('role') != 'admin':
            raise HTTPException(
                status_code=403,
                detail="Only administrators can train ML models"
            )
        
        logger.info(f"Starting ML model training (min_samples={min_samples})...")
        
        # Import trainer
        from ml.career_model_trainer import CareerModelTrainer
        
        # Get database connection
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Initialize trainer and train model
            trainer = CareerModelTrainer()
            result = await trainer.train_from_database(conn, min_samples=min_samples)
        
        if result.get('success'):
            logger.info(f"✅ Model training completed: {result.get('metrics', {}).get('accuracy', 0):.3f} accuracy")
            
            # Reload model in model loader
            from ml.model_loader import reload_model
            reload_model()
            
            return {
                "success": True,
                "message": "Model trained successfully",
                "data": result
            }
        else:
            logger.warning(f"Model training failed: {result.get('message')}")
            return {
                "success": False,
                "message": result.get('message'),
                "data": result
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to train model: {str(e)}"
        )


@router.post("/calculate-matrix")
async def calculate_transition_matrix(
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate career transition probability matrix
    Updates career_transition_matrix table with latest data
    
    This endpoint:
    1. Analyzes historical career transitions
    2. Calculates transition probabilities between roles
    3. Updates the career_transition_matrix table
    4. Provides foundation for rule-based predictions
    """
    try:
        # Check if user is admin
        if current_user.get('role') != 'admin':
            raise HTTPException(
                status_code=403,
                detail="Only administrators can calculate transition matrix"
            )
        
        logger.info("Calculating career transition matrix...")
        
        # Import trainer
        from ml.career_model_trainer import CareerModelTrainer
        
        # Get database connection
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Initialize trainer and calculate matrix
            trainer = CareerModelTrainer()
            result = await trainer.calculate_transition_matrix(conn)
        
        if result.get('success'):
            logger.info(f"✅ Transition matrix calculated: {result.get('transitions_calculated')} transitions")
            return {
                "success": True,
                "message": "Transition matrix calculated successfully",
                "data": result
            }
        else:
            logger.warning(f"Matrix calculation failed: {result.get('message')}")
            return {
                "success": False,
                "message": result.get('message'),
                "data": result
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating matrix: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate matrix: {str(e)}"
        )


@router.get("/model-status")
async def get_model_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Get ML model status and metadata
    
    Returns information about:
    - Model availability and loading status
    - Model type and framework
    - Training metrics (accuracy, precision, etc.)
    - Feature count and classes
    - Training data statistics from database
    """
    try:
        from ml.model_loader import get_model_loader
        
        # Get model loader
        model_loader = get_model_loader()
        model_info = model_loader.get_model_info()
        
        # Get training data statistics from database
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Count career transitions
                await cursor.execute("""
                    SELECT COUNT(*) as total_transitions,
                           COUNT(DISTINCT from_role) as unique_from_roles,
                           COUNT(DISTINCT to_role) as unique_to_roles
                    FROM career_paths
                    WHERE from_role IS NOT NULL AND to_role IS NOT NULL
                """)
                transitions_data = await cursor.fetchone()
                
                # Count transition matrix entries
                await cursor.execute("""
                    SELECT COUNT(*) as matrix_entries,
                           MAX(last_calculated) as last_updated
                    FROM career_transition_matrix
                """)
                matrix_data = await cursor.fetchone()
                
                # Get latest model metadata
                await cursor.execute("""
                    SELECT model_name, model_version, framework,
                           accuracy, trained_at, status
                    FROM ml_models
                    WHERE model_name = 'career_predictor'
                    ORDER BY trained_at DESC
                    LIMIT 1
                """)
                model_metadata = await cursor.fetchone()
        
        # Build response
        response = {
            "model_loaded": model_info.get('loaded', False),
            "model_info": model_info,
            "training_data": {
                "total_transitions": transitions_data[0] if transitions_data else 0,
                "unique_from_roles": transitions_data[1] if transitions_data else 0,
                "unique_to_roles": transitions_data[2] if transitions_data else 0,
                "sufficient_for_training": (transitions_data[0] if transitions_data else 0) >= 50
            },
            "transition_matrix": {
                "entries": matrix_data[0] if matrix_data else 0,
                "last_updated": matrix_data[1].isoformat() if matrix_data and matrix_data[1] else None
            }
        }
        
        # Add model metadata if available
        if model_metadata:
            response["latest_model"] = {
                "name": model_metadata[0],
                "version": model_metadata[1],
                "framework": model_metadata[2],
                "accuracy": float(model_metadata[3]) if model_metadata[3] else None,
                "trained_at": model_metadata[4].isoformat() if model_metadata[4] else None,
                "status": model_metadata[5]
            }
        else:
            response["latest_model"] = None
        
        return {
            "success": True,
            "data": response
        }
    
    except Exception as e:
        logger.error(f"Error getting model status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get model status: {str(e)}"
        )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _format_cached_prediction(db_conn, cached_result, user_id: str) -> dict:
    """
    Format a cached prediction from database into prediction format
    """
    prediction_id = cached_result[0]
    current_role = cached_result[2]
    predicted_roles_raw = cached_result[3]
    recommended_skills_raw = cached_result[4]
    similar_alumni_raw = cached_result[5]
    confidence_score = float(cached_result[6]) if cached_result[6] else 0
    created_at = cached_result[7]
    
    # Parse JSON fields
    predicted_roles = json.loads(predicted_roles_raw) if isinstance(predicted_roles_raw, str) else (predicted_roles_raw or [])
    recommended_skills = json.loads(recommended_skills_raw) if isinstance(recommended_skills_raw, str) else (recommended_skills_raw or [])
    similar_alumni_ids = json.loads(similar_alumni_raw) if isinstance(similar_alumni_raw, str) else (similar_alumni_raw or [])
    
    # Get user profile for additional info
    async with db_conn.cursor() as cursor:
        await cursor.execute("""
            SELECT current_company, skills, years_of_experience, industry
            FROM alumni_profiles
            WHERE user_id = %s
        """, (user_id,))
        profile = await cursor.fetchone()
    
    current_company = profile[0] if profile else None
    user_skills_raw = profile[1] if profile else None
    years_exp = profile[2] if profile else 0
    industry = profile[3] if profile else "Unknown"
    
    # Parse user's actual skills
    user_skills = []
    if user_skills_raw:
        try:
            user_skills = json.loads(user_skills_raw) if isinstance(user_skills_raw, str) else user_skills_raw
            if not isinstance(user_skills, list):
                user_skills = []
        except (json.JSONDecodeError, TypeError):
            user_skills = []
    
    # Get similar alumni details
    similar_alumni = []
    if similar_alumni_ids:
        async with db_conn.cursor() as cursor:
            placeholders = ','.join(['%s'] * len(similar_alumni_ids))
            await cursor.execute(f"""
                SELECT user_id, name, current_role, current_company, 
                       years_of_experience, photo_url
                FROM alumni_profiles
                WHERE user_id IN ({placeholders})
            """, tuple(similar_alumni_ids))
            alum_results = await cursor.fetchall()
        
        for alum in alum_results:
            similar_alumni.append({
                "user_id": alum[0],
                "name": alum[1],
                "current_role": alum[2],
                "current_company": alum[3],
                "years_of_experience": alum[4] or 0,
                "photo_url": alum[5],
                "similarity_score": 0.8
            })
    
    return {
        "prediction_id": str(prediction_id),
        "current_role": current_role,
        "current_company": current_company,
        "years_of_experience": years_exp,
        "industry": industry,
        "predicted_roles": predicted_roles,
        "recommended_skills": recommended_skills,
        "current_skills": user_skills,  # Add user's actual current skills
        "similar_alumni": similar_alumni,
        "confidence_score": confidence_score,
        "prediction_date": created_at.isoformat() if created_at else None
    }


async def _transform_for_frontend(prediction: dict) -> dict:
    """
    Transform backend prediction format to match frontend expectations
    
    Frontend expects:
    - role_name (not role)
    - skills_gap (not required_skills)
    - skill_importance
    - similar_alumni_count
    - experience_level
    - current_skills
    - last_updated
    - next_update
    """
    from datetime import datetime, timedelta
    
    # Transform predicted_roles to match frontend structure
    transformed_roles = []
    for pred in prediction.get('predicted_roles', []):
        required_skills = pred.get('required_skills', [])
        
        # Create skill_importance mapping
        skill_importance = {}
        for i, skill in enumerate(required_skills[:5]):
            if i == 0:
                skill_importance[skill] = 'critical'
            elif i <= 2:
                skill_importance[skill] = 'high'
            else:
                skill_importance[skill] = 'medium'
        
        transformed_roles.append({
            "role_name": pred.get('role', 'Unknown'),  # Map role -> role_name
            "probability": pred.get('probability', 0.5),
            "skills_gap": required_skills,  # Map required_skills -> skills_gap
            "skill_importance": skill_importance,  # Add skill_importance
            "similar_alumni_count": len(prediction.get('similar_alumni', [])),  # Add count
            "timeframe_months": pred.get('timeframe_months', 24),
            "skill_match_percentage": pred.get('skill_match_percentage', 50.0),
            "success_rate": pred.get('success_rate', 0.7)
        })
    
    # Determine experience level
    years_exp = prediction.get('years_of_experience', 0)
    if years_exp < 2:
        experience_level = 'junior'
    elif years_exp < 5:
        experience_level = 'mid-level'
    elif years_exp < 10:
        experience_level = 'senior'
    else:
        experience_level = 'expert'
    
    # Calculate dates
    last_updated = prediction.get('prediction_date')
    if last_updated:
        if isinstance(last_updated, str):
            last_updated_dt = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
        else:
            last_updated_dt = last_updated
        next_update = (last_updated_dt + timedelta(days=30)).isoformat()
    else:
        last_updated = datetime.now().isoformat()
        next_update = (datetime.now() + timedelta(days=30)).isoformat()
    
    # Extract current_skills - should be actual user skills, not recommended
    # The service might include it in user_profile_dict or we need to fetch it
    current_skills = prediction.get('current_skills', [])
    if not current_skills:
        # Fallback: use first few recommended skills as proxy
        # In real scenario, this should be fetched from alumni_profiles.skills
        current_skills = prediction.get('recommended_skills', [])[:8]
    
    return {
        "prediction_id": prediction.get('prediction_id'),
        "user_id": prediction.get('user_id'),
        "current_role": prediction.get('current_role'),
        "current_company": prediction.get('current_company'),
        "predicted_roles": transformed_roles,
        "current_skills": current_skills[:10] if current_skills else [],
        "experience_level": experience_level,
        "confidence_score": prediction.get('confidence_score', 0),
        "personalized_advice": prediction.get('personalized_advice', ''),
        "similar_alumni": prediction.get('similar_alumni', []),
        "last_updated": last_updated,
        "next_update": next_update
    }
