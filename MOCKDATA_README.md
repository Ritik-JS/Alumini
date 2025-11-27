# 📦 Mock Data Documentation - AlumUnity

## Overview
This document provides comprehensive guidance on using the mock data file (`/app/mockdata.json`) for developing the AlumUnity frontend.

## 🎯 Purpose
The mock data file serves as:
- **Development Aid**: Enables frontend development before backend completion
- **Testing Resource**: Provides consistent test data for UI components
- **Reference Guide**: Shows exact data structures and field names
- **Demo Material**: Contains realistic data for prototypes and presentations

## 📁 File Location
```
/app/mockdata.json
```

## 🗂️ Data Structure

### Metadata
```json
{
  "_meta": {
    "description": "Comprehensive mock data for AlumUnity System",
    "version": "1.0",
    "compatible_with": "MySQL 8.0+ / MariaDB 10.5+",
    "last_updated": "2025-01-01"
  }
}
```

### Data Categories

#### 1. **Users** (10 records)
User accounts with different roles: admin, alumni, student, recruiter
```javascript
mockData.users
// Fields: id, email, password_hash, role, is_verified, is_active, last_login, timestamps
```

**Sample Users:**
- Admin: admin@alumni.edu
- Alumni: sarah.johnson@alumni.edu, michael.chen@alumni.edu, priya.patel@alumni.edu, lisa.anderson@alumni.edu
- Students: emily.rodriguez@alumni.edu, james.wilson@alumni.edu, maria.garcia@alumni.edu
- Recruiters: david.kim@techcorp.com, robert.taylor@startupventures.com

#### 2. **Alumni Profiles** (4 records)
Complete alumni profiles with experience, education, skills
```javascript
mockData.alumni_profiles
// Fields: id, user_id, photo_url, name, bio, headline, current_company, current_role,
//         location, batch_year, experience_timeline, education_details, skills,
//         achievements, social_links, cv_url, profile_completion_percentage, is_verified
```

**Profiles Include:**
- Sarah Johnson (Google, Senior Software Engineer, 100% complete)
- Michael Chen (Amazon, Senior Product Manager, 95% complete)
- Priya Patel (Airbnb, Lead UX Designer, 100% complete)
- Lisa Anderson (Netflix, Senior Data Scientist, 98% complete)

#### 3. **Jobs** (5 records)
Job postings from various companies
```javascript
mockData.jobs
// Fields: id, title, description, company, location, job_type, experience_required,
//         skills_required, salary_range, apply_link, posted_by, application_deadline,
//         status, views_count, applications_count, timestamps
```

**Job Types:**
- Full-time positions (Senior Full-Stack Engineer, Machine Learning Engineer, DevOps Engineer)
- Internship (Frontend Developer Intern)
- Remote and on-site opportunities

#### 4. **Job Applications** (3 records)
Student applications to jobs
```javascript
mockData.job_applications
// Fields: id, job_id, applicant_id, cv_url, cover_letter, status, viewed_at,
//         response_message, applied_at, updated_at
```

#### 5. **Mentor Profiles** (4 records)
Mentor information and availability
```javascript
mockData.mentor_profiles
// Fields: id, user_id, is_available, expertise_areas, max_mentees,
//         current_mentees_count, rating, total_sessions, total_reviews,
//         mentorship_approach, timestamps
```

#### 6. **Mentorship Requests** (3 records)
Student requests for mentorship
```javascript
mockData.mentorship_requests
// Fields: id, student_id, mentor_id, request_message, goals, preferred_topics,
//         status, rejection_reason, requested_at, accepted_at, rejected_at
```

#### 7. **Mentorship Sessions** (4 records)
Scheduled and completed mentorship sessions
```javascript
mockData.mentorship_sessions
// Fields: id, mentorship_request_id, scheduled_date, duration, status,
//         meeting_link, agenda, notes, feedback, rating, timestamps
```

#### 8. **Events** (5 records)
Various event types (workshops, webinars, conferences, networking)
```javascript
mockData.events
// Fields: id, title, description, event_type, location, is_virtual,
//         meeting_link, start_date, end_date, registration_deadline,
//         max_attendees, current_attendees_count, banner_image,
//         created_by, status, views_count, timestamps
```

