"""
ML Model Administration Routes
Admin endpoints for training and managing ML models
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import logging

from middleware.auth_middleware import get_current_user, require_role
from database.connection import get_db_pool
from ml.career_model_trainer import CareerModelTrainer
from ml.model_loader import get_model_loader, reload_model

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/ml", tags=["ML Administration"])


@router.post("/train-career-model")
async def train_career_prediction_model(
    min_samples: Optional[int] = 30,
    current_user: dict = Depends(require_role(["admin"]))
):
    """
    Train or retrain career prediction ML model
    
    **Admin Only**
    
    This endpoint:
    1. Extracts training data from career_paths table
    2. Trains a Random Forest classifier
    3. Saves model to disk
    4. Updates ml_models table
    
    Args:
        min_samples: Minimum number of training samples required (default: 30)
    
    Returns:
        Training results including accuracy and metrics
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            trainer = CareerModelTrainer()
            
            # Train model
            result = await trainer.train_from_database(conn, min_samples=min_samples)
            
            if result['success']:
                # Reload model in production
                reload_model()
                logger.info(f"Model training completed by admin {current_user['id']}")
            
            return {
                "success": True,
                "data": result
            }
    
    except Exception as e:
        logger.error(f"Error training career model: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to train career model: {str(e)}"
        )


@router.post("/calculate-transition-matrix")
async def calculate_career_transition_matrix(
    current_user: dict = Depends(require_role(["admin"]))
):
    """
    Calculate career transition probability matrix
    
    **Admin Only**
    
    Analyzes historical career_paths data to calculate:
    - Transition probabilities between roles
    - Average transition duration
    - Required skills for transitions
    - Success rates
    
    Updates the career_transition_matrix table
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            trainer = CareerModelTrainer()
            
            # Calculate transition matrix
            result = await trainer.calculate_transition_matrix(conn)
            
            logger.info(f"Transition matrix calculated by admin {current_user['id']}")
            
            return {
                "success": True,
                "data": result
            }
    
    except Exception as e:
        logger.error(f"Error calculating transition matrix: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate transition matrix: {str(e)}"
        )


@router.get("/model-info")
async def get_ml_model_info(
    current_user: dict = Depends(require_role(["admin"]))
):
    """
    Get information about currently loaded ML models
    
    **Admin Only**
    
    Returns:
        - Model status (loaded/not loaded)
        - Model type and framework
        - Number of features and classes
        - Feature names
    """
    try:
        loader = get_model_loader()
        info = loader.get_model_info()
        
        # Get model history from database
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        model_name, model_version, accuracy, 
                        trained_at, status
                    FROM ml_models
                    WHERE model_type = 'classification'
                    ORDER BY trained_at DESC
                    LIMIT 5
                """)
                
                models = await cursor.fetchall()
        
        model_history = [
            {
                "model_name": m[0],
                "version": m[1],
                "accuracy": float(m[2]) if m[2] else None,
                "trained_at": m[3],
                "status": m[4]
            }
            for m in models
        ]
        
        return {
            "success": True,
            "data": {
                "current_model": info,
                "model_history": model_history
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get model info: {str(e)}"
        )


@router.post("/reload-model")
async def reload_ml_model(
    current_user: dict = Depends(require_role(["admin"]))
):
    """
    Reload ML model from disk
    
    **Admin Only**
    
    Useful after training a new model to put it into production
    without restarting the server
    """
    try:
        success = reload_model()
        
        if success:
            loader = get_model_loader()
            info = loader.get_model_info()
            
            logger.info(f"Model reloaded by admin {current_user['id']}")
            
            return {
                "success": True,
                "message": "Model reloaded successfully",
                "data": info
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="No trained model found to load"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reloading model: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reload model: {str(e)}"
        )


@router.get("/training-data-stats")
async def get_training_data_statistics(
    current_user: dict = Depends(require_role(["admin"]))
):
    """
    Get statistics about available training data
    
    **Admin Only**
    
    Returns:
        - Total career paths in database
        - Unique roles (from and to)
        - Date range of data
        - Data quality metrics
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Total paths
                await cursor.execute("""
                    SELECT COUNT(*) FROM career_paths
                    WHERE from_role IS NOT NULL AND to_role IS NOT NULL
                """)
                total_paths = (await cursor.fetchone())[0]
                
                # Unique roles
                await cursor.execute("""
                    SELECT COUNT(DISTINCT from_role) FROM career_paths
                    WHERE from_role IS NOT NULL
                """)
                unique_from_roles = (await cursor.fetchone())[0]
                
                await cursor.execute("""
                    SELECT COUNT(DISTINCT to_role) FROM career_paths
                    WHERE to_role IS NOT NULL
                """)
                unique_to_roles = (await cursor.fetchone())[0]
                
                # Date range
                await cursor.execute("""
                    SELECT MIN(transition_date), MAX(transition_date)
                    FROM career_paths
                    WHERE transition_date IS NOT NULL
                """)
                date_range = await cursor.fetchone()
                
                # Recent paths (last 3 years)
                await cursor.execute("""
                    SELECT COUNT(*) FROM career_paths
                    WHERE transition_date >= DATE_SUB(NOW(), INTERVAL 3 YEAR)
                """)
                recent_paths = (await cursor.fetchone())[0]
        
        return {
            "success": True,
            "data": {
                "total_career_paths": total_paths,
                "unique_from_roles": unique_from_roles,
                "unique_to_roles": unique_to_roles,
                "date_range": {
                    "earliest": date_range[0],
                    "latest": date_range[1]
                },
                "recent_paths_3y": recent_paths,
                "sufficient_for_training": total_paths >= 30,
                "recommendation": (
                    "Ready for training" if total_paths >= 50
                    else "Need more data" if total_paths < 30
                    else "Limited data - model may have lower accuracy"
                )
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting training data stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get training data statistics: {str(e)}"
        )
