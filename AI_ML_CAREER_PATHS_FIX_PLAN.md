# 🚀 AI/ML Career Paths System - Implementation Plan

## Executive Summary

This document outlines the comprehensive fix plan for the AI/ML Career Paths system, addressing dependency issues, Gemini LLM integration, ML model training infrastructure, and database verification.

---

## Current System Architecture

### **3-Tier AI/ML System:**

#### **Tier 1: Rule-Based Predictions** ✅ WORKING
- **Location**: `/app/backend/services/career_prediction_service.py`
- **Method**: Uses `career_transition_matrix` table
- **Logic**: Historical data-based probability calculations
- **Status**: Fully functional, acts as fallback

#### **Tier 2: ML-Powered Predictions** ⚠️ PARTIALLY IMPLEMENTED
- **Location**: `/app/backend/ml/career_model_trainer.py`, `model_loader.py`
- **Model**: Random Forest Classifier
- **Issue**: No trained models exist in `/app/backend/ml/models/`
- **Requirement**: Minimum 50 career transitions in database

#### **Tier 3: LLM-Enhanced Advice** ⚠️ NEEDS GEMINI KEY
- **Location**: `/app/backend/ml/llm_advisor.py`
- **Current**: Configured for Emergent LLM Key
- **Required**: Switch to Gemini-1.5-Pro API
- **Fallback**: Rule-based advice if API unavailable

---

## Issues Identified

### **1. Missing Dependencies** ❌
- **Issue**: `transformers` library not installed
- **Impact**: Backend may crash when importing sentence embeddings
- **Solution**: Already in requirements.txt (line 52), needs verification

### **2. LLM Integration** ⚠️
- **Issue**: Configured for Emergent LLM, user wants Gemini API
- **Current Config**: 
  - `EMERGENT_LLM_KEY`
  - `EMERGENT_LLM_API_URL`
  - `EMERGENT_LLM_MODEL`
- **Required Config**:
  - `GEMINI_API_KEY`
  - Model: `gemini-1.5-pro`

### **3. ML Models Not Trained** ❌
- **Issue**: `/app/backend/ml/models/` directory empty
- **Requirement**: Need minimum 50 career transitions
- **Missing**: Training endpoint and standalone script

### **4. Admin Dataset Upload** ✅ EXISTS
- **Location**: Admin dashboard has upload functionality
- **Storage**: Data stored in storage folder
- **Status**: Already functional

---

## Phase-Wise Implementation Plan

---

## 📦 PHASE 1: Fix Dependencies & Environment Setup

### **Objectives:**
- Verify all required Python packages are in requirements.txt
- Add Gemini-specific dependencies
- Update environment configuration files
- Ensure no import errors

### **Tasks:**

#### 1.1 Update requirements.txt
- ✅ Verify `sentence-transformers>=2.3.1` (Line 52)
- ✅ Verify `google-generativeai>=0.3.2` (Line 61)
- ✅ Verify `scikit-learn>=1.4.0` (Line 48)
- Add any missing dependencies

#### 1.2 Update Backend .env
Add new environment variables:
```bash
# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-pro
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/

# Legacy (keep for fallback)
EMERGENT_LLM_KEY=
EMERGENT_LLM_API_URL=
EMERGENT_LLM_MODEL=
```

#### 1.3 Create Models Directory
```bash
mkdir -p /app/backend/ml/models
```

#### 1.4 Verification
- Check imports in all ML files
- Verify no circular dependencies
- Ensure all environment variables are documented

### **Deliverables:**
- ✅ Updated requirements.txt
- ✅ Updated .env with Gemini configuration
- ✅ Models directory created
- ✅ No import errors

---

## 🤖 PHASE 2: Modify LLM Integration for Gemini

### **Objectives:**
- Replace Emergent LLM integration with Gemini API
- Maintain backward compatibility with fallback
- Support environment-based configuration
- Test integration without API key (graceful degradation)

### **Tasks:**

#### 2.1 Update LLM Advisor (`/app/backend/ml/llm_advisor.py`)