#### 9. **Event RSVPs** (7 records)
User event registrations
```javascript
mockData.event_rsvps
// Fields: id, event_id, user_id, status, rsvp_date, updated_at
```

#### 10. **Forum Posts** (4 records)
Community discussions with realistic content
```javascript
mockData.forum_posts
// Fields: id, title, content, author_id, tags, likes_count, comments_count,
//         views_count, is_pinned, is_deleted, timestamps
```

#### 11. **Forum Comments** (5 records)
Comments on posts with threading support
```javascript
mockData.forum_comments
// Fields: id, post_id, author_id, parent_comment_id, content,
//         likes_count, is_deleted, timestamps
```

#### 12. **Notifications** (6 records)
Various notification types
```javascript
mockData.notifications
// Fields: id, user_id, type, title, message, link, is_read,
//         priority, metadata, read_at, created_at
```

#### 13. **Engagement Scores** (5 records)
Gamification and leaderboard data
```javascript
mockData.engagement_scores
// Fields: id, user_id, total_score, contributions, rank_position,
//         level, last_calculated
```

#### 14. **Badges** (6 records)
Achievement badges
```javascript
mockData.badges
// Fields: id, name, description, icon_url, requirements, rarity, points
```

#### 15. **User Badges** (4 records)
Earned badges by users
```javascript
mockData.user_badges
// Fields: id, user_id, badge_id, earned_at
```

#### 16. **Skill Graph** (5 records)
Skill relationships and popularity
```javascript
mockData.skill_graph
// Fields: id, skill_name, related_skills, industry_connections,
//         alumni_count, job_count, popularity_score
```

#### 17. **Knowledge Capsules** (3 records)
Educational content and articles
```javascript
mockData.knowledge_capsules
// Fields: id, title, content, author_id, category, tags,
//         duration_minutes, featured_image, likes_count,
//         views_count, bookmarks_count, is_featured, timestamps
```

#### 18. **Geographic Data** (5 records)
Location-based analytics for heatmap
```javascript
mockData.geographic_data
// Fields: id, location_name, country, city, latitude, longitude,
//         alumni_count, jobs_count, top_skills, top_companies,
//         top_industries, last_updated
```

#### 19. **Alumni Cards** (2 records)
Digital ID cards with QR codes
```javascript
mockData.alumni_cards
// Fields: id, user_id, card_number, qr_code_data, issue_date,
//         expiry_date, is_active, verification_count,
//         last_verified, timestamps
```

#### 20. **System Config** (4 records)
System configuration settings
```javascript
mockData.system_config
// Fields: id, config_key, config_value, config_type,
//         description, is_public
```

## 💻 Usage Examples

### Basic Import
```javascript
import mockData from '../../../mockdata.json';

// Access data
const users = mockData.users;
const jobs = mockData.jobs;
const events = mockData.events;
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';
import mockData from '../../../mockdata.json';

function JobsList() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    // Simulate API call with mock data
    setJobs(mockData.jobs);
  }, []);

  return (
    <div>
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

### With API Service Layer
```javascript
// services/api.js
import mockData from '../../mockdata.json';

const USE_MOCK = process.env.REACT_APP_USE_MOCK_DATA === 'true';

export const getJobs = async () => {
  if (USE_MOCK) {
    // Return mock data during development
    return Promise.resolve(mockData.jobs);
  }
  // Real API call
  return fetch(`${API_URL}/api/jobs`).then(r => r.json());
};

export const getEvents = async () => {
  if (USE_MOCK) {
    return Promise.resolve(mockData.events);
  }
  return fetch(`${API_URL}/api/events`).then(r => r.json());
};
```

### Filtering Mock Data
```javascript
import mockData from '../../../mockdata.json';

// Filter alumni by role
const alumniUsers = mockData.users.filter(user => user.role === 'alumni');

// Get alumni profiles for these users
const alumniProfiles = mockData.alumni_profiles.filter(profile =>
  alumniUsers.some(user => user.id === profile.user_id)
);

// Get active jobs
const activeJobs = mockData.jobs.filter(job => job.status === 'active');

// Get upcoming events
const upcomingEvents = mockData.events.filter(event =>
  new Date(event.start_date) > new Date()
);
```

### Joining Related Data
```javascript
import mockData from '../../../mockdata.json';

