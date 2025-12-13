# 🚀 AI/ML Skill Graph - Implementation Plan

## 📋 Executive Summary

This document outlines the complete implementation plan to enable AI/ML components for the Skill Graph feature in SkillGraph.jsx. The AI/ML code is already written but intentionally deferred/disabled to avoid blocking app startup.

---

## ✅ Current Status

### What's Already Working:
- ✅ **Frontend**: SkillGraph.jsx fully implemented
- ✅ **Backend Services**: `skill_graph_service.py` with AI/ML code ready
- ✅ **API Routes**: All endpoints exist (`skill_graph.py`, `skill_recommendations.py`)
- ✅ **Database**: Tables exist (skill_graph, skill_embeddings, skill_similarities)
- ✅ **Dependencies**: ML libraries already in requirements.txt
- ✅ **Sample Data**: Basic skills data in sample_data_insert.sql
- ✅ **Co-occurrence Analysis**: Basic skill relationships work

### What's NOT Working (AI/ML):
- ❌ **Sentence-transformers embeddings**: Code exists but not initialized
- ❌ **FAISS similarity search**: Needs embeddings first
- ❌ **Semantic similarity**: Currently using co-occurrence only

---

## 🎯 What AI/ML Features Will Enable

### 1. **Semantic Skill Similarity** (instead of just co-occurrence)
- **Current**: Skills related by co-occurrence (appearing together in profiles)
- **With AI**: Skills related by meaning (Python ↔ Django, React ↔ Vue)
- **Technology**: Sentence-transformers with 'all-MiniLM-L6-v2' model (384-dim embeddings)

### 2. **Fast Similarity Search**
- **Current**: No precomputed similarities
- **With AI**: FAISS-based fast vector search for top-10 similar skills
- **Technology**: FAISS IndexFlatIP with cosine similarity

### 3. **Better Recommendations**
- **Current**: Simple rule-based recommendations
- **With AI**: Semantic understanding of skill relationships
- **Impact**: More accurate "Skills You Should Learn" suggestions

---

## 🔧 Implementation Steps

### Phase 1: Verify Installation ✅ (COMPLETE)

**Status**: All dependencies already installed

```bash
# Already in requirements.txt:
sentence-transformers>=2.3.1
faiss-cpu>=1.7.4
scikit-learn>=1.4.0
numpy>=1.26.0
```

### Phase 2: Initialize AI/ML Models

#### Issue Identified:
The `skill_graph_service.py` has lazy initialization but the model is never triggered because:
1. `EMBEDDINGS_AVAILABLE` flag defaults to True
2. But `self.embedding_model` is None
3. Model only loads when embeddings are first requested
4. But embeddings are never requested because the trigger endpoint isn't called

#### Solution:
We need to trigger the skill graph build which will:
1. Initialize the sentence-transformer model
2. Generate embeddings for all skills
3. Build FAISS index
4. Calculate and store similarities

### Phase 3: Populate Skill Graph Data

#### Option A: Use Admin API Endpoint (Recommended)
```bash
# Call the rebuild endpoint (admin authentication required)
POST /api/skill-graph/rebuild
```

This will:
1. Extract all skills from alumni_profiles
2. Extract all skills from jobs
3. Build co-occurrence relationships
4. Generate embeddings (384-dim vectors)
5. Calculate FAISS similarities
6. Store everything in database

#### Option B: Manual Python Script
Create a script to trigger the process programmatically.

### Phase 4: Verify Data Flow

#### Check Embeddings Table:
```sql
SELECT COUNT(*) FROM skill_embeddings;
-- Should show number of unique skills with embeddings
```

#### Check Similarities Table:
```sql
SELECT COUNT(*) FROM skill_similarities;
-- Should show top-10 similarities per skill
```

#### Check Skill Graph:
```sql
SELECT skill_name, popularity_score, alumni_count, job_count 
FROM skill_graph 
ORDER BY popularity_score DESC 
LIMIT 10;
```

### Phase 5: Test Frontend Integration

The frontend will automatically work once backend has data:

```javascript
// SkillGraph.jsx already calls:
skillRecommendationService.getRecommendations(userId)
// → /api/skill-recommendations/recommendations/{userId}

skillRecommendationService.getTopTrendingSkills(10)
// → /api/skill-recommendations/trending

skillGraphService.getSkillGraph()
// → /api/skill-graph
```