**Changes Required:**
1. Replace OpenAI-style API calls with Gemini SDK
2. Update initialization to check for `GEMINI_API_KEY`
3. Modify `_call_llm_api()` method for Gemini format
4. Keep fallback advice logic intact

**New Implementation:**
```python
import os
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

class CareerLLMAdvisor:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-pro')
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
        else:
            self.model = None
            logger.warning("GEMINI_API_KEY not found. LLM advice will be disabled")
```

#### 2.2 Update API Call Method

**Current (Emergent LLM - OpenAI format):**
```python
async def _call_llm_api(self, prompt: str) -> str:
    # Uses OpenAI-compatible API
    payload = {
        'model': self.model,
        'messages': [...]
    }
```

**New (Gemini format):**
```python
def _call_gemini_api(self, prompt: str) -> str:
    """Call Gemini API synchronously"""
    try:
        response = self.model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.7,
                'max_output_tokens': 300,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            }
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        raise
```

#### 2.3 Update generate_career_advice Method

Make it work with both async service and sync Gemini calls:
```python
async def generate_career_advice(
    self,
    user_profile: Dict,
    predictions: List[Dict],
    similar_alumni: List[Dict]
) -> str:
    if not self.api_key or not self.model:
        return self._generate_fallback_advice(user_profile, predictions)
    
    try:
        prompt = self._build_prompt(user_profile, predictions, similar_alumni)
        # Run sync Gemini call in executor to avoid blocking
        import asyncio
        advice = await asyncio.to_thread(self._call_gemini_api, prompt)
        return advice
    except Exception as e:
        logger.error(f"Error generating LLM advice: {str(e)}")
        return self._generate_fallback_advice(user_profile, predictions)
```

### **Deliverables:**
- ✅ Modified `llm_advisor.py` with Gemini support
- ✅ Fallback logic maintained
- ✅ Environment-based configuration
- ✅ Error handling and logging

---

## 🔧 PHASE 3: Add ML Model Training Infrastructure

### **Objectives:**
- Add API endpoints for model training
- Create standalone training script
- Add model status monitoring
- Enable admin to trigger training

### **Tasks:**

#### 3.1 Add Training Endpoints

**File**: `/app/backend/routes/career_predictions_router.py`

Add these endpoints:
```python
@router.post("/train-model")
async def train_ml_model(
    min_samples: int = Query(50, description="Minimum training samples required"),
    current_user: dict = Depends(get_current_user)
):
    """
    Train career prediction ML model
    Requires admin privileges
    """
    # Implementation using CareerModelTrainer

@router.post("/calculate-matrix")
async def calculate_transition_matrix(
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate career transition probability matrix
    Updates career_transition_matrix table
    """
    # Implementation using CareerModelTrainer

@router.get("/model-status")
async def get_model_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Get ML model status and metadata
    """
    # Check if models exist, return training metrics
```

#### 3.2 Create Standalone Training Script

**File**: `/app/backend/ml/train_career_model.py`

```python
#!/usr/bin/env python3
"""
Standalone Career Path ML Model Training Script
Run this to train the career prediction model manually
"""

import asyncio
import sys
import logging
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.connection import get_db_pool
from ml.career_model_trainer import train_model_from_cli

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    """Main training function"""
    logger.info("=" * 60)
    logger.info("Career Path ML Model Training")
    logger.info("=" * 60)
    
    # Get database connection
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            # Run training
            result = await train_model_from_cli(conn)
            
            if result.get('success'):
                logger.info("✅ Training completed successfully!")
                logger.info(f"Model saved to: {result.get('model_path')}")
                logger.info(f"Accuracy: {result.get('metrics', {}).get('accuracy', 0):.3f}")
            else:
                logger.error(f"❌ Training failed: {result.get('message')}")
    
    finally:
        pool.close()
        await pool.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
```

Make it executable:
```bash
chmod +x /app/backend/ml/train_career_model.py
```

#### 3.3 Update server.py to Register Endpoints

Ensure training endpoints are registered in main server file.

