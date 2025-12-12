# Advanced Features Pages - Implementation Fix Plan

## Problem Statement
All advanced features pages (Leaderboard, Knowledge Capsules, Talent Heatmap, Skill Graph, Career Paths, Alumni Card) are showing empty data despite having real data in the database.

## Root Cause Analysis
**Primary Issue**: API endpoint mismatches between frontend services and backend routes
**Secondary Issue**: Missing backend endpoints that frontend expects
**Tertiary Issue**: Potential data format mismatches in API responses

---

## Database Status: ✅ VERIFIED GOOD

### Sample Data Present:
- **Users**: 10 users (1 admin, 4 alumni, 3 students, 2 recruiters)
- **Engagement Scores**: 5 users with scores and rankings
- **Knowledge Capsules**: 3 capsules with content, tags, and metadata
- **Geographic Data**: 3 locations (San Francisco, Seattle, Boston) with alumni/job counts
- **Skill Graph**: 5 skills (JavaScript, Python, React, UX Design, Machine Learning)
- **Alumni Cards**: 2 active cards with QR codes
- **Badges**: 6 badge types available
- **Career Paths**: Data in career_paths table

---

## Detailed Fix Plan by Page

### 1. 🏆 LEADERBOARD PAGE
**File**: `/app/frontend/src/page/advanced/Leaderboard.jsx`

#### Issues Found:
| Frontend Service Call | Current Endpoint | Backend Actual | Status |
|----------------------|------------------|----------------|--------|
| `leaderboardService.getLeaderboard()` | `/api/leaderboard` | `/api/engagement/leaderboard` | ❌ MISMATCH |
| `leaderboardService.getMyScore()` | `/api/engagement/my-score` | `/api/engagement/my-score` | ✅ MATCH |
| `leaderboardService.getAllBadges()` | `/api/badges` | `/api/engagement/badges` | ❌ MISMATCH |
| `leaderboardService.getUserBadges()` | `/api/badges/user/{userId}` | `/api/engagement/my-badges` | ❌ MISMATCH |
| `engagementAIService.getEngagementInsights()` | `/api/engagement/insights/{userId}` | `/api/engagement/insights/{userId}` | ✅ MATCH |

#### Fixes Required:
1. **Update `/app/frontend/src/services/apiLeaderboardService.js`**:
   - Change `getLeaderboard()`: `/api/leaderboard` → `/api/engagement/leaderboard`
   - Change `getAllBadges()`: `/api/badges` → `/api/engagement/badges`
   - Change `getUserBadges()`: `/api/badges/user/{userId}` → `/api/engagement/my-badges`

#### Expected Data Structure:
```javascript
// Leaderboard Response
{
  success: true,
  data: [
    {
      user_id: "string",
      name: "string",
      photo_url: "string",
      role: "alumni",
      total_score: 485,
      rank: 1,
      level: "Legend",
      contributions: {...},
      badges: ["badge_name1", "badge_name2"]
    }
  ]
}
```

---

### 2. 📚 KNOWLEDGE CAPSULES PAGE
**File**: `/app/frontend/src/page/advanced/KnowledgeCapsules.jsx`

#### Issues Found:
| Frontend Service Call | Current Endpoint | Backend Actual | Status |
|----------------------|------------------|----------------|--------|
| `knowledgeService.getKnowledgeCapsules()` | `/api/knowledge/capsules` | `/api/capsules` | ❌ MISMATCH |
| `knowledgeService.getCategories()` | `/api/knowledge/categories` | **MISSING** | ❌ MISSING |
| `knowledgeService.getPersonalizedCapsules()` | `/api/knowledge/personalized/{userId}` | `/api/capsule-ranking/personalized/{userId}` | ❌ MISMATCH |
| `knowledgeService.likeCapsule()` | `/api/knowledge/capsules/{id}/like` | `/api/capsules/{id}/like` | ❌ MISMATCH |
| `knowledgeService.bookmarkCapsule()` | `/api/knowledge/capsules/{id}/bookmark` | `/api/capsules/{id}/bookmark` | ❌ MISMATCH |