---

## 📊 Data Requirements

### Minimum Data Needed:
- ✅ **Alumni profiles with skills**: Already in sample_data_insert.sql
- ✅ **Jobs with required skills**: Already in sample_data_insert.sql
- ✅ **At least 20+ unique skills**: Already available

### Current Sample Data Skills:
```sql
-- From sample_data_insert.sql (lines 450-547):
- JavaScript, TypeScript, Python, React, Node.js
- AWS, Docker, Kubernetes, SQL, MongoDB
- UX Design, UI Design, Figma, Machine Learning
- Product Management, Leadership, Communication
- And 15+ more skills
```

**Status**: ✅ Sufficient data already exists

---

## 🔄 Step-by-Step Execution Plan

### Step 1: Check Current Skill Graph State
```sql
SELECT COUNT(*) as total_skills FROM skill_graph;
SELECT COUNT(*) as skills_with_embeddings FROM skill_embeddings;
SELECT COUNT(*) as precomputed_similarities FROM skill_similarities;
```

**Expected Initial State**:
- `total_skills`: ~20-30 (from sample data)
- `skills_with_embeddings`: 0 (not generated yet)
- `precomputed_similarities`: 0 (not calculated yet)

### Step 2: Trigger Skill Graph Build

**Option A: Via API** (Need admin authentication)
```bash
curl -X POST http://localhost:8001/api/skill-graph/rebuild \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

**Option B: Via Python Script** (Create this file)
```python
# /app/backend/scripts/build_skill_graph.py
import asyncio
from database.connection import get_db_pool
from services.skill_graph_service import SkillGraphService