### **Deliverables:**
- ✅ Training API endpoints added
- ✅ Standalone training script created
- ✅ Model status endpoint implemented
- ✅ Server routes registered

---

## 🗄️ PHASE 4: Database Verification & Data Check

### **Objectives:**
- Verify database schema exists
- Check available training data
- Count career transitions
- Validate data quality

### **Tasks:**

#### 4.1 Check Database Tables

**SQL Queries:**
```sql
-- Check career_paths table
SELECT COUNT(*) as total_transitions FROM career_paths WHERE from_role IS NOT NULL AND to_role IS NOT NULL;

-- Check career_transition_matrix
SELECT COUNT(*) as matrix_entries FROM career_transition_matrix;

-- Check ml_models table
SELECT * FROM ml_models ORDER BY trained_at DESC LIMIT 5;

-- Get unique roles
SELECT COUNT(DISTINCT from_role) as unique_roles FROM career_paths;
```

#### 4.2 Create Database Verification Script

**File**: `/app/backend/ml/check_training_data.py`

```python
#!/usr/bin/env python3
"""Check if database has sufficient training data for ML model"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from database.connection import get_db_pool

async def check_data():
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Check career_paths
                await cursor.execute("""
                    SELECT COUNT(*) FROM career_paths 
                    WHERE from_role IS NOT NULL AND to_role IS NOT NULL
                """)
                transitions = (await cursor.fetchone())[0]
                
                # Check unique roles
                await cursor.execute("""
                    SELECT COUNT(DISTINCT from_role) FROM career_paths
                """)
                unique_roles = (await cursor.fetchone())[0]
                
                # Check matrix
                await cursor.execute("SELECT COUNT(*) FROM career_transition_matrix")
                matrix_entries = (await cursor.fetchone())[0]
                
                print("=" * 60)
                print("DATABASE TRAINING DATA STATUS")
                print("=" * 60)
                print(f"Career Transitions: {transitions}")
                print(f"Unique Roles: {unique_roles}")
                print(f"Matrix Entries: {matrix_entries}")
                print()
                
                if transitions >= 50:
                    print("✅ Sufficient data for ML training (≥50 transitions)")
                else:
                    print(f"⚠️  Insufficient data. Need {50 - transitions} more transitions")
                    print("   Recommendation: Use rule-based predictions until more data is available")
                
                return transitions >= 50
    
    finally:
        pool.close()
        await pool.wait_closed()

if __name__ == "__main__":
    asyncio.run(check_data())
```

#### 4.3 Run Verification

Execute verification script to check data availability.

### **Deliverables:**
- ✅ Database verification script
- ✅ Training data count report
- ✅ Data quality assessment
- ✅ Recommendations based on data availability

---

## 📚 PHASE 5: Integration & Documentation

### **Objectives:**
- Integrate all components
- Create deployment guide
- Document training process
- Provide troubleshooting tips

### **Tasks:**

#### 5.1 Create Deployment Guide

**File**: `/app/GEMINI_DEPLOYMENT_GUIDE.md`

```markdown
# Gemini API Integration - Deployment Guide

## Prerequisites
- Gemini API Key from Google AI Studio
- Access to backend .env file

## Step 1: Obtain Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key

## Step 2: Configure Environment
Add to `/app/backend/.env`:
```bash
GEMINI_API_KEY=your-actual-api-key-here
GEMINI_MODEL=gemini-1.5-pro
```

## Step 3: Restart Backend
```bash
sudo supervisorctl restart backend
```

## Step 4: Verify Integration
Check logs:
```bash
tail -f /var/log/supervisor/backend.*.log
```

Look for: "Gemini API configured successfully"
```

#### 5.2 Create Training Guide

**File**: `/app/ML_MODEL_TRAINING_GUIDE.md`