// Get job with applicant details
const getJobWithApplicants = (jobId) => {
  const job = mockData.jobs.find(j => j.id === jobId);
  const applications = mockData.job_applications.filter(app => app.job_id === jobId);
  
  const applicantsWithDetails = applications.map(app => {
    const user = mockData.users.find(u => u.id === app.applicant_id);
    const profile = mockData.alumni_profiles.find(p => p.user_id === app.applicant_id);
    return {
      ...app,
      user,
      profile
    };
  });

  return {
    ...job,
    applications: applicantsWithDetails
  };
};
```

### Creating a Mock API Service
```javascript
// services/mockApi.js
import mockData from '../../mockdata.json';

// Simulate async API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Users
  getUsers: async () => {
    await delay(500);
    return mockData.users;
  },
  
  getUserById: async (id) => {
    await delay(300);
    return mockData.users.find(u => u.id === id);
  },

  // Jobs
  getJobs: async (filters = {}) => {
    await delay(500);
    let jobs = [...mockData.jobs];
    
    if (filters.status) {
      jobs = jobs.filter(j => j.status === filters.status);
    }
    if (filters.company) {
      jobs = jobs.filter(j => j.company.includes(filters.company));
    }
    
    return jobs;
  },

  // Events
  getEvents: async (type) => {
    await delay(500);
    if (type) {
      return mockData.events.filter(e => e.event_type === type);
    }
    return mockData.events;
  },

  // Profiles
  getAlumniProfiles: async () => {
    await delay(500);
    return mockData.alumni_profiles;
  },

  // Mentors
  getMentors: async () => {
    await delay(500);
    return mockData.mentor_profiles;
  }
};
```

## 🔄 Switching to Real Backend

When the backend is ready, simply update your API service:

### Before (Mock Data)
```javascript
// services/api.js
import mockData from '../../mockdata.json';

export const getJobs = () => Promise.resolve(mockData.jobs);
```

### After (Real API)
```javascript
// services/api.js
import axios from 'axios';

export const getJobs = () => 
  axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/jobs`)
    .then(res => res.data);
```

### Using Environment Variable
```javascript
// .env.development
REACT_APP_USE_MOCK_DATA=true

// .env.production
REACT_APP_USE_MOCK_DATA=false

// services/api.js
const USE_MOCK = process.env.REACT_APP_USE_MOCK_DATA === 'true';

export const getJobs = () => {
  if (USE_MOCK) {
    return Promise.resolve(mockData.jobs);
  }
  return axios.get(`${API_URL}/api/jobs`).then(res => res.data);
};
```

## 🎨 Data Relationships

### User → Profile
```javascript
const getUserProfile = (userId) => {
  const user = mockData.users.find(u => u.id === userId);
  const profile = mockData.alumni_profiles.find(p => p.user_id === userId);
  return { user, profile };
};
```

### Job → Applications → Applicants
```javascript
const getJobApplications = (jobId) => {
  const applications = mockData.job_applications.filter(app => app.job_id === jobId);
  return applications.map(app => ({
    ...app,
    applicant: mockData.users.find(u => u.id === app.applicant_id),
    profile: mockData.alumni_profiles.find(p => p.user_id === app.applicant_id)
  }));
};
```

### Mentorship Request → Student → Mentor
```javascript
const getMentorshipDetails = (requestId) => {
  const request = mockData.mentorship_requests.find(r => r.id === requestId);
  const student = mockData.users.find(u => u.id === request.student_id);
  const mentor = mockData.users.find(u => u.id === request.mentor_id);
  const mentorProfile = mockData.mentor_profiles.find(m => m.user_id === request.mentor_id);
  
  return { request, student, mentor, mentorProfile };
};
```

### Event → RSVPs → Attendees
```javascript
const getEventAttendees = (eventId) => {
  const event = mockData.events.find(e => e.id === eventId);
  const rsvps = mockData.event_rsvps.filter(r => r.event_id === eventId);
  const attendees = rsvps.map(rsvp => ({
    ...rsvp,
    user: mockData.users.find(u => u.id === rsvp.user_id),
    profile: mockData.alumni_profiles.find(p => p.user_id === rsvp.user_id)
  }));
  
  return { event, attendees };
};
```

## ✅ Best Practices

### 1. **Use Environment Variables**
Control mock data usage with environment variables:
```javascript
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';
```