async def main():
    service = SkillGraphService()
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        result = await service.build_skill_graph(conn)
        print(f"✅ Skill graph built successfully!")
        print(f"Total skills: {result['total_skills']}")
        print(f"Embeddings generated: {result['embeddings_generated']}")
        print(f"Similarities calculated: {result['similarities_calculated']}")
        print(f"AI enabled: {result['ai_enabled']}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Step 3: Monitor Build Process

The build process will:
1. **Extract skills** (1-2 seconds)
2. **Download model** (first time only, ~90MB, 30-60 seconds)
3. **Generate embeddings** (2-5 seconds for 30 skills)
4. **Build FAISS index** (1-2 seconds)
5. **Calculate similarities** (2-3 seconds)

**Total time**: ~45-70 seconds (first run), ~10 seconds (subsequent runs)

### Step 4: Verify Results

```sql
-- Check embeddings were generated
SELECT skill_name, 
       SUBSTRING(embedding_vector, 1, 50) as sample_vector
FROM skill_embeddings 
LIMIT 5;

-- Check similarities were calculated
SELECT skill_1, skill_2, similarity_score 
FROM skill_similarities 
WHERE similarity_score > 0.7
ORDER BY similarity_score DESC 
LIMIT 10;

-- Check skill graph was updated
SELECT skill_name, related_skills, popularity_score
FROM skill_graph
ORDER BY popularity_score DESC
LIMIT 10;
```

### Step 5: Test Frontend

1. Login to the application
2. Navigate to `/skills/graph`
3. Verify:
   - ✅ Skill nodes display
   - ✅ "Skills You Should Learn" panel shows recommendations
   - ✅ "Trending Skills" panel shows data
   - ✅ Skill details show related skills
   - ✅ No console errors

---

## 🐛 Troubleshooting

### Issue 1: Model Download Fails
**Symptom**: Error downloading sentence-transformers model

**Solution**:
```python
# The model will be downloaded to ~/.cache/huggingface/
# Ensure internet connectivity and disk space (90MB)
```

### Issue 2: FAISS Not Found
**Symptom**: `ImportError: No module named 'faiss'`

**Solution**:
```bash
# Already installed, but if needed:
pip install faiss-cpu==1.7.4
```

### Issue 3: Embeddings Not Generated
**Symptom**: `skill_embeddings` table is empty after build

**Check**:
```python
# In skill_graph_service.py line 41-49
# Make sure model loads successfully
```

**Debug**:
```bash
# Check backend logs
tail -f /var/log/supervisor/backend.err.log
```

### Issue 4: Frontend Shows No Data
**Symptom**: Empty recommendations panel

**Check**:
1. API endpoints return data
2. Database has data in `skill_graph` table
3. User has skills in their profile

**Test API**:
```bash
# Test recommendations endpoint
curl http://localhost:8001/api/skill-recommendations/recommendations/{userId} \
  -H "Authorization: Bearer <TOKEN>"

# Test trending endpoint
curl http://localhost:8001/api/skill-recommendations/trending?limit=10 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 📈 Success Metrics

### After Implementation:

#### Database Metrics:
- ✅ `skill_embeddings`: 20-30 entries (one per unique skill)
- ✅ `skill_similarities`: 200-300 entries (top-10 per skill)
- ✅ `skill_graph`: 20-30 entries with related_skills populated

#### API Metrics:
- ✅ `/api/skill-recommendations/recommendations/{userId}` returns 5-10 recommendations
- ✅ `/api/skill-recommendations/trending` returns 10 trending skills
- ✅ `/api/skill-graph` returns all skills with relationships

#### Frontend Metrics:
- ✅ "Skills You Should Learn" panel shows 3-5 personalized recommendations
- ✅ "Trending Skills" panel shows 5 skills with growth rates
- ✅ Skill nodes are clickable and show details
- ✅ Related skills display with similarity scores

---

## 🔮 Future Enhancements (Post-Implementation)

### 1. **LLM-Enhanced Recommendations**
Add GPT/Claude integration for natural language explanations:
```python
# Using Emergent LLM Key
"Why this skill? GPT says: [personalized explanation]"
```

### 2. **Skill Learning Paths**
Use ML to suggest learning sequences:
```
JavaScript → React → Next.js → Full-Stack Development
```

### 3. **Industry-Specific Clustering**
Group skills by industry using DBSCAN:
```
Tech Stack: Python, Django, PostgreSQL, AWS
Design Stack: Figma, Sketch, Adobe XD, Prototyping
```

### 4. **Temporal Analysis**
Track skill trends over time:
```sql
-- Add to skill_graph table
trend_direction ENUM('rising', 'stable', 'declining')
month_over_month_growth DECIMAL(5,2)
```

---

## 📝 Summary Checklist

### Pre-Implementation:
- [x] Dependencies installed (sentence-transformers, faiss-cpu)
- [x] Database tables exist
- [x] Sample data loaded
- [x] API endpoints created
- [x] Frontend code ready

### Implementation:
- [ ] Trigger skill graph build (via API or script)
- [ ] Wait for embeddings generation (~60 seconds first time)
- [ ] Verify embeddings in database
- [ ] Verify similarities in database
- [ ] Test API endpoints return data

### Post-Implementation:
- [ ] Frontend displays recommendations
- [ ] Frontend displays trending skills
- [ ] Skill details show AI-powered related skills
- [ ] No console errors
- [ ] Backend logs show success

---

## 🎯 Expected Outcome

### Before AI/ML Activation:
```javascript
// Related skills based on co-occurrence only
Related Skills: ["TypeScript", "Node.js", "React"]
// Limited to skills that appear together in profiles
```

### After AI/ML Activation:
```javascript
// Related skills based on semantic similarity
Related Skills: [
  { skill: "TypeScript", similarity: 0.89 },
  { skill: "Node.js", similarity: 0.85 },
  { skill: "React", similarity: 0.83 },
  { skill: "Vue", similarity: 0.78 },  // Semantically similar!
  { skill: "Angular", similarity: 0.76 } // Semantically similar!
]
```

**Key Difference**: AI understands that Vue and Angular are similar to React even if they rarely appear together in the same profiles.

---

## 📞 Support

If issues arise during implementation:

1. **Check Backend Logs**: `/var/log/supervisor/backend.err.log`
2. **Check SQL Data**: Run verification queries above
3. **Check API Responses**: Use curl or Postman to test endpoints
4. **Check Frontend Console**: Look for network errors or data issues

---

**Document Version**: 1.0  
**Created**: December 2024  
**Status**: Ready for Implementation  
**Estimated Time**: 10-15 minutes (after dependencies installed)
