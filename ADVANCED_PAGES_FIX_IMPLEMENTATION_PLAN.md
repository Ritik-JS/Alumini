# Advanced Pages Data Display Fix - Implementation Plan

## Problem Analysis

After analyzing the frontend advanced pages and backend APIs, I've identified critical data flow issues preventing correct data display in the advanced folder pages.

---

## Root Causes

### 1. **SkillGraph.jsx** - Skill Network Visualization
**Issue**: API response structure mismatch
- **Frontend expects**: Array of skill objects with fields:
  ```javascript
  {
    id: string,
    skill_name: string,
    alumni_count: number,
    job_count: number,
    popularity_score: number,
    related_skills: string[],
    industry_connections: string[]
  }
  ```
- **Backend returns** (`/api/skill-graph/network`): 
  ```javascript
  {
    nodes: [{id, label, ...}],
    edges: [{source, target, ...}],
    clusters: []
  }
  ```
- **Impact**: Frontend tries to map network graph structure as skill array, resulting in empty/incorrect display

### 2. **TalentHeatmap.jsx** - Geographic Distribution
**Issue**: Field name mismatches between database and frontend
- **Frontend expects**:
  ```javascript
  {
    id: string,
    location_name: string,
    city: string,
    country: string,
    alumni_count: number,
    jobs_count: number,
    top_skills: string[],
    top_companies: string[],
    top_industries: string[]
  }
  ```
- **Database geographic_data table has**: `location_name, city, country, alumni_count, jobs_count`
- **But backend service may return different field names**
- **Impact**: Data doesn't populate in location cards, skills/companies arrays may be undefined

### 3. **Leaderboard.jsx** - Engagement Scores
**Issue**: Score breakdown structure mismatch
- **Frontend expects**:
  ```javascript
  {
    leaderboard: [{
      rank: number,
      user_id: string,
      name: string,
      total_score: number,
      badges: string[],
      trend: 'up'|'down'|'stable'
    }]
  }
  ```
- **Database**: Stored in `engagement_scores` table with JSON `contributions` field
- **Impact**: Leaderboard displays empty or incorrectly formatted data

### 4. **CareerPaths.jsx** - Career Transitions
**Issue**: Data structure and field naming
- **Frontend expects**:
  ```javascript
  {
    career_paths: [{
      id: string,
      starting_role: string,
      target_role: string,
      transition_percentage: number,
      avg_years: number,
      alumni_count: number,
      common_skills: string[],
      success_stories: []
    }]
  }
  ```
- **Backend**: Returns from career_transition_matrix table
- **Impact**: Path details not displaying, missing success stories

### 5. **SQL Sample Data Issues**
- Sample data in `sample_data_insert.sql` may have:
  - Missing geographic_data entries with proper coordinates
  - Missing skill_graph entries
  - Missing career_transition_matrix entries
  - JSON fields not properly formatted

---

## Proposed Solutions

### Phase 1: SQL Data Fixes (Priority: HIGH)
**File**: `/app/sample_data_insert.sql`

#### 1.1 Verify Geographic Data
- Ensure all locations in `geographic_data` table have:
  - Valid `top_skills`, `top_companies`, `top_industries` JSON arrays
  - Proper latitude/longitude coordinates
  - Non-zero alumni_count and jobs_count

#### 1.2 Add Skill Graph Data
- Insert records into `skill_graph` table from existing alumni_profiles skills
- Ensure related_skills and industry_connections are proper JSON arrays

#### 1.3 Add Career Transition Data
- Populate `career_transition_matrix` with realistic transitions
- Include required_skills as JSON array

**Changes needed in SQL**:
```sql
-- Example: Ensure geographic_data has correct structure
UPDATE geographic_data 
SET 
  top_skills = JSON_ARRAY('JavaScript', 'Python', 'React'),
  top_companies = JSON_ARRAY('Google', 'Microsoft', 'Amazon'),
  top_industries = JSON_ARRAY('Technology', 'Software Engineering')
WHERE top_skills IS NULL OR top_skills = '[]';

-- Example: Populate skill_graph if missing
INSERT INTO skill_graph (id, skill_name, related_skills, industry_connections, alumni_count, job_count, popularity_score)
SELECT 
  UUID(),
  'JavaScript',
  JSON_ARRAY('TypeScript', 'React', 'Node.js'),
  JSON_ARRAY('Web Development', 'Frontend'),
  50,
  30,
  95.5
WHERE NOT EXISTS (SELECT 1 FROM skill_graph WHERE skill_name = 'JavaScript');
```

---

### Phase 2: Backend Service Layer Fixes (Priority: HIGH)

#### 2.1 SkillGraphService - Add Direct Skill List Endpoint
**File**: `/app/backend/services/skill_graph_service.py`

Add method to return skills in frontend-expected format:
```python
async def get_skills_list(self, conn, filters=None):
    """Get skills as flat array for frontend display"""
    query = """
        SELECT 
            id,
            skill_name,
            related_skills,
            industry_connections,
            alumni_count,
            job_count,
            popularity_score
        FROM skill_graph
        WHERE popularity_score >= %s
        ORDER BY popularity_score DESC
        LIMIT %s
    """
    
    cursor = await conn.cursor()
    await cursor.execute(query, (filters.get('min_popularity', 0), 100))
    results = await cursor.fetchall()
    
    return [
        {
            'id': row[0],
            'skill_name': row[1],
            'related_skills': json.loads(row[2]) if row[2] else [],
            'industry_connections': json.loads(row[3]) if row[3] else [],
            'alumni_count': row[4],
            'job_count': row[5],
            'popularity_score': float(row[6])
        }
        for row in results
    ]
```

#### 2.2 HeatmapService - Ensure Proper Field Mapping
**File**: `/app/backend/services/heatmap_service.py`

