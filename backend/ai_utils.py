"""
AI/ML Utilities and Model Management
Core AI infrastructure for AlumUnity System
"""
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
from pathlib import Path
import joblib
import json

logger = logging.getLogger(__name__)


class AIConfig:
    """AI/ML configuration constants"""
    
    # Model Storage
    MODEL_DIR = Path('/app/backend/ml_models')
    
    # Sentence Transformer Model
    EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
    EMBEDDING_DIMENSION = 384
    
    # Similarity Thresholds
    SIMILARITY_THRESHOLD_HIGH = 0.8
    SIMILARITY_THRESHOLD_MEDIUM = 0.6
    SIMILARITY_THRESHOLD_LOW = 0.4
    
    # Career Prediction
    CAREER_PREDICTION_MODEL = 'career_predictor'
    CAREER_PREDICTION_VERSION = 'v1.0'
    
    # Clustering
    CLUSTERING_EPS = 0.5  # 50 km for DBSCAN
    CLUSTERING_MIN_SAMPLES = 5


class SimilarityCalculator:
    """Similarity calculation utilities"""
    
    @staticmethod
    def jaccard_similarity(set1: set, set2: set) -> float:
        """
        Calculate Jaccard similarity between two sets
        
        J(A, B) = |A ∩ B| / |A ∪ B|
        
        Args:
            set1: First set
            set2: Second set
        
        Returns:
            Similarity score between 0 and 1
        """
        if not set1 and not set2:
            return 0.0
        
        if not set1 or not set2:
            return 0.0
        
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        
        return intersection / union if union > 0 else 0.0
    
    @staticmethod
    def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two vectors
        
        cos(θ) = (A · B) / (||A|| * ||B||)
        
        Args:
            vec1: First vector
            vec2: Second vector
        
        Returns:
            Similarity score between -1 and 1
        """
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    @staticmethod
    def weighted_similarity(
        similarities: Dict[str, float],
        weights: Dict[str, float]
    ) -> float:
        """
        Calculate weighted average of multiple similarity scores
        
        Args:
            similarities: Dict of similarity scores
            weights: Dict of weights (must sum to 1.0)
        
        Returns:
            Weighted similarity score
        """
        total_weight = sum(weights.values())
        if total_weight == 0:
            return 0.0
        
        weighted_sum = sum(
            similarities.get(key, 0.0) * weight
            for key, weight in weights.items()
        )
        
        return weighted_sum / total_weight


class SkillMatcher:
    """Skill matching and comparison utilities"""
    
    @staticmethod
    def match_skills(
        user_skills: List[str],
        required_skills: List[str],
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Match user skills against required skills
        
        Args:
            user_skills: List of user's skills
            required_skills: List of required skills
            weights: Optional skill importance weights
        
        Returns:
            Dict with match_score, matching_skills, missing_skills
        """
        user_skills_set = {s.lower().strip() for s in user_skills}
        required_skills_set = {s.lower().strip() for s in required_skills}
        
        matching_skills = user_skills_set.intersection(required_skills_set)
        missing_skills = required_skills_set - user_skills_set
        
        # Calculate base match score (Jaccard similarity)
        match_score = SimilarityCalculator.jaccard_similarity(
            user_skills_set,
            required_skills_set
        )
        
        # Apply weights if provided
        if weights:
            weighted_score = 0.0
            total_weight = 0.0
            
            for skill in required_skills_set:
                weight = weights.get(skill, 1.0)
                total_weight += weight
                
                if skill in user_skills_set:
                    weighted_score += weight
            
            if total_weight > 0:
                match_score = weighted_score / total_weight
        
        return {
            'match_score': round(match_score, 4),
            'matching_skills': list(matching_skills),
            'missing_skills': list(missing_skills),
            'match_percentage': round(match_score * 100, 2)
        }
    
    @staticmethod
    def get_skill_level_match(
        user_level: str,
        required_level: str
    ) -> float:
        """
        Compare skill proficiency levels
        
        Levels: beginner < intermediate < advanced < expert
        
        Returns:
            Match score (1.0 if meets or exceeds, partial if close)
        """
        levels = ['beginner', 'intermediate', 'advanced', 'expert']
        
        try:
            user_idx = levels.index(user_level.lower())
            required_idx = levels.index(required_level.lower())
            
            if user_idx >= required_idx:
                return 1.0
            elif user_idx == required_idx - 1:
                return 0.7
            elif user_idx == required_idx - 2:
                return 0.4
            else:
                return 0.2
        except ValueError:
            return 0.5  # Default for unknown levels


