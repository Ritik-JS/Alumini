"""
Career Path Prediction ML Model Trainer
Trains Random Forest classifier for career path prediction using historical data
"""
import logging
import json
import joblib
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from pathlib import Path
from collections import Counter

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, classification_report

logger = logging.getLogger(__name__)

# Get the directory where this file is located
_current_dir = Path(__file__).parent.resolve()
_default_model_dir = _current_dir / "models"


class CareerModelTrainer:
    """
    Trains ML models for career path prediction
    """
    
    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            self.model_dir = _default_model_dir
        else:
            self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        self.role_encoder = LabelEncoder()
        self.skill_encoder = MultiLabelBinarizer()
        self.industry_encoder = LabelEncoder()
        
        self.model = None
        self.feature_names = []
        
        logger.info(f"CareerModelTrainer initialized with model_dir: {model_dir}")
    
    async def train_from_database(self, db_conn, min_samples: int = 50):
        """
        Train career prediction model from database
        
        Args:
            db_conn: Database connection
            min_samples: Minimum training samples required
        
        Returns:
            Dict with training metrics
        """
        try:
            logger.info("Starting model training from database...")
            
            # Step 1: Extract training data from career_paths
            training_data = await self._extract_training_data(db_conn)
            
            if len(training_data) < min_samples:
                logger.warning(f"Insufficient training data: {len(training_data)} samples (min: {min_samples})")
                return {
                    "success": False,
                    "message": f"Need at least {min_samples} career transitions for training",
                    "current_samples": len(training_data)
                }
            
            logger.info(f"Extracted {len(training_data)} training samples")
            
            # Step 2: Prepare features and labels
            X, y = await self._prepare_features(training_data)
            
            if len(X) == 0:
                return {
                    "success": False,
                    "message": "No valid features could be extracted"
                }
            
            # Step 3: Split data
            # Check if stratification is possible (all classes need at least 2 samples)
            y_counts = Counter(y)
            min_class_count = min(y_counts.values()) if y_counts else 0
            use_stratify = len(set(y)) > 1 and min_class_count >= 2
            
            if not use_stratify:
                logger.warning(f"Stratification disabled: some classes have only {min_class_count} sample(s)")
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y if use_stratify else None
            )
            
            logger.info(f"Training set: {len(X_train)}, Test set: {len(X_test)}")
            
            # Step 4: Train model with hyperparameter tuning
            self.model = await self._train_model(X_train, y_train)
            
            # Step 5: Evaluate model
            metrics = await self._evaluate_model(X_test, y_test)
            
            # Step 6: Save model and encoders
            model_path = await self._save_model()
            
            # Step 7: Store model metadata in database
            await self._save_model_metadata(db_conn, metrics, model_path)
            
            logger.info(f"Model training completed. Accuracy: {metrics['accuracy']:.3f}")
            
            return {
                "success": True,
                "model_path": str(model_path),
                "training_samples": len(X_train),
                "test_samples": len(X_test),
                "metrics": metrics,
                "trained_at": datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise
    
    async def _extract_training_data(self, db_conn) -> List[Dict]:
        """
        Extract career transition data from database
        """
        async with db_conn.cursor() as cursor:
            # Get career paths with associated alumni profiles
            await cursor.execute("""
                SELECT 
                    cp.from_role,
                    cp.to_role,
                    cp.skills_acquired,
                    cp.transition_duration_months,
                    cp.success_rating,
                    ap.skills as current_skills,
                    ap.years_of_experience,
                    ap.industry,
                    ap.batch_year
                FROM career_paths cp
                JOIN alumni_profiles ap ON cp.user_id = ap.user_id
                WHERE cp.from_role IS NOT NULL
                    AND cp.to_role IS NOT NULL
                    AND cp.transition_date >= DATE_SUB(NOW(), INTERVAL 5 YEAR)
            """)
            
            rows = await cursor.fetchall()
        
        training_data = []
        for row in rows:
            # Parse skills
            current_skills = []
            if row[5]:
                try:
                    current_skills = json.loads(row[5]) if isinstance(row[5], str) else row[5]
                    if not isinstance(current_skills, list):
                        current_skills = []
                except (json.JSONDecodeError, TypeError):
                    current_skills = []
            
            skills_acquired = []
            if row[2]:
                try:
                    skills_acquired = json.loads(row[2]) if isinstance(row[2], str) else row[2]
                    if not isinstance(skills_acquired, list):
                        skills_acquired = []
                except (json.JSONDecodeError, TypeError):
                    skills_acquired = []
            
            training_data.append({
                "from_role": row[0],
                "to_role": row[1],
                "current_skills": current_skills,
                "skills_acquired": skills_acquired,
                "duration_months": row[3] or 24,
                "success_rating": row[4] or 3,
                "years_experience": row[6] or 0,
                "industry": row[7] or "Unknown",
                "batch_year": row[8]
            })
        
        return training_data
    
    async def _prepare_features(self, training_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare feature matrix and target labels
        """
        # Extract all unique roles, skills, and industries
        all_roles = list(set([d['from_role'] for d in training_data]))
        all_skills = []
        all_industries = list(set([d['industry'] for d in training_data]))
        
        for d in training_data:
            all_skills.extend(d['current_skills'])
        all_skills = list(set(all_skills))
        
        logger.info(f"Found {len(all_roles)} unique roles, {len(all_skills)} unique skills")
        
        # Fit encoders
        self.role_encoder.fit(all_roles)
        self.skill_encoder.fit([d['current_skills'] for d in training_data])
        self.industry_encoder.fit(all_industries)
        
        # Prepare features
        features = []
        labels = []
        
        for data in training_data:
            try:
                # Encode from_role
                role_encoded = self.role_encoder.transform([data['from_role']])[0]
                
                # Encode skills (multi-hot)
                skills_encoded = self.skill_encoder.transform([data['current_skills']])[0]
                
                # Encode industry
                industry_encoded = self.industry_encoder.transform([data['industry']])[0]
                
                # Numerical features
                years_exp = data['years_experience']
                duration = data['duration_months']
                success = data['success_rating']
                
                # Combine all features
                feature_vector = [
                    role_encoded,
                    years_exp,
                    duration,
                    success,
                    industry_encoded
                ] + skills_encoded.tolist()
                
                features.append(feature_vector)
                labels.append(data['to_role'])
            
            except Exception as e:
                logger.warning(f"Skipping sample due to error: {str(e)}")
                continue
        
        # Store feature names for later reference
        self.feature_names = [
            'from_role_encoded',
            'years_experience',
            'transition_duration',
            'success_rating',
            'industry_encoded'
        ] + list(self.skill_encoder.classes_)
        
        return np.array(features), np.array(labels)
    
    async def _train_model(self, X_train: np.ndarray, y_train: np.ndarray) -> RandomForestClassifier:
        """
        Train Random Forest classifier with hyperparameter tuning
        """
        logger.info("Training Random Forest model...")
        
        # Check if dataset is large enough for cross-validation
        # CV requires at least 2*n_splits samples per class
        y_train_counts = Counter(y_train)
        min_class_count = min(y_train_counts.values()) if y_train_counts else 0
        
        # Determine CV folds based on data distribution
        max_cv_folds = min(3, len(X_train) // 10, min_class_count)
        
        # If dataset is too small or imbalanced, skip grid search
        if max_cv_folds < 2 or len(X_train) < 20:
            logger.warning(f"Dataset too small for grid search (train size: {len(X_train)}, min class: {min_class_count})")
            logger.info("Training with default parameters...")
            rf = RandomForestClassifier(
                n_estimators=100,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
            rf.fit(X_train, y_train)
            return rf
        
        # Define parameter grid for GridSearchCV (simplified for small datasets)
        if len(X_train) < 50:
            # Smaller grid for small datasets
            param_grid = {
                'n_estimators': [50, 100],
                'max_depth': [10, 20],
                'min_samples_split': [2, 5],
                'min_samples_leaf': [1, 2]
            }
        else:
            # Full grid for larger datasets
            param_grid = {
                'n_estimators': [50, 100, 200],
                'max_depth': [10, 20, 30, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
        
        # Base model
        rf = RandomForestClassifier(random_state=42, n_jobs=-1)
        
        # Grid search with cross-validation
        logger.info(f"Running grid search with {max_cv_folds}-fold CV...")
        grid_search = GridSearchCV(
            rf,
            param_grid,
            cv=max_cv_folds,
            scoring='accuracy',
            n_jobs=-1,
            verbose=1
        )
        
        grid_search.fit(X_train, y_train)
        
        logger.info(f"Best parameters: {grid_search.best_params_}")
        logger.info(f"Best CV score: {grid_search.best_score_:.3f}")
        
        return grid_search.best_estimator_
    
    async def _evaluate_model(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict:
        """
        Evaluate model performance
        """
        y_pred = self.model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        
        # Get feature importances
        feature_importance = dict(zip(
            self.feature_names,
            self.model.feature_importances_.tolist()
        ))
        
        # Sort by importance
        top_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        return {
            "accuracy": float(accuracy),
            "precision": float(report['weighted avg']['precision']),
            "recall": float(report['weighted avg']['recall']),
            "f1_score": float(report['weighted avg']['f1-score']),
            "top_features": [{"feature": f, "importance": i} for f, i in top_features]
        }
    
    async def _save_model(self) -> Path:
        """
        Save trained model and encoders to disk
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_path = self.model_dir / f"career_predictor_{timestamp}.pkl"
        encoders_path = self.model_dir / f"encoders_{timestamp}.pkl"
        
        # Save model
        joblib.dump(self.model, model_path)
        
        # Save encoders
        encoders = {
            'role_encoder': self.role_encoder,
            'skill_encoder': self.skill_encoder,
            'industry_encoder': self.industry_encoder,
            'feature_names': self.feature_names
        }
        joblib.dump(encoders, encoders_path)
        
        logger.info(f"Model saved to: {model_path}")
        logger.info(f"Encoders saved to: {encoders_path}")
        
        return model_path
    
    async def _save_model_metadata(self, db_conn, metrics: Dict, model_path: Path):
        """
        Store model metadata in database
        """
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                INSERT INTO ml_models 
                (model_name, model_version, model_type, framework, 
                 model_file_path, hyperparameters, training_metrics, 
                 accuracy, status, trained_at, deployed_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                'career_predictor',
                datetime.now().strftime("%Y%m%d_%H%M%S"),
                'classification',
                'scikit-learn',
                str(model_path),
                json.dumps(self.model.get_params()),
                json.dumps(metrics),
                metrics['accuracy'],
                'active',
                datetime.now(),
                datetime.now()
            ))
            
            await db_conn.commit()
    
    async def calculate_transition_matrix(self, db_conn):
        """
        Calculate career transition probability matrix from historical data
        """
        try:
            logger.info("Calculating career transition matrix...")
            
            # Get all career paths
            async with db_conn.cursor() as cursor:
                # Calculate transitions
                await cursor.execute("""
                    SELECT 
                        from_role,
                        to_role,
                        COUNT(*) as transition_count,
                        AVG(transition_duration_months) as avg_duration,
                        AVG(success_rating) as avg_success,
                        JSON_ARRAYAGG(skills_acquired) as required_skills
                    FROM career_paths
                    WHERE from_role IS NOT NULL 
                        AND to_role IS NOT NULL
                        AND transition_date >= DATE_SUB(NOW(), INTERVAL 3 YEAR)
                    GROUP BY from_role, to_role
                    HAVING COUNT(*) >= 1
                """)
                
                transitions = await cursor.fetchall()
            
            if not transitions:
                logger.warning("No transitions found for matrix calculation")
                return {"success": False, "message": "No transition data available"}
            
            # Calculate probabilities
            role_totals = {}
            for trans in transitions:
                from_role = trans[0]
                role_totals[from_role] = role_totals.get(from_role, 0) + trans[2]
            
            # Insert into transition matrix
            inserted = 0
            async with db_conn.cursor() as cursor:
                for trans in transitions:
                    from_role = trans[0]
                    to_role = trans[1]
                    count = trans[2]
                    avg_duration = int(trans[3]) if trans[3] else 24
                    avg_success = float(trans[4]) if trans[4] else 0.7
                    
                    # Calculate probability
                    probability = count / role_totals[from_role]
                    
                    # Extract and flatten skills
                    required_skills = []
                    if trans[5]:
                        try:
                            skills_data = json.loads(trans[5]) if isinstance(trans[5], str) else trans[5]
                            # Flatten nested arrays
                            for skill_set in skills_data:
                                if isinstance(skill_set, list):
                                    required_skills.extend(skill_set)
                            required_skills = list(set(required_skills))[:10]  # Limit to top 10
                        except (json.JSONDecodeError, TypeError):
                            required_skills = []
                    
                    # Insert or update
                    await cursor.execute("""
                        INSERT INTO career_transition_matrix 
                        (from_role, to_role, transition_count, transition_probability, 
                         avg_duration_months, required_skills, success_rate, last_calculated)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                        ON DUPLICATE KEY UPDATE
                            transition_count = %s,
                            transition_probability = %s,
                            avg_duration_months = %s,
                            required_skills = %s,
                            success_rate = %s,
                            last_calculated = NOW()
                    """, (
                        from_role, to_role, count, probability,
                        avg_duration, json.dumps(required_skills), avg_success,
                        count, probability, avg_duration, json.dumps(required_skills), avg_success
                    ))
                    
                    inserted += 1
                
                await db_conn.commit()
            
            logger.info(f"Transition matrix updated: {inserted} transitions")
            
            return {
                "success": True,
                "transitions_calculated": inserted,
                "unique_from_roles": len(role_totals),
                "calculated_at": datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error calculating transition matrix: {str(e)}")
            raise


# Utility function for CLI or admin usage
async def train_model_from_cli(db_conn):
    """
    Train model from command line or admin interface
    """
    trainer = CareerModelTrainer()
    
    # First calculate transition matrix
    print("Step 1: Calculating transition matrix...")
    matrix_result = await trainer.calculate_transition_matrix(db_conn)
    print(f"Transition matrix: {matrix_result}")
    
    # Then train ML model
    print("\nStep 2: Training ML model...")
    training_result = await trainer.train_from_database(db_conn, min_samples=30)
    print(f"Training result: {training_result}")
    
    return training_result