#### Fixes Required:
1. **Update `/app/frontend/src/services/apiKnowledgeService.js`**:
   - Change `getCapsules()`: `/api/knowledge/capsules` → `/api/capsules`
   - Change `getCapsuleById()`: `/api/knowledge/capsules/{id}` → `/api/capsules/{id}`
   - Change `getCategories()`: `/api/knowledge/categories` → `/api/capsules/categories`
   - Change `likeCapsule()`: `/api/knowledge/capsules/{id}/like` → `/api/capsules/{id}/like`
   - Change `bookmarkCapsule()`: `/api/knowledge/capsules/{id}/bookmark` → `/api/capsules/{id}/bookmark`
   - Change `getPersonalizedCapsules()`: `/api/knowledge/personalized/{userId}` → `/api/capsule-ranking/personalized/{userId}`

2. **Add Backend Endpoint** in `/app/backend/routes/capsules.py`:
   - Add `GET /api/capsules/categories` endpoint to return distinct categories

#### Expected Data Structure:
```javascript
// Capsules List Response
{
  success: true,
  data: [
    {
      id: "string",
      title: "string",
      content: "string",
      category: "technical",
      tags: ["tag1", "tag2"],
      duration_minutes: 15,
      featured_image: "url",
      likes_count: 84,
      views_count: 456,
      bookmarks_count: 67,
      is_featured: true,
      author_id: "string",
      created_at: "timestamp"
    }
  ],
  total: 3,
  page: 1,
  limit: 20
}
```

---

### 3. 🗺️ TALENT HEATMAP PAGE
**File**: `/app/frontend/src/page/advanced/TalentHeatmap.jsx`

#### Issues Found:
| Frontend Service Call | Current Endpoint | Backend Actual | Status |
|----------------------|------------------|----------------|--------|
| `heatmapService.getGeographicData()` | `/api/heatmap/geographic` | `/api/heatmap/geographic` | ✅ MATCH |
| `heatmapService.getSkills()` | `/api/heatmap/skills` | **MISSING** | ❌ MISSING |
| `heatmapService.getIndustries()` | `/api/heatmap/industries` | `/api/heatmap/industries` | ✅ MATCH |
| `heatmapService.getTalentClusters()` | `/api/heatmap/talent-clusters` | `/api/heatmap/clusters` | ❌ MISMATCH |
| `heatmapService.getEmergingHubs()` | `/api/heatmap/emerging-hubs` | **MISSING** | ❌ MISSING |

#### Fixes Required:
1. **Update `/app/frontend/src/services/apiHeatmapService.js`**:
   - Change `getTalentClusters()`: `/api/heatmap/talent-clusters` → `/api/heatmap/clusters`

2. **Add Backend Endpoints** in `/app/backend/routes/heatmap.py`:
   - Add `GET /api/heatmap/skills` - Extract unique skills from geographic_data.top_skills
   - Add `GET /api/heatmap/emerging-hubs` - Identify fast-growing locations

#### Expected Data Structure:
```javascript
// Geographic Data Response
{
  success: true,
  data: [
    {
      id: "string",
      location_name: "San Francisco, CA",
      country: "United States",
      city: "San Francisco",
      latitude: 37.7749,
      longitude: -122.4194,
      alumni_count: 145,
      jobs_count: 89,
      top_skills: ["JavaScript", "Python", "React"],
      top_companies: ["Google", "Salesforce", "Uber"],
      top_industries: ["Technology", "Fintech"]
    }
  ]
}
```

---

### 4. 🕸️ SKILL GRAPH PAGE
**File**: `/app/frontend/src/page/advanced/SkillGraph.jsx`

#### Issues Found:
| Frontend Service Call | Current Endpoint | Backend Actual | Status |
|----------------------|------------------|----------------|--------|
| `skillGraphService.getSkillGraph()` | `/api/skills/graph` | Check `/api/skill-graph` | ❓ VERIFY |
| `skillGraphService.getIndustries()` | `/api/skills/industries` | Check backend | ❓ VERIFY |
| `skillRecommendationService.getRecommendations()` | `/api/skill-recommendations/{userId}` | Check backend | ❓ VERIFY |
| `skillRecommendationService.getTopTrendingSkills()` | `/api/skill-recommendations/trending` | Check backend | ❓ VERIFY |