class DataNormalizer:
    """Data normalization utilities for ML"""
    
    @staticmethod
    def min_max_normalize(value: float, min_val: float, max_val: float) -> float:
        """
        Min-Max normalization to scale values to [0, 1]
        
        normalized = (value - min) / (max - min)
        """
        if max_val == min_val:
            return 0.0
        
        return (value - min_val) / (max_val - min_val)
    
    @staticmethod
    def z_score_normalize(value: float, mean: float, std: float) -> float:
        """
        Z-score normalization (standardization)
        
        z = (value - mean) / std
        """
        if std == 0:
            return 0.0
        
        return (value - mean) / std
    
    @staticmethod
    def normalize_vector(vector: np.ndarray) -> np.ndarray:
        """
        L2 normalization of a vector
        
        normalized = vector / ||vector||
        """
        norm = np.linalg.norm(vector)
        
        if norm == 0:
            return vector
        
        return vector / norm


class ModelManager:
    """ML model loading and saving utilities"""
    
    @staticmethod
    def save_model(model: Any, model_name: str, version: str = 'v1.0') -> str:
        """
        Save ML model to disk
        
        Args:
            model: Model object
            model_name: Name of the model
            version: Model version
        
        Returns:
            Path to saved model
        """
        try:
            AIConfig.MODEL_DIR.mkdir(parents=True, exist_ok=True)
            
            model_filename = f"{model_name}_{version}.pkl"
            model_path = AIConfig.MODEL_DIR / model_filename
            
            joblib.dump(model, model_path)
            logger.info(f"✅ Model saved: {model_path}")
            
            return str(model_path)
        except Exception as e:
            logger.error(f"❌ Model save error: {str(e)}")
            raise
    
    @staticmethod
    def load_model(model_name: str, version: str = 'v1.0') -> Any:
        """
        Load ML model from disk
        
        Args:
            model_name: Name of the model
            version: Model version
        
        Returns:
            Loaded model object
        """
        try:
            model_filename = f"{model_name}_{version}.pkl"
            model_path = AIConfig.MODEL_DIR / model_filename
            
            if not model_path.exists():
                raise FileNotFoundError(f"Model not found: {model_path}")
            
            model = joblib.load(model_path)
            logger.info(f"✅ Model loaded: {model_path}")
            
            return model
        except Exception as e:
            logger.error(f"❌ Model load error: {str(e)}")
            raise
    
    @staticmethod
    def save_metadata(
        model_name: str,
        version: str,
        metadata: Dict[str, Any]
    ) -> str:
        """
        Save model metadata (hyperparameters, metrics, etc.)
        
        Args:
            model_name: Name of the model
            version: Model version
            metadata: Metadata dictionary
        
        Returns:
            Path to metadata file
        """
        try:
            AIConfig.MODEL_DIR.mkdir(parents=True, exist_ok=True)
            
            metadata_filename = f"{model_name}_{version}_metadata.json"
            metadata_path = AIConfig.MODEL_DIR / metadata_filename
            
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"✅ Metadata saved: {metadata_path}")
            return str(metadata_path)
        except Exception as e:
            logger.error(f"❌ Metadata save error: {str(e)}")
            raise
    
    @staticmethod
    def load_metadata(model_name: str, version: str = 'v1.0') -> Dict[str, Any]:
        """Load model metadata"""
        try:
            metadata_filename = f"{model_name}_{version}_metadata.json"
            metadata_path = AIConfig.MODEL_DIR / metadata_filename
            
            if not metadata_path.exists():
                raise FileNotFoundError(f"Metadata not found: {metadata_path}")
            
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            return metadata
        except Exception as e:
            logger.error(f"❌ Metadata load error: {str(e)}")
            raise


class FeatureExtractor:
    """Feature extraction utilities for ML models"""
    
    @staticmethod
    def extract_text_features(text: str) -> Dict[str, Any]:
        """
        Extract basic features from text
        
        Returns:
            Dict with text features (length, word_count, etc.)
        """
        words = text.split()
        
        return {
            'length': len(text),
            'word_count': len(words),
            'avg_word_length': np.mean([len(w) for w in words]) if words else 0,
            'sentence_count': text.count('.') + text.count('!') + text.count('?'),
        }
    
    @staticmethod
    def extract_profile_features(profile: Dict[str, Any]) -> np.ndarray:
        """
        Extract numerical features from user profile for ML
        
        Returns:
            Feature vector as numpy array
        """
        features = []
        
        # Experience
        features.append(profile.get('years_of_experience', 0))
        
        # Skills count
        skills = profile.get('skills', [])
        features.append(len(skills) if skills else 0)
        
        # Profile completion
        features.append(profile.get('profile_completion_percentage', 0))
        
        # Verification status
        features.append(1 if profile.get('is_verified', False) else 0)
        
        # Education level (encoded)
        education_encoding = {
            'high_school': 1,
            'bachelors': 2,
            'masters': 3,
            'phd': 4
        }
        education = profile.get('education_level', 'bachelors')
        features.append(education_encoding.get(education, 2))
        
        return np.array(features, dtype=float)


# Initialize model directory
AIConfig.MODEL_DIR.mkdir(parents=True, exist_ok=True)
logger.info(f"✅ AI utilities initialized. Model directory: {AIConfig.MODEL_DIR}")