### 2. **Create Service Layer**
Centralize API calls in a service layer for easy switching:
```javascript
// services/api.js
export const apiService = {
  getJobs: USE_MOCK ? getMockJobs : getRealJobs,
  getEvents: USE_MOCK ? getMockEvents : getRealEvents
};
```

### 3. **Maintain Data Consistency**
When using mock data, ensure IDs and relationships match:
```javascript
// Always check relationships exist
const profile = mockData.alumni_profiles.find(p => p.user_id === userId);
if (!profile) {
  console.warn(`No profile found for user ${userId}`);
}
```

### 4. **Simulate Loading States**
Add delays to simulate network requests:
```javascript
const getMockData = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockData.jobs;
};
```

### 5. **Test Edge Cases**
Use mock data to test various scenarios:
```javascript
// Test with different user roles
const testAsAdmin = mockData.users.find(u => u.role === 'admin');
const testAsStudent = mockData.users.find(u => u.role === 'student');

// Test with different statuses
const pendingApplications = mockData.job_applications.filter(a => a.status === 'pending');
const shortlistedApplications = mockData.job_applications.filter(a => a.status === 'shortlisted');
```

## 📊 Data Statistics

- **Total Users**: 10 (1 admin, 4 alumni, 3 students, 2 recruiters)
- **Alumni Profiles**: 4 complete profiles with experience and skills
- **Jobs**: 5 active job postings across various roles and companies
- **Job Applications**: 3 applications with different statuses
- **Mentors**: 4 experienced mentors with expertise areas
- **Mentorship Requests**: 3 requests (2 accepted, 1 pending)
- **Mentorship Sessions**: 4 sessions (2 completed, 1 scheduled, 1 upcoming)
- **Events**: 5 events (workshops, webinars, conferences, networking)
- **Event RSVPs**: 7 registrations across different events
- **Forum Posts**: 4 posts with realistic content and engagement
- **Forum Comments**: 5 comments including nested replies
- **Notifications**: 6 notifications covering various event types
- **Engagement Scores**: 5 users with leaderboard rankings
- **Badges**: 6 achievement badges with different rarities
- **Knowledge Capsules**: 3 educational articles with rich content
- **Geographic Locations**: 5 major tech hubs with alumni distribution

## 🔍 Data Quality

All mock data includes:
- ✅ Realistic names, companies, and content
- ✅ Proper UUID format for IDs
- ✅ ISO 8601 timestamps
- ✅ Consistent relationships (foreign keys)
- ✅ Varied statuses and states
- ✅ Rich text content where appropriate
- ✅ Complete field coverage
- ✅ Edge cases (pinned posts, featured content, etc.)

## 🚀 Quick Start

1. **Import the data**:
   ```javascript
   import mockData from './mockdata.json';
   ```

2. **Use in components**:
   ```javascript
   const jobs = mockData.jobs;
   const events = mockData.events;
   ```

3. **Create a service layer** for easy switching later

4. **Test thoroughly** with the provided data

5. **Switch to real API** when backend is ready by updating the service layer

## 📚 Related Files

- `/app/mockdata.json` - The mock data file
- `/app/database_schema.sql` - Database schema definition
- `/app/BACKEND_WORKFLOW.md` - Backend API specifications
- `/app/FRONTEND_WORKFLOW.md` - Frontend development guide (updated with mock data reference)

## 🆘 Troubleshooting

### Issue: Data relationships don't match
**Solution**: Always check that referenced IDs exist:
```javascript
const profile = mockData.alumni_profiles.find(p => p.user_id === userId);
if (!profile) {
  console.error('Profile not found for user:', userId);
}
```

### Issue: Date parsing errors
**Solution**: Parse ISO 8601 strings to Date objects:
```javascript
const eventDate = new Date(event.start_date);
```

### Issue: Mock data not updating
**Solution**: If you modify mock data, restart your dev server to reload the JSON file.

## 📝 Notes

- Mock data is read-only in the JSON file
- For state management in your app, copy the data to component state
- Data structure matches the MySQL database schema exactly
- All passwords are hashed (not usable for actual login)
- UUIDs are properly formatted and unique
- Timestamps are in UTC timezone

---

**Happy Coding! 🚀**

For questions or issues, refer to the workflow documentation files.