#### Fixes Required:
1. **Verify Backend Routes** in `/app/backend/routes/skill_graph.py` and `/app/backend/routes/skills_routes.py`
2. **Update Frontend Service** `/app/frontend/src/services/apiSkillGraphService.js` based on actual backend routes
3. **Ensure Response Format** matches frontend expectations

#### Expected Data Structure:
```javascript
// Skill Graph Response
{
  success: true,
  data: [
    {
      id: "string",
      skill_name: "JavaScript",
      related_skills: ["TypeScript", "React", "Node.js"],
      industry_connections: ["Web Development", "Software Engineering"],
      alumni_count: 156,
      job_count: 89,
      popularity_score: 95.5
    }
  ]
}
```

---

### 5. 🛤️ CAREER PATHS PAGE
**File**: `/app/frontend/src/page/advanced/CareerPaths.jsx`

#### Issues Found:
| Frontend Service Call | Current Endpoint | Backend Actual | Status |
|----------------------|------------------|----------------|--------|
| `careerPathService.getCareerPaths()` | `/api/career-paths` | Check backend | ❓ VERIFY |
| `careerPathService.getRoles()` | `/api/career-paths/roles` | **MISSING** | ❌ MISSING |

#### Fixes Required:
1. **Verify Backend Routes** in `/app/backend/routes/career_paths.py`
2. **Add Missing Endpoint** for getting unique roles
3. **Update Frontend Service** if endpoint names don't match

#### Expected Data Structure:
```javascript
// Career Paths Response
{
  success: true,
  data: [
    {
      id: "string",
      starting_role: "Software Engineer",
      target_role: "Senior Software Engineer",
      transition_percentage: 75,
      avg_years: 3,
      alumni_count: 25,
      common_skills: ["Leadership", "System Design"],
      success_stories: [
        {
          alumni_name: "John Doe",
          journey: "Transitioned in 3 years by...",
          timeline_years: 3
        }
      ]
    }
  ]
}
```

---

### 6. 💳 ALUMNI CARD PAGE
**File**: `/app/frontend/src/page/advanced/AlumniCard.jsx`

#### Issues Found:
| Frontend Service Call | Current Endpoint | Backend Actual | Status |
|----------------------|------------------|----------------|--------|
| `alumniCardService.getMyCard()` | `/api/alumni-card/me` | Check backend | ❓ VERIFY |
| `alumniCardService.verifyCard()` | `/api/alumni-card/verify` | Check backend | ❓ VERIFY |

#### Fixes Required:
1. **Verify Backend Routes** in `/app/backend/routes/alumni_card.py`
2. **Update Frontend Service** `/app/frontend/src/services/apiAlumniCardService.js` if needed

#### Expected Data Structure:
```javascript
// Alumni Card Response
{
  success: true,
  data: {
    id: "string",
    user_id: "string",
    card_number: "ALU2019001234",
    qr_code_data: "{...}",
    issue_date: "2023-03-22",
    expiry_date: "2028-03-22",
    is_active: true,
    verification_count: 12,
    profile: {
      name: "Sarah Johnson",
      batch_year: 2019,
      photo_url: "url",
      is_verified: true
    }
  }
}
```

---

## Implementation Steps

### Phase 1: Backend Route Verification (30 mins)
1. ✅ Check `/app/backend/routes/engagement.py` - VERIFIED
2. ✅ Check `/app/backend/routes/capsules.py` - VERIFIED
3. ✅ Check `/app/backend/routes/heatmap.py` - VERIFIED
4. ⏳ Check `/app/backend/routes/skill_graph.py` - NEED TO VERIFY
5. ⏳ Check `/app/backend/routes/career_paths.py` - NEED TO VERIFY
6. ⏳ Check `/app/backend/routes/alumni_card.py` - NEED TO VERIFY

