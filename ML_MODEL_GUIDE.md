# 🤖 ML Career Path Predictor - Implementation Guide

## Overview
This guide explains how to replace the rule-based career path predictor with a machine learning model for more accurate predictions.

## Current Implementation
The system currently uses **rule-based logic** in `career_prediction_service.py`:
- Historical career transition matrix from database
- Skill matching algorithms (Jaccard similarity)
- Fallback heuristics for common career progressions
- Confidence scoring based on data availability

## ML Model Architecture

### Recommended Approach: Classification + Regression

#### 1. **Multi-Label Classification Model**
**Purpose**: Predict next possible roles with probabilities

**Input Features**:
```python
{
    'current_role_encoded': int,          # Label encoded role
    'years_experience': float,            # Normalized experience
    'skills_vector': List[float],         # TF-IDF or embedding vector
    'industry_encoded': int,              # Label encoded industry
    'education_level': int,               # Ordinal encoded
    'batch_year': int,                    # Normalized year
    'current_company_tier': int           # Company reputation score
}
```

**Model Options**:
- **Random Forest Classifier** (baseline, interpretable)
- **XGBoost** (better performance, handles imbalanced data)
- **Neural Network** (best for complex patterns, requires more data)

**Output**:
- Top N predicted roles with probabilities
- Example: [(\"Senior Engineer\", 0.65), (\"Tech Lead\", 0.25), (\"Manager\", 0.10)]

#### 2. **Regression Model for Timeline**
**Purpose**: Predict time to transition

**Input**: Same as classification + predicted_role
**Output**: Months to transition (continuous value)

### Data Requirements

#### Minimum Data for Training:
- **1000+ career transition records** (from `career_paths` table)
- **500+ unique alumni profiles** with skills and experience
- **50+ unique roles** with multiple transition examples

### ✅ Readiness checklist (must-haves before ML)

Data volume & quality
≥ 1,000 career transition records (clean), ≥ 500 distinct profiles, ≥ ~30–50 common roles.

Feature completeness

Structured skills, role titles (normalized), experience years, industry, timestamps.

Infra

Model storage + serving (models directory or model registry), Redis or cache, Celery/worker for offline jobs.

Monitoring & logging

Store predictions, input features, outcomes (when/if user changes role), latency metrics.

Privacy & compliance

Consent + PII handling policies for using alumni career data.

If you satisfy these, proceed.

#### Data Sources:
1. **Internal Database**:
   - `career_paths` table: Historical transitions
   - `alumni_profiles` table: Skills, experience, roles
   - `jobs` table: Required skills for roles

2. **External Data** (optional):
   - LinkedIn career transition data
   - Industry reports on career progressions
   - Public datasets (Kaggle, etc.)



## Implementation Steps

### Phase 1: Data Preparation (Week 1)

#### Step 1.1: Extract Training Data
```python
# File: /app/backend/ml/data_preparation.py

import pandas as pd
from database.connection import get_db_pool

async def extract_training_data():
    """Extract and prepare training data"""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        # Get career transitions
        query = """
            SELECT 
                cp.from_role, cp.to_role, cp.from_company, cp.to_company,
                cp.transition_duration_months, cp.skills_acquired,
                ap_from.skills as from_skills,
                ap_from.years_of_experience as from_experience,
                ap_from.industry as from_industry,
                ap_from.batch_year,
                ap_to.years_of_experience as to_experience
            FROM career_paths cp
            JOIN alumni_profiles ap_from ON cp.user_id = ap_from.user_id
            JOIN alumni_profiles ap_to ON cp.user_id = ap_to.user_id
            WHERE cp.from_role IS NOT NULL 
            AND cp.to_role IS NOT NULL
        """
        
        df = pd.read_sql(query, conn)
        return df

async def prepare_features(df):
    """Feature engineering"""
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    import json
    
    # Parse JSON skills
    df['skills_list'] = df['from_skills'].apply(
        lambda x: json.loads(x) if x else []
    )
    
    # Create skill vectors (TF-IDF)
    from sklearn.feature_extraction.text import TfidfVectorizer
    
    df['skills_text'] = df['skills_list'].apply(lambda x: ' '.join(x))
    vectorizer = TfidfVectorizer(max_features=100)
    skills_matrix = vectorizer.fit_transform(df['skills_text'])
    
    # Encode categorical variables
    le_role = LabelEncoder()
    df['from_role_encoded'] = le_role.fit_transform(df['from_role'])
    df['to_role_encoded'] = le_role.transform(df['to_role'])
    
    # Normalize numerical features
    scaler = StandardScaler()
    df['experience_normalized'] = scaler.fit_transform(
        df[['from_experience']]
    )
    
    return df, vectorizer, le_role, scaler
```

#### Step 1.2: Train-Test Split
```python
from sklearn.model_selection import train_test_split

def split_data(df):
    """Split data into train and test sets"""
    X = df[feature_columns]
    y_role = df['to_role_encoded']
    y_duration = df['transition_duration_months']
    
    X_train, X_test, y_role_train, y_role_test = train_test_split(
        X, y_role, test_size=0.2, random_state=42, stratify=y_role
    )
    
    return X_train, X_test, y_role_train, y_role_test
```

### Phase 2: Model Training (Week 2)

#### Step 2.1: Train Classification Model
```python
# File: /app/backend/ml/train_classifier.py

from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
import joblib

def train_role_classifier(X_train, y_train):
    """Train role prediction model"""
    
    # Option 1: Random Forest (baseline)
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=10,
        random_state=42,
        class_weight='balanced'
    )
    rf_model.fit(X_train, y_train)
    
    # Option 2: XGBoost (recommended)
    xgb_model = XGBClassifier(
        n_estimators=100,
        max_depth=10,
        learning_rate=0.1,
        random_state=42
    )
    xgb_model.fit(X_train, y_train)
    
    # Save model
    joblib.dump(xgb_model, '/app/backend/ml/models/role_classifier.pkl')
    
    return xgb_model

def evaluate_model(model, X_test, y_test):
    """Evaluate model performance"""
    from sklearn.metrics import classification_report, accuracy_score
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"Accuracy: {accuracy:.3f}")
    print(classification_report(y_test, y_pred))
    
    # Feature importance
    importances = model.feature_importances_
    return accuracy, importances
```

#### Step 2.2: Train Regression Model for Timeline
```python
# File: /app/backend/ml/train_regressor.py

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

def train_duration_regressor(X_train, y_duration_train):
    """Train transition duration prediction model"""
    
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    model.fit(X_train, y_duration_train)
    
    # Save model
    joblib.dump(model, '/app/backend/ml/models/duration_regressor.pkl')
    
    return model

def evaluate_regressor(model, X_test, y_test):
    """Evaluate regression model"""
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"MAE: {mae:.2f} months")
    print(f"R² Score: {r2:.3f}")
    
    return mae, r2
```

### Phase 3: Model Integration (Week 3)

#### Step 3.1: Create ML Service
```python
# File: /app/backend/services/ml_career_predictor.py

import joblib
import numpy as np
from typing import List, Dict

class MLCareerPredictor:
    """ML-based career path prediction"""
    
    def __init__(self, model_path='/app/backend/ml/models'):
        self.role_classifier = joblib.load(f'{model_path}/role_classifier.pkl')
        self.duration_regressor = joblib.load(f'{model_path}/duration_regressor.pkl')
        self.vectorizer = joblib.load(f'{model_path}/skill_vectorizer.pkl')
        self.label_encoder = joblib.load(f'{model_path}/role_encoder.pkl')
        self.scaler = joblib.load(f'{model_path}/feature_scaler.pkl')
    
    def prepare_features(self, profile: Dict) -> np.ndarray:
        """Convert user profile to feature vector"""
        
        # Extract features
        skills = profile.get('skills', [])
        skills_text = ' '.join(skills)
        skills_vector = self.vectorizer.transform([skills_text]).toarray()[0]
        
        # Other features
        role_encoded = self.label_encoder.transform([profile['current_role']])[0]
        experience_norm = self.scaler.transform([[profile['years_experience']]])[0][0]
        
        # Combine features
        features = np.concatenate([
            [role_encoded, experience_norm],
            skills_vector
        ])
        
        return features.reshape(1, -1)
    
    def predict_next_roles(self, profile: Dict, top_k: int = 5) -> List[Dict]:
        """Predict next career roles"""
        
        features = self.prepare_features(profile)
        
        # Get probabilities for all classes
        probabilities = self.role_classifier.predict_proba(features)[0]
        
        # Get top K predictions
        top_indices = np.argsort(probabilities)[-top_k:][::-1]
        
        predictions = []
        for idx in top_indices:
            role = self.label_encoder.inverse_transform([idx])[0]
            probability = probabilities[idx]
            
            # Predict duration
            duration = self.duration_regressor.predict(features)[0]
            
            predictions.append({
                'role': role,
                'probability': float(probability),
                'timeframe_months': int(duration),
                'confidence': 'high' if probability > 0.6 else 'medium' if probability > 0.3 else 'low'
            })
        
        return predictions
```

#### Step 3.2: Update Career Prediction Service
```python
# In /app/backend/services/career_prediction_service.py

from .ml_career_predictor import MLCareerPredictor

class CareerPredictionService:
    def __init__(self):
        try:
            self.ml_predictor = MLCareerPredictor()
            self.use_ml = True
        except Exception as e:
            logger.warning(f"ML model not available, using rule-based: {e}")
            self.ml_predictor = None
            self.use_ml = False
    
    async def predict_career_path(self, db_conn, user_id: str) -> Dict:
        """Predict career path - ML or rule-based"""
        
        # Get user profile
        profile = await self._get_user_profile(db_conn, user_id)
        
        if self.use_ml:
            # Use ML model
            predicted_roles = self.ml_predictor.predict_next_roles(profile)
        else:
            # Fallback to rule-based
            predicted_roles = await self._get_predicted_roles(
                db_conn, profile['current_role'], profile['skills'], profile['years_experience']
            )
        
        # Rest of the logic...
        return prediction_result
```

### Phase 4: Continuous Improvement (Ongoing)

#### Monitoring & Retraining
```python
# File: /app/backend/ml/model_monitoring.py

async def monitor_prediction_accuracy(db_conn):
    """Track how accurate predictions are"""
    
    # Compare predictions vs actual career moves
    query = """
        SELECT 
            cp.predicted_roles,
            cp.created_at,
            ap.current_role,
            ap.updated_at
        FROM career_predictions cp
        JOIN alumni_profiles ap ON cp.user_id = ap.user_id
        WHERE ap.updated_at > cp.created_at
    """
    
    # Calculate accuracy metrics
    # Schedule retraining if accuracy drops below threshold

async def retrain_model():
    """Retrain model with new data"""
    # Extract latest data
    # Retrain models
    # Evaluate performance
    # Deploy new model if better
    pass
```

## Model Deployment

### Directory Structure
```
/app/backend/ml/
├── models/
│   ├── role_classifier.pkl
│   ├── duration_regressor.pkl
│   ├── skill_vectorizer.pkl
│   ├── role_encoder.pkl
│   └── feature_scaler.pkl
├── data_preparation.py
├── train_classifier.py
├── train_regressor.py
├── model_monitoring.py
└── README.md
```

### Environment Setup
```bash
# Install ML dependencies
pip install scikit-learn==1.4.0
pip install xgboost==2.0.3
pip install joblib==1.3.2
pip install pandas==2.2.0
pip install numpy==1.26.0
```

## Performance Benchmarks

### Minimum Acceptable Performance:
- **Role Classification Accuracy**: > 60%
- **Top-3 Accuracy**: > 80%
- **Duration MAE**: < 6 months
- **Inference Time**: < 100ms

### Expected Performance (with good data):
- **Role Classification Accuracy**: 70-75%
- **Top-3 Accuracy**: 85-90%
- **Duration MAE**: 3-4 months
- **Inference Time**: 50-100ms

## Fallback Strategy

The system is designed with graceful degradation:
1. **Try ML model first**: If available and loaded
2. **Fallback to rule-based**: If ML fails or not available
3. **Use historical data**: Query career_transition_matrix
4. **Use heuristics**: Common career progressions

## Next Steps

1. ✅ **Current State**: Rule-based predictor working
2. 📝 **Next**: Collect 1000+ career transition records
3. 🤖 **Then**: Train initial ML model
4. 📊 **Then**: A/B test ML vs rule-based
5. 🚀 **Then**: Deploy ML model if better performance

## Resources

- [Scikit-learn Documentation](https://scikit-learn.org/)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)
- [Career Path Prediction Research Papers](https://arxiv.org/search/?query=career+path+prediction)
- [LinkedIn Career Insights](https://engineering.linkedin.com/)

## Contact

For questions about ML implementation:
- Check existing code in `/app/backend/services/career_prediction_service.py`
- See ML placeholder class `MLCareerPredictor`
- Review this guide thoroughly before implementation
