# 🔄 Frontend Mock Data & Backend API Toggle Guide

## Overview
The AlumUnity frontend now supports seamless toggling between **Mock Data** (for development) and **Backend API** (for production) using a single environment variable.

---

## ✅ What Has Been Implemented

### 1. Environment Configuration
- **File**: `/app/frontend/.env`
- **Variable**: `REACT_APP_USE_MOCK_DATA`
  - `true` → Uses mock data (default for development)
  - `false` → Uses backend API (for production)

### 2. Service Architecture
All services are now split into two implementations:

#### Mock Services (Existing)
Located in `/app/frontend/src/services/`:
- `mockAuth.js`
- `mockJobService.js`
- `mockEventService.js`
- `mockMentorshipService.js`
- `mockForumService.js`
- `mockProfileService.js`
- `mockDirectoryService.js`
- `mockNotificationService.js`
- `mockLeaderboardService.js`
- `mockAlumniCardService.js`
- `mockCareerPathService.js`
- `mockHeatmapService.js`
- `mockSkillGraphService.js`
- `mockKnowledgeService.js`

#### Real API Services (Newly Created)
Located in `/app/frontend/src/services/`:
- `apiAuth.js`
- `apiJobService.js`
- `apiEventService.js`
- `apiMentorshipService.js`
- `apiForumService.js`
- `apiProfileService.js`
- `apiDirectoryService.js`
- `apiNotificationService.js`
- `apiLeaderboardService.js`
- `apiAlumniCardService.js`
- `apiCareerPathService.js`
- `apiHeatmapService.js`
- `apiSkillGraphService.js`
- `apiKnowledgeService.js`

#### Service Switcher
**File**: `/app/frontend/src/services/index.js`

This file automatically exports the correct service (mock or real) based on the environment variable. It acts as a central hub for all service imports.

---

## 🚀 How to Use

### For Development (Mock Data)

1. **Set environment variable** in `/app/frontend/.env`:
   ```env
   REACT_APP_USE_MOCK_DATA=true
   ```

2. **Restart the development server**:
   ```bash
   sudo supervisorctl restart frontend
   ```

3. **Verify in browser console**:
   You should see: `🔄 Service Mode: MOCK DATA`

4. **Test the application**:
   All features will use data from `/app/mockdata.json`

### For Production (Backend API)

1. **Ensure backend is running** on the URL specified in `REACT_APP_BACKEND_URL`

2. **Update environment variable** in `/app/frontend/.env`:
   ```env
   REACT_APP_USE_MOCK_DATA=false
   ```

3. **Restart the development server**:
   ```bash
   sudo supervisorctl restart frontend
   ```

4. **Verify in browser console**:
   You should see: `🔄 Service Mode: BACKEND API`

5. **Test the application**:
   All features will now make real API calls to the backend

---

## 📝 No Code Changes Required in Pages

✅ **Good News**: You don't need to modify any page components!

All pages already import services from the centralized service switcher, so they automatically use the correct service based on the environment variable.

### Example Import Pattern (Already in Use)
```javascript
// Pages import from the central service switcher
import { jobService, eventService, authService } from '@/services';

// This automatically resolves to either mock or real service
const jobs = await jobService.getAllJobs();
```

---

## 🔧 Implementation Details

### Service Switcher Logic
The `/app/frontend/src/services/index.js` file contains:

```javascript
// Check environment variable
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Export appropriate service
export const authService = USE_MOCK_DATA ? mockAuth : apiAuth;
export const jobService = USE_MOCK_DATA ? mockJobService : apiJobService;
// ... and so on for all services
```

### API Service Structure
All real API services follow this pattern:

```javascript
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const apiJobService = {
  async getAllJobs(filters = {}) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/jobs`, { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },
  // ... other methods
};
```

---

## 🧪 Testing the Toggle

### Test Scenario 1: Mock Data Mode
1. Set `REACT_APP_USE_MOCK_DATA=true`
2. Restart frontend
3. Login with mock credentials:
   - Email: `admin@alumni.edu` (or any from mockdata.json)
   - Password: Any password (mock accepts all)
4. Navigate through jobs, events, mentorship features
5. Verify data matches `/app/mockdata.json`

### Test Scenario 2: Backend API Mode
1. Ensure backend server is running
2. Set `REACT_APP_USE_MOCK_DATA=false`
3. Restart frontend
4. Login with real credentials
5. Navigate through features
6. Verify API calls in browser Network tab
7. Check that endpoints are `/api/jobs`, `/api/events`, etc.

### Test Scenario 3: Switching Between Modes
1. Start with mock data mode
2. Interact with the application
3. Switch to backend mode
4. Verify application still works correctly
5. Switch back to mock mode
6. Confirm seamless transition

---

## 📋 Checklist for Backend Implementation

When implementing the backend, refer to `/app/BACKEND_API_SPECIFICATION.md` for complete API specifications.

### Required Backend Endpoints

#### Authentication (`/api/auth`)
- [ ] POST `/api/auth/login`
- [ ] POST `/api/auth/register`
- [ ] POST `/api/auth/forgot-password`
- [ ] POST `/api/auth/reset-password`
- [ ] POST `/api/auth/google-signin`

#### Jobs (`/api/jobs`)
- [ ] GET `/api/jobs`
- [ ] GET `/api/jobs/:jobId`
- [ ] POST `/api/jobs`
- [ ] PUT `/api/jobs/:jobId`
- [ ] DELETE `/api/jobs/:jobId`
- [ ] POST `/api/jobs/:jobId/apply`
- [ ] GET `/api/applications/user/:userId`
- [ ] GET `/api/jobs/:jobId/applications`
- [ ] PUT `/api/applications/:applicationId`
- [ ] GET `/api/jobs/user/:userId`

#### Events (`/api/events`)
- [ ] GET `/api/events`
- [ ] GET `/api/events/:eventId`
- [ ] POST `/api/events`
- [ ] PUT `/api/events/:eventId`
- [ ] DELETE `/api/events/:eventId`
- [ ] POST `/api/events/:eventId/rsvp`
- [ ] GET `/api/events/:eventId/my-rsvp`
- [ ] GET `/api/events/:eventId/attendees`
- [ ] GET `/api/events/my-events`

#### Mentorship (`/api/mentorship`)
- [ ] GET `/api/mentors`
- [ ] GET `/api/mentors/:userId`
- [ ] POST `/api/mentorship/requests`
- [ ] GET `/api/mentorship/my-requests`
- [ ] GET `/api/mentorship/received-requests`
- [ ] PUT `/api/mentorship/requests/:requestId/accept`
- [ ] PUT `/api/mentorship/requests/:requestId/reject`
- [ ] GET `/api/mentorship/sessions`
- [ ] GET `/api/mentorship/sessions/:sessionId`
- [ ] POST `/api/mentorship/sessions`
- [ ] PUT `/api/mentorship/sessions/:sessionId`
- [ ] PUT `/api/mentorship/sessions/:sessionId/complete`

#### Forum (`/api/forum`)
- [ ] GET `/api/forum/posts`
- [ ] GET `/api/forum/posts/:postId`
- [ ] POST `/api/forum/posts`
- [ ] PUT `/api/forum/posts/:postId`
- [ ] DELETE `/api/forum/posts/:postId`
- [ ] POST `/api/forum/posts/:postId/like`
- [ ] GET `/api/forum/posts/:postId/comments`
- [ ] POST `/api/forum/posts/:postId/comments`
- [ ] PUT `/api/forum/comments/:commentId`
- [ ] DELETE `/api/forum/comments/:commentId`
- [ ] POST `/api/forum/comments/:commentId/like`

#### Profiles (`/api/profiles`)
- [ ] GET `/api/profiles/:userId`
- [ ] GET `/api/profiles/me`
- [ ] PUT `/api/profiles/:userId`
- [ ] POST `/api/profiles/:userId/photo`
- [ ] POST `/api/profiles/:userId/cv`

#### Directory (`/api/directory`)
- [ ] GET `/api/directory/alumni`
- [ ] GET `/api/directory/search`
- [ ] GET `/api/directory/batch/:batchYear`
- [ ] GET `/api/directory/company/:company`
- [ ] GET `/api/directory/filters`

#### Notifications (`/api/notifications`)
- [ ] GET `/api/notifications`
- [ ] GET `/api/notifications/unread-count`
- [ ] PUT `/api/notifications/:notificationId/read`
- [ ] PUT `/api/notifications/read-all`
- [ ] DELETE `/api/notifications/:notificationId`
- [ ] GET `/api/notifications/preferences`
- [ ] PUT `/api/notifications/preferences`

#### Leaderboard & Badges (`/api/leaderboard`, `/api/badges`)
- [ ] GET `/api/leaderboard`
- [ ] GET `/api/leaderboard/user/:userId`
- [ ] GET `/api/badges`
- [ ] GET `/api/badges/user/:userId`

#### Alumni Card (`/api/alumni-card`)
- [ ] GET `/api/alumni-card/:userId`
- [ ] GET `/api/alumni-card/me`
- [ ] POST `/api/alumni-card/verify`
- [ ] POST `/api/alumni-card/:userId/generate`

#### Career Paths (`/api/career-paths`)
- [ ] GET `/api/career-paths`
- [ ] GET `/api/career-paths/:pathId`
- [ ] GET `/api/career-paths/transitions`
- [ ] GET `/api/career-paths/recommended/:userId`

#### Heatmap (`/api/heatmap`)
- [ ] GET `/api/heatmap/geographic`
- [ ] GET `/api/heatmap/alumni-distribution`
- [ ] GET `/api/heatmap/job-distribution`
- [ ] GET `/api/heatmap/location/:locationId`

#### Skills (`/api/skills`)
- [ ] GET `/api/skills/graph`
- [ ] GET `/api/skills/:skillName`
- [ ] GET `/api/skills/:skillName/related`
- [ ] GET `/api/skills/trending`
- [ ] GET `/api/skills/search`

#### Knowledge Capsules (`/api/knowledge`)
- [ ] GET `/api/knowledge/capsules`
- [ ] GET `/api/knowledge/capsules/:capsuleId`
- [ ] POST `/api/knowledge/capsules`
- [ ] PUT `/api/knowledge/capsules/:capsuleId`
- [ ] DELETE `/api/knowledge/capsules/:capsuleId`
- [ ] POST `/api/knowledge/capsules/:capsuleId/like`
- [ ] POST `/api/knowledge/capsules/:capsuleId/bookmark`
- [ ] GET `/api/knowledge/bookmarks`

---

## 🐛 Troubleshooting

### Issue: Console shows "Service Mode: MOCK DATA" but I set it to false

**Solution**: 
- Ensure you saved the `.env` file
- Restart the development server: `sudo supervisorctl restart frontend`
- Clear browser cache and reload

### Issue: Backend API calls are failing

**Possible causes**:
1. Backend server is not running
2. `REACT_APP_BACKEND_URL` is incorrect
3. CORS is not configured on backend
4. API endpoints don't match specification

**Debug steps**:
1. Check backend server status: `sudo supervisorctl status backend`
2. Verify backend URL in `.env` matches your backend server
3. Check browser console for CORS errors
4. Check browser Network tab for failed requests

### Issue: Some features work with mock but not with backend

**Solution**:
- Check if backend endpoints are implemented
- Verify response format matches mock data format
- Check browser console for errors
- Review API specification document

### Issue: Mock data is stale or incorrect

**Solution**:
- Check `/app/mockdata.json` for correct data
- Mock services use localStorage in some cases - clear browser storage
- Refresh the page after clearing storage

---

## 📊 Benefits of This Architecture

✅ **Zero Code Changes**: Switch between mock and backend without touching page components

✅ **Parallel Development**: Frontend and backend teams can work independently

✅ **Easy Testing**: Test with mock data before backend is ready

✅ **Production Ready**: Simply flip the switch for production deployment

✅ **Consistent API**: Both mock and real services have identical interfaces

✅ **Type Safety**: All services follow the same structure and return types

✅ **Error Handling**: Both implementations handle errors consistently

---

## 🎯 Best Practices

### For Frontend Developers
1. Always import services from `/services/index.js`, not individual files
2. Handle loading and error states in components
3. Test features with both mock and real backend
4. Don't hardcode URLs - use environment variables

### For Backend Developers
1. Follow API specification exactly as documented
2. Match response formats with mock data structure
3. Include all fields specified in mock data
4. Test endpoints with frontend before marking complete
5. Ensure all routes are prefixed with `/api`

### For Testing
1. Test critical flows with mock data first
2. Switch to backend and verify same flows work
3. Test error scenarios (network failures, invalid data)
4. Verify performance with real data

---

## 📚 Related Documentation

- **API Specification**: `/app/BACKEND_API_SPECIFICATION.md` - Complete backend API documentation
- **Mock Data Guide**: `/app/MOCKDATA_README.md` - Guide to using mock data
- **Database Schema**: `/app/database_schema.sql` - MySQL database schema
- **Backend Workflow**: `/app/BACKEND_WORKFLOW.md` - Backend development workflow

---

## 🔮 Future Enhancements

Potential improvements for the toggle system:

1. **Runtime Toggle**: Add UI switch to toggle between modes without restart
2. **Hybrid Mode**: Use backend for some services, mock for others
3. **Service Status**: Display which services are using mock vs real
4. **Mock Data Sync**: Auto-sync mock data format with backend responses
5. **API Monitoring**: Track API performance and errors in real-time

---

**Last Updated**: 2025-01-25

For questions or issues, refer to the project documentation or contact the development team.