```markdown
# ML Model Training Guide

## Prerequisites
- Minimum 50 career transitions in database
- Database configured and accessible

## Option 1: Standalone Script
```bash
cd /app/backend
python3 ml/train_career_model.py
```

## Option 2: API Endpoint (requires authentication)
```bash
curl -X POST http://localhost:8001/api/career-predictions/train-model \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Check Model Status
```bash
curl http://localhost:8001/api/career-predictions/model-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting
- "Insufficient training data": Need more career paths in database
- "Model training failed": Check backend logs for errors
- "No module named 'sklearn'": Run `pip install -r requirements.txt`
```

#### 5.3 Update Main Documentation

Update `/app/ML_MODEL_GUIDE.md` with:
- Gemini integration steps
- New training endpoints
- Updated architecture diagram

#### 5.4 Create Troubleshooting Guide

**File**: `/app/AI_TROUBLESHOOTING.md`

```markdown
# AI/ML System Troubleshooting

## Issue: "No career predictions available"
**Cause**: ML model not trained or insufficient data
**Solution**: 
1. Check training data: `python3 ml/check_training_data.py`
2. If sufficient data, train model: `python3 ml/train_career_model.py`
3. System will use rule-based predictions as fallback

## Issue: "LLM advice not generating"
**Cause**: Gemini API key not configured or invalid
**Solution**:
1. Verify GEMINI_API_KEY in .env
2. Test API key: `curl https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro -H "x-goog-api-key: YOUR_KEY"`
3. Check backend logs for errors
4. System will use fallback rule-based advice

## Issue: Backend crash on startup
**Cause**: Missing dependencies
**Solution**:
```bash
cd /app/backend
pip install -r requirements.txt
sudo supervisorctl restart backend
```
```

### **Deliverables:**
- ✅ Gemini deployment guide
- ✅ ML training guide
- ✅ Troubleshooting documentation
- ✅ Updated main documentation

---

## Success Metrics

### **After Deployment:**

✅ **Backend Health:**
- Backend starts without import errors
- All API endpoints respond
- No crashes in logs

✅ **LLM Integration:**
- Gemini API key configured
- LLM-enhanced advice generating
- Fallback advice works when API unavailable

✅ **ML Models:**
- Models trained (if sufficient data)
- Model loader successfully loads models
- Predictions use ML when available

✅ **Frontend:**
- Career Insights page loads
- Predictions display correctly
- All components functional

✅ **Database:**
- Training data verified
- Transition matrix populated
- Model metadata stored

---

## Timeline Estimate

| Phase | Duration | Can Run in Parallel |
|-------|----------|---------------------|
| Phase 1: Dependencies | 30 min | No |
| Phase 2: Gemini Integration | 1 hour | No |
| Phase 3: Training Infrastructure | 1.5 hours | Yes (after Phase 2) |
| Phase 4: Database Verification | 30 min | Yes (after Phase 1) |
| Phase 5: Documentation | 30 min | Yes (anytime) |
| **Total** | **3-4 hours** | - |

---

## Risk Mitigation

### **Risk 1: Insufficient Training Data**
- **Mitigation**: System falls back to rule-based predictions
- **Action**: Admin can upload more career path data via dashboard

### **Risk 2: Gemini API Rate Limits**
- **Mitigation**: Fallback to rule-based advice
- **Action**: Implement caching for repeated predictions

### **Risk 3: Model Training Fails**
- **Mitigation**: System continues using rule-based predictions
- **Action**: Check data quality and minimum requirements

### **Risk 4: API Key Not Configured**
- **Mitigation**: System degrades gracefully to rule-based advice
- **Action**: Clear error messages in logs

---

## Next Steps

1. ✅ Review this implementation plan
2. → Proceed with Phase 1 (Dependencies)
3. → Proceed with Phase 2 (Gemini Integration)
4. → Proceed with Phase 3 (Training Infrastructure)
5. → Proceed with Phase 4 (Database Verification)
6. → Proceed with Phase 5 (Documentation)
7. → Test complete system
8. → Deploy to production

---

## Contact & Support

For questions or issues:
- Check `/app/AI_TROUBLESHOOTING.md`
- Review backend logs: `/var/log/supervisor/backend.*.log`
- Verify database connection and data
