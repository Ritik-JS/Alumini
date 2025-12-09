"""
ML Model Loader Utility
Loads trained models and encoders for inference
"""
import logging
import joblib
import json
import os
from pathlib import Path
from typing import Optional, Dict, List
import numpy as np

logger = logging.getLogger(__name__)

# Get the directory where this file is located
_current_dir = Path(__file__).parent.resolve()
_default_model_dir = _current_dir / "models"


class CareerModelLoader:
    """
    Loads and manages trained career prediction model
    """
    
    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            self.model_dir = _default_model_dir
        else:
            self.model_dir = Path(model_dir)
        self.model = None
        self.encoders = None
        self.feature_names = []
        
        logger.info(f"CareerModelLoader initialized with model_dir: {self.model_dir}")
    
    def load_latest_model(self) -> bool:
        """
        Load the latest trained model and encoders
        
        Returns:
            bool: True if model loaded successfully
        """
        try:
            if not self.model_dir.exists():
                logger.warning(f"Model directory not found: {self.model_dir}")
                return False
            
            # Find latest model file
            model_files = sorted(self.model_dir.glob("career_predictor_*.pkl"))
            if not model_files:
                logger.warning("No trained models found")
                return False
            
            latest_model = model_files[-1]
            
            # Find corresponding encoder file
            timestamp = latest_model.stem.split("_")[-2] + "_" + latest_model.stem.split("_")[-1]
            encoder_file = self.model_dir / f"encoders_{timestamp}.pkl"
            
            if not encoder_file.exists():
                logger.error(f"Encoder file not found: {encoder_file}")
                return False
            
            # Load model and encoders
            self.model = joblib.load(latest_model)
            self.encoders = joblib.load(encoder_file)
            self.feature_names = self.encoders.get('feature_names', [])
            
            logger.info(f"Loaded model: {latest_model}")
            logger.info(f"Loaded encoders: {encoder_file}")
            
            return True
        
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False
    
    def predict(self, user_profile: Dict) -> Optional[List[Dict]]:
        """
        Make prediction using loaded model
        
        Args:
            user_profile: Dict containing:
                - current_role: str
                - skills: List[str]
                - years_of_experience: int
                - industry: str
                - transition_duration: int (optional)
                - success_rating: int (optional)
        
        Returns:
            List of predicted roles with probabilities
        """
        if not self.model or not self.encoders:
            logger.warning("Model not loaded. Call load_latest_model() first")
            return None
        
        try:
            # Extract encoders
            role_encoder = self.encoders['role_encoder']
            skill_encoder = self.encoders['skill_encoder']
            industry_encoder = self.encoders['industry_encoder']
            
            # Prepare features
            current_role = user_profile.get('current_role', 'Unknown')
            skills = user_profile.get('skills', [])
            years_exp = user_profile.get('years_of_experience', 0)
            industry = user_profile.get('industry', 'Unknown')
            duration = user_profile.get('transition_duration', 24)
            success = user_profile.get('success_rating', 3)
            
            # Encode features
            try:
                role_encoded = role_encoder.transform([current_role])[0]
            except ValueError:
                logger.warning(f"Unknown role: {current_role}, using default")
                role_encoded = 0
            
            try:
                industry_encoded = industry_encoder.transform([industry])[0]
            except ValueError:
                logger.warning(f"Unknown industry: {industry}, using default")
                industry_encoded = 0
            
            # Encode skills
            skills_encoded = skill_encoder.transform([skills])[0]
            
            # Combine features
            feature_vector = [
                role_encoded,
                years_exp,
                duration,
                success,
                industry_encoded
            ] + skills_encoded.tolist()
            
            # Make prediction
            feature_array = np.array([feature_vector])
            
            # Get probabilities for all classes
            probabilities = self.model.predict_proba(feature_array)[0]
            classes = self.model.classes_
            
            # Get top predictions
            top_indices = probabilities.argsort()[-5:][::-1]
            
            predictions = []
            for idx in top_indices:
                if probabilities[idx] > 0.05:  # Only include if probability > 5%
                    predictions.append({
                        "role": classes[idx],
                        "probability": float(probabilities[idx]),
                        "confidence": "high" if probabilities[idx] > 0.5 else "medium" if probabilities[idx] > 0.2 else "low"
                    })
            
            return predictions
        
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            return None
    
    def is_loaded(self) -> bool:
        """
        Check if model is loaded
        """
        return self.model is not None and self.encoders is not None
    
    def get_model_info(self) -> Dict:
        """
        Get information about loaded model
        """
        if not self.is_loaded():
            return {"loaded": False}
        
        return {
            "loaded": True,
            "model_type": type(self.model).__name__,
            "n_features": len(self.feature_names),
            "n_classes": len(self.model.classes_),
            "feature_names": self.feature_names[:10],  # First 10 features
            "classes_count": len(self.model.classes_)
        }


# Global model loader instance (singleton pattern)
_model_loader = None


def get_model_loader() -> CareerModelLoader:
    """
    Get or create global model loader instance
    """
    global _model_loader
    
    if _model_loader is None:
        _model_loader = CareerModelLoader()
        _model_loader.load_latest_model()
    
    return _model_loader


def reload_model():
    """
    Force reload of the model (useful after training)
    """
    global _model_loader
    _model_loader = CareerModelLoader()
    return _model_loader.load_latest_model()