### Phase 2: Frontend Service Updates (45 mins)
1. ⏳ Update `apiLeaderboardService.js` - Fix 3 endpoints
2. ⏳ Update `apiKnowledgeService.js` - Fix 5 endpoints
3. ⏳ Update `apiHeatmapService.js` - Fix 1 endpoint
4. ⏳ Update `apiSkillGraphService.js` - Verify and fix
5. ⏳ Update `apiCareerPathService.js` - Verify and fix
6. ⏳ Update `apiAlumniCardService.js` - Verify and fix

### Phase 3: Add Missing Backend Endpoints (1 hour)
1. ⏳ Add `GET /api/capsules/categories` in capsules.py
2. ⏳ Add `GET /api/heatmap/skills` in heatmap.py
3. ⏳ Add `GET /api/heatmap/emerging-hubs` in heatmap.py
4. ⏳ Add `GET /api/career-paths/roles` in career_paths.py (if missing)

### Phase 4: Backend Service Implementation (if needed)
1. ⏳ Implement service methods for new endpoints
2. ⏳ Ensure proper database queries
3. ⏳ Format responses correctly

### Phase 5: Testing (45 mins)
1. ⏳ Test Leaderboard page - Verify data loads
2. ⏳ Test Knowledge Capsules page - Verify capsules display
3. ⏳ Test Talent Heatmap page - Verify map data
4. ⏳ Test Skill Graph page - Verify skills display
5. ⏳ Test Career Paths page - Verify paths display
6. ⏳ Test Alumni Card page - Verify card loads

---

## Testing Checklist

### Leaderboard Page Tests:
- [ ] Leaderboard table shows 5 users with scores
- [ ] My Score card displays current user's rank
- [ ] Badges tab shows 6 available badges
- [ ] My badges shows earned badges
- [ ] AI Insights tab loads (if user has data)

### Knowledge Capsules Tests:
- [ ] All Capsules tab shows 3 capsules
- [ ] Category filter works (technical, career, etc.)
- [ ] Like button works and updates count
- [ ] Bookmark button works and updates count
- [ ] For You (AI) tab shows personalized capsules

### Talent Heatmap Tests:
- [ ] Map shows 3 locations (SF, Seattle, Boston)
- [ ] Location details show alumni count and job count
- [ ] Talent view toggle works
- [ ] Jobs view toggle works
- [ ] Clusters display when enabled
- [ ] Emerging hubs panel shows data

### Skill Graph Tests:
- [ ] Skill nodes display (5 skills minimum)
- [ ] Clicking skill shows details
- [ ] Related skills displayed
- [ ] Alumni count shown per skill
- [ ] Recommendations panel shows (if user has profile)
- [ ] Trending skills panel displays

### Career Paths Tests:
- [ ] Career paths list displays
- [ ] Starting/target role filters work
- [ ] Transition statistics show
- [ ] Common skills displayed
- [ ] Success stories show (if available)
- [ ] Network view renders

### Alumni Card Tests:
- [ ] My Card tab displays card with data
- [ ] QR code rendered
- [ ] Card details show (name, batch, number)
- [ ] AI validation status displays
- [ ] Verify Card tab works
- [ ] Verification history loads

---

## Success Criteria
✅ All 6 advanced features pages load with real database data
✅ No empty states shown when data exists
✅ All interactive features (like, bookmark, filter) work correctly
✅ API responses match frontend expectations
✅ No console errors related to API calls

---

## Rollback Plan
If issues occur:
1. Revert frontend service files to previous versions
2. Keep backend changes (they're additive, won't break existing functionality)
3. Switch to mock data temporarily: Set `REACT_APP_USE_MOCK_DATA=true` in `.env`

---

## Notes
- Database connection is working (other pages load data correctly)
- Mock data flag is OFF: `REACT_APP_USE_MOCK_DATA=false`
- Backend server is running on port 8001
- All routes must be prefixed with `/api` for Kubernetes ingress routing