Ensure all methods return fields matching frontend expectations:
```python
async def get_talent_distribution(self, conn, min_alumni_count=1):
    cursor = await conn.cursor()
    await cursor.execute("""
        SELECT 
            id, location_name, country, city,
            latitude, longitude,
            alumni_count, jobs_count,
            top_skills, top_companies, top_industries
        FROM geographic_data
        WHERE alumni_count >= %s
        ORDER BY alumni_count DESC
    """, (min_alumni_count,))
    
    results = await cursor.fetchall()
    
    return [
        {
            'id': row[0],
            'location_name': row[1],  # NOT 'location'
            'country': row[2],
            'city': row[3],
            'latitude': float(row[4]) if row[4] else None,
            'longitude': float(row[5]) if row[5] else None,
            'alumni_count': row[6],
            'jobs_count': row[7],  # NOT 'jobs_available'
            'top_skills': json.loads(row[8]) if row[8] else [],
            'top_companies': json.loads(row[9]) if row[9] else [],
            'top_industries': json.loads(row[10]) if row[10] else []
        }
        for row in results
    ]
```

---

### Phase 3: Backend API Route Updates (Priority: MEDIUM)

#### 3.1 Add New Skill List Endpoint
**File**: `/app/backend/routes/skill_graph.py`

```python
@router.get("")
async def get_skills(
    min_popularity: float = Query(0.0, ge=0.0, le=100.0),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user)
):
    """
    Get skill list for visualization (not network graph)
    Returns flat array of skills with all properties
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            skills = await skill_graph_service.get_skills_list(
                conn,
                {'min_popularity': min_popularity, 'limit': limit}
            )
            
            return {
                "success": True,
                "data": skills
            }
    except Exception as e:
        logger.error(f"Error getting skills: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

#### 3.2 Update Heatmap Routes Return Structure
**File**: `/app/backend/routes/heatmap.py`

Ensure `/api/heatmap/geographic` returns data directly (not nested in `locations`):
```python
@router.get("/geographic")
async def get_geographic_data(...):
    # ... existing code ...
    return {
        "success": True,
        "data": combined_data,  # Return array directly, not nested
        "total_locations": len(combined_data)
    }
```

---

### Phase 4: Frontend Service Updates (Priority: LOW)

#### 4.1 Update SkillGraph Service
**File**: `/app/frontend/src/services/skillGraphService.js`

Ensure it calls the correct endpoint:
```javascript
getSkillGraph: async (filters = {}) => {
  // Call /api/skill-graph (list endpoint) NOT /api/skill-graph/network
  const response = await api.get('/skill-graph', { params: filters });
  return response.data;
}
```

---

## Implementation Priority

### **CRITICAL (Must Fix)**:
1. ✅ SQL geographic_data table - ensure all JSON fields are populated
2. ✅ SQL skill_graph table - add sample data if missing
3. ✅ Backend HeatmapService field mapping corrections

### **HIGH (Should Fix)**:
4. ✅ Backend SkillGraphService - add get_skills_list method
5. ✅ Backend routes - add/update endpoints
6. ✅ SQL career_transition_matrix - add sample data

### **MEDIUM (Nice to Have)**:
7. ✅ Frontend service layer validation
8. ✅ SQL data enrichment with more samples

---

## Testing Checklist

After implementing fixes, verify:

### SkillGraph Page:
- [ ] Skills display as colored circles
- [ ] Click on skill shows details panel
- [ ] Related skills display correctly
- [ ] Industry connections visible
- [ ] Search and filter work

### TalentHeatmap Page:
- [ ] Locations display on map
- [ ] Click location shows detail card
- [ ] Alumni count displays correctly
- [ ] Top skills array populated
- [ ] Top companies array populated
- [ ] Cluster toggle works

### Leaderboard Page:
- [ ] User ranks display
- [ ] Score breakdown shows all categories
- [ ] Badges render correctly
- [ ] My score card appears
- [ ] Trend indicators work

### CareerPaths Page:
- [ ] Career transitions list displays
- [ ] Role filters work
- [ ] Transition statistics show
- [ ] Common skills display
- [ ] Success stories appear

---

## Files to Modify

### SQL Files:
1. `/app/sample_data_insert.sql` - Add/fix sample data

### Backend Services:
1. `/app/backend/services/skill_graph_service.py` - Add get_skills_list method
2. `/app/backend/services/heatmap_service.py` - Fix field mappings
3. `/app/backend/services/career_prediction_service.py` - Verify return structure

### Backend Routes:
1. `/app/backend/routes/skill_graph.py` - Add GET / endpoint
2. `/app/backend/routes/heatmap.py` - Verify response structures
3. `/app/backend/routes/career_paths.py` - Verify response structures

### Frontend (if needed):
1. `/app/frontend/src/services/skillGraphService.js` - Update endpoint calls
2. `/app/frontend/src/services/heatmapService.js` - Verify field names

---

## Summary

The main issues are:
1. **Data structure mismatches** between frontend expectations and backend responses
2. **Field naming inconsistencies** between database, backend, and frontend
3. **Missing or incomplete sample data** in SQL

The solution involves:
1. **Fixing SQL sample data** to include all required fields
2. **Adding data transformation layers** in backend services
3. **Updating API routes** to return frontend-expected structures
4. **Minimal frontend changes** (mostly validation)

**Estimated effort**: 2-3 hours
**Risk level**: Low (non-breaking changes, mostly data mapping)
**Impact**: HIGH (fixes all advanced page display issues)

---

## Next Steps

1. **Review this plan** with user for approval
2. **Start with SQL fixes** (highest impact, lowest risk)
3. **Update backend services** one at a time
4. **Test each page** after fixes
5. **Document any additional findings**

