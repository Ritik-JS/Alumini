# API Endpoint Comparison: Frontend vs Backend

## 🔴 Critical Issues Found

### 1. **Jobs API** - MISMATCHES
| Frontend Expects | Backend Has | Status |
|-----------------|-------------|--------|
| `POST /api/jobs` | `POST /api/jobs/create` | ❌ MISMATCH |
| `GET /api/jobs/user/:userId` | `GET /api/jobs/user/:userId/jobs` | ❌ MISMATCH |
| `GET /api/applications/recruiter/:recruiterId` | NOT FOUND | ❌ MISSING |

### 2. **Knowledge/Capsules API** - PATH MISMATCH
| Frontend Expects | Backend Has | Status |
|-----------------|-------------|--------|
| `GET /api/knowledge/capsules` | `GET /api/capsules` | ❌ PATH MISMATCH |
| `GET /api/knowledge/capsules/:id` | `GET /api/capsules/:id` | ❌ PATH MISMATCH |
| `POST /api/knowledge/capsules` | `POST /api/capsules/create` | ❌ PATH MISMATCH |
| `PUT /api/knowledge/capsules/:id` | `PUT /api/capsules/:id` | ⚠️ PARTIAL MATCH |
| `DELETE /api/knowledge/capsules/:id` | `DELETE /api/capsules/:id` | ⚠️ PARTIAL MATCH |
| `POST /api/knowledge/capsules/:id/like` | `POST /api/capsules/:id/like` | ⚠️ PARTIAL MATCH |
| `POST /api/knowledge/capsules/:id/bookmark` | `POST /api/capsules/:id/bookmark` | ⚠️ PARTIAL MATCH |
| `GET /api/knowledge/bookmarks` | `GET /api/capsules/my-bookmarks` | ❌ PATH MISMATCH |

### 3. **Skill Graph API** - PATH MISMATCH
| Frontend Expects | Backend Has | Status |
|-----------------|-------------|--------|
| `GET /api/skills/graph` | `GET /api/skill-graph/network` | ❌ PATH MISMATCH |
| `GET /api/skills/:skillName` | `GET /api/skill-graph/skill/:skillName` | ❌ PATH MISMATCH |
| `GET /api/skills/:skillName/related` | NOT FOUND | ❌ MISSING |
| `GET /api/skills/trending` | `GET /api/skill-graph/trending` | ❌ PATH MISMATCH |
| `GET /api/skills/search` | NOT FOUND | ❌ MISSING |

### 4. **Heatmap API** - ENDPOINT MISMATCH
| Frontend Expects | Backend Has | Status |
|-----------------|-------------|--------|
| `GET /api/heatmap/geographic` | `GET /api/heatmap/talent` or `/combined` | ❌ MISMATCH |
| `GET /api/heatmap/alumni-distribution` | Partial in `/talent` | ❌ MISMATCH |
| `GET /api/heatmap/job-distribution` | Partial in `/opportunities` | ❌ MISMATCH |
| `GET /api/heatmap/location/:locationId` | `GET /api/heatmap/location/:locationName` | ⚠️ PARAM TYPE MISMATCH |

## ✅ Working APIs (Correct Matches)

### Auth API - ✅ ALL CORRECT
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/google-signin` (if implemented)

### Events API - ✅ ALL CORRECT
- `GET /api/events`
- `GET /api/events/:eventId`
- `POST /api/events`
- `PUT /api/events/:eventId`
- `DELETE /api/events/:eventId`
- `POST /api/events/:eventId/rsvp`
- `GET /api/events/:eventId/my-rsvp`
- `GET /api/events/:eventId/attendees`
- `GET /api/events/my-events`

### Profiles API - ✅ ALL CORRECT
- `GET /api/profiles/:userId`
- `GET /api/profiles/me`
- `PUT /api/profiles/:userId`
- `POST /api/profiles/:userId/photo`
- `POST /api/profiles/:userId/cv`

### Notifications API - ✅ ALL CORRECT
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PUT /api/notifications/:notificationId/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:notificationId`
- `GET /api/notifications/preferences`
- `PUT /api/notifications/preferences`

### Forum API - ✅ MOSTLY CORRECT
- `GET /api/forum/posts`
- `GET /api/forum/posts/:postId`
- `POST /api/forum/posts`
- `PUT /api/forum/posts/:postId`
- `DELETE /api/forum/posts/:postId`
- `POST /api/forum/posts/:postId/like`
- `GET /api/forum/posts/:postId/comments`
- `POST /api/forum/posts/:postId/comments`
- `PUT /api/forum/comments/:commentId`
- `DELETE /api/forum/comments/:commentId`
- `POST /api/forum/comments/:commentId/like`

### Directory API - ✅ ALL CORRECT
- `GET /api/directory/alumni`
- `GET /api/directory/search`
- `GET /api/directory/batch/:batchYear`
- `GET /api/directory/company/:company`
- `GET /api/directory/filters`

### Mentorship API - ✅ ALL CORRECT
- `GET /api/mentors`
- `GET /api/mentors/:userId`
- `POST /api/mentorship/requests`
- `GET /api/mentorship/my-requests`
- `GET /api/mentorship/received-requests`
- `PUT /api/mentorship/requests/:requestId/accept`
- `PUT /api/mentorship/requests/:requestId/reject`
- `GET /api/mentorship/sessions`
- `GET /api/mentorship/sessions/:sessionId`
- `POST /api/mentorship/sessions`
- `PUT /api/mentorship/sessions/:sessionId`
- `PUT /api/mentorship/sessions/:sessionId/complete`

### Leaderboard API - ✅ ALL CORRECT
- `GET /api/leaderboard`
- `GET /api/leaderboard/user/:userId`
- `GET /api/badges`
- `GET /api/badges/user/:userId`

### Alumni Card API - ✅ ALL CORRECT
- `GET /api/alumni-card/:userId`
- `GET /api/alumni-card/me`
- `POST /api/alumni-card/verify`
- `POST /api/alumni-card/:userId/generate`

### Career Paths API - ✅ ALL CORRECT
- `GET /api/career-paths`
- `GET /api/career-paths/:pathId`
- `GET /api/career-paths/transitions`
- `GET /api/career-paths/recommended/:userId`

### Dataset API - ✅ ALL CORRECT
- All admin dataset endpoints match

---

## 📝 Summary

**Total APIs Checked**: 15

**Status**:
- ✅ **Working Correctly**: 11 APIs
- ⚠️ **Need Fixes**: 4 APIs (Jobs, Knowledge, Skills, Heatmap)

**Total Issues**:
- Critical Endpoint Mismatches: 8
- Missing Endpoints: 4
- Path Mismatches: 12

---

## 🔧 Required Fixes

1. **Jobs API**: Add route aliases or update frontend
2. **Knowledge API**: Create `/api/knowledge/*` wrapper routes
3. **Skills API**: Create `/api/skills/*` wrapper routes
4. **Heatmap API**: Update backend routes to match frontend expectations
5. **Applications API**: Add missing recruiter endpoint
