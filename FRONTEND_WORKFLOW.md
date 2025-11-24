# 🎨 FRONTEND WORKFLOW - Alumni Portal System

## Overview
This workflow outlines the complete frontend development for the Alumni Portal, divided into phases of 4-5 credits each. Each phase creates production-ready UI components with proper state management and API integration.

## 🗄️ Database & API Reference
**IMPORTANT**: The backend uses a MySQL 8.0 / MariaDB 10.5+ database. Complete schema is available in `/app/database_schema.sql`. 

### Mock Data for Development
**NEW**: A comprehensive mock data file is available at `/app/mockdata.json` for frontend development. This file contains:
- **Realistic sample data** covering all database tables and features
- **Consistent data structures** matching the backend API responses
- **Proper relationships** between entities (foreign keys, references)
- **Complete coverage** of all 10 development phases
- **Easy integration** - can be imported and used during development, then seamlessly switched to real backend

**Usage**: Import the mock data in your frontend code during development:
```javascript
import mockData from '../../../mockdata.json';

// Use mock data during development
const users = mockData.users;
const jobs = mockData.jobs;
const events = mockData.events;
// ... etc
```

**When to use mock data**:
- During initial frontend development before backend is ready
- For testing UI components independently
- For creating realistic demos and prototypes
- As reference for data structure and field names

**Switching to real backend**: Simply replace mock data imports with actual API calls. The data structure remains the same, ensuring smooth transition.

### API Integration Guidelines
1. **Base URL**: All API calls use the backend URL from environment variable `REACT_APP_BACKEND_URL`
2. **API Prefix**: All endpoints are prefixed with `/api` (e.g., `/api/auth/login`)
3. **Authentication**: JWT tokens stored in localStorage/cookies, sent in Authorization header
4. **Data Format**: 
   - Request/Response: JSON format
   - Date fields: ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
   - IDs: UUID format (36 characters with hyphens)
   - Arrays/Objects: Some fields use JSON format (skills, tags, metadata)
5. **Error Handling**: Consistent error response format with status codes
6. **Pagination**: List endpoints support `page`, `limit`, `sort`, and `filter` query parameters

### Key Data Models (Frontend Reference)
- **User**: id, email, role (student/alumni/recruiter/admin), is_verified
- **AlumniProfile**: id, user_id, name, photo_url, bio, headline, skills (array), batch_year, etc.
- **Job**: id, title, company, location, job_type, skills_required (array), status
- **Event**: id, title, event_type, start_date, is_virtual, max_attendees
- **MentorshipRequest**: id, student_id, mentor_id, status (pending/accepted/rejected)
- **Notification**: id, user_id, type, title, message, is_read

### API Endpoint Conventions
All endpoints follow RESTful conventions:
- `GET /api/resource` - List resources
- `GET /api/resource/{id}` - Get single resource
- `POST /api/resource` - Create resource
- `PUT /api/resource/{id}` - Update resource
- `DELETE /api/resource/{id}` - Delete resource

Refer to Backend Workflow for detailed endpoint specifications for each phase.

---

## 📋 PHASE 1: Core Layout & Authentication UI (4-5 credits)

### Objectives
- Create base application layout and navigation
- Implement authentication UI (Login, Register, Password Reset)
- Set up routing and protected routes
- Build responsive navigation system

### Tasks
1. **Project Setup & Configuration**
   - Set up routing structure with react-router-dom
   - Configure axios interceptors for API calls
   - Set up authentication context/state management
   - Configure protected route wrapper
   - **Import mock data**: Use `/app/mockdata.json` for development and testing

2. **Navigation Components**
   - Create MainNavbar component:
     - Logo and branding
     - Navigation links (Home, Directory, Jobs, Events, Mentorship)
     - User profile dropdown
     - Notification bell icon
     - Responsive mobile menu
   - Create Footer component with links
   - Create Sidebar component for dashboard layouts

3. **Authentication Pages**
   - **Login Page** (`/login`):
     - Email/password form
     - "Remember me" checkbox
     - "Forgot password?" link
     - Google Sign-in button (optional)
     - Link to register page
   - **Register Page** (`/register`):
     - Multi-step form (Account Info → Profile Type → Email Verification)
     - Role selection (Student/Alumni/Recruiter)
     - Terms & conditions checkbox
     - Email verification screen
   - **Forgot Password Page** (`/forgot-password`):
     - Email input form
     - Success message
   - **Reset Password Page** (`/reset-password/:token`):
     - New password form
     - Password strength indicator
     - Confirmation message

4. **UI Components (shadcn/ui)**
   - Button, Input, Label components
   - Card component for forms
   - Alert component for error messages
   - Loading spinner component
   - Form validation with react-hook-form + zod

5. **Authentication Logic**
   - JWT token storage in localStorage/cookies
   - Axios interceptors for token injection
   - Protected route component
   - Auto-redirect based on authentication status
   - Role-based route protection

### Testing Checkpoints
- Test complete registration flow
- Verify login with valid/invalid credentials
- Test password reset flow
- Verify protected routes redirect
- Test responsive navigation on mobile

### Deliverables
- Complete authentication UI
- Navigation system with user menu
- Protected route infrastructure
- Responsive layout components
- Form validation system

---

## 📋 PHASE 2: Dashboard & Profile Management UI (4-5 credits)

### Objectives
- Create role-specific dashboards
- Build comprehensive profile management interface
- Implement profile completion tracker
- Create profile viewing components

### Tasks
1. **Dashboard Layouts**
   - **Student Dashboard** (`/dashboard/student`):
     - Welcome section with profile completion
     - Quick actions (Find Mentor, Browse Jobs, Upcoming Events)
     - Recent applications status
     - Recommended mentors widget
     - Upcoming mentorship sessions
   - **Alumni Dashboard** (`/dashboard/alumni`):
     - Profile stats (views, connections)
     - Mentorship requests received
     - Posted jobs performance
     - Upcoming events
     - Engagement score display
   - **Recruiter Dashboard** (`/dashboard/recruiter`):
     - Posted jobs overview
     - Application statistics
     - Recent applications
     - Quick post job button
   - **Admin Dashboard** (`/dashboard/admin`):
     - Key metrics cards (users, jobs, events)
     - Pending verifications
     - Recent activity feed
     - Quick action buttons

2. **Profile Management Pages**
   - **Profile Creation/Edit** (`/profile/edit`):
     - Multi-section form:
       - Basic Info (photo upload, name, bio, headline)
       - Education (degree, institution, year, achievements)
       - Experience Timeline (company, role, duration, description)
       - Skills (tag input with autocomplete)
       - Social Links (LinkedIn, GitHub, Twitter, etc.)
       - CV Upload
     - Profile completion progress bar
     - Auto-save draft functionality
     - Image cropper for profile photo
   - **View Profile** (`/profile/:userId`):
     - Profile header with photo, name, headline
     - Verification badge display
     - Skills tags
     - Experience timeline visualization
     - Education section
     - Achievements showcase
     - Social links
     - Action buttons (Message, Request Mentorship, Download CV)

3. **Profile Components**
   - ProfileCard component (for lists and directories)
   - ProfileHeader component
   - ExperienceTimeline component
   - SkillTag component
   - ProfileCompletionMeter component
   - VerificationBadge component
   - ImageUploadWithPreview component

4. **State Management**
   - User profile context
   - Profile form state management
   - Image upload handling
   - Form validation

### Testing Checkpoints
- Test profile creation and updates
- Verify image upload functionality
- Test profile completion calculation
- Verify all dashboard widgets display correctly
- Test profile viewing from different user perspectives

### Deliverables
- Role-specific dashboards
- Complete profile management interface
- Profile viewing page
- Profile completion tracking
- Reusable profile components

---

## 📋 PHASE 3: Alumni Directory & Advanced Search UI (4-5 credits)

### Objectives
- Build searchable alumni directory
- Create advanced filtering system
- Implement pagination and sorting
- Design alumni list and grid views

### Tasks
1. **Alumni Directory Page** (`/directory`)
   - Search bar with live suggestions
   - Filter sidebar:
     - Company filter (multi-select dropdown)
     - Skills filter (tag selection)
     - Location filter (dropdown)
     - Batch/Year filter (slider or multi-select)
     - Job Role filter
     - "Verified Only" toggle
   - View toggle (Grid/List view)
   - Sort options (Name, Recent, Most Experienced)
   - Results count display
   - Pagination controls
   - "No results" empty state

2. **Search Components**
   - SearchBar component with debounced search
   - FilterSidebar component:
     - Collapsible filter sections
     - Clear filters button
     - Active filters display (chips)
   - AlumniCard component (grid view):
     - Profile photo
     - Name with verification badge
     - Current role and company
     - Skills tags (limited)
     - Location
     - Quick action buttons
   - AlumniListItem component (list view):
     - More detailed info in horizontal layout
     - Experience summary
     - Full skills display

3. **Advanced Features**
   - Filter persistence (URL params)
   - Infinite scroll or load more button
   - Skeleton loaders for loading states
   - Export results button (optional)
   - Save search functionality
   - Recent searches display

4. **Mobile Optimization**
   - Responsive filter sidebar (drawer on mobile)
   - Touch-friendly card design
   - Optimized grid for mobile screens

### Testing Checkpoints
- Test search with various queries
- Verify all filters work correctly
- Test combination of multiple filters
- Verify pagination works
- Test view switching (grid/list)
- Test mobile responsive design

### Deliverables
- Fully functional alumni directory
- Advanced search and filter system
- Grid and list view layouts
- Pagination system
- Mobile-responsive design

---

## 📋 PHASE 4: Jobs & Career Portal UI (4-5 credits)

### Objectives
- Create job listing and browsing interface
- Build job posting form
- Implement application submission flow
- Design recruiter job management dashboard

### Tasks
1. **Job Browsing Pages**
   - **Jobs Listing** (`/jobs`):
     - Search bar for job title/company
     - Filter sidebar:
       - Location filter
       - Job Type (Full-time, Part-time, Internship, Contract)
       - Experience Level
       - Skills required
       - Company filter
     - Sort options (Recent, Salary, Relevance)
     - Job cards with:
       - Company logo/placeholder
       - Job title and company
       - Location and job type
       - Skills required (tags)
       - Posted date
       - Salary range (if available)
       - "View Details" button
     - "No jobs" empty state
     - Pagination

   - **Job Details** (`/jobs/:jobId`):
     - Full job description
     - Company information
     - Requirements and qualifications
     - Skills required
     - Application deadline
     - Salary range
     - "Apply Now" button
     - Similar jobs section
     - Share job button

2. **Job Application Flow**
   - **Apply Modal/Page**:
     - Use profile info option
     - Upload custom CV option
     - Cover letter textarea
     - Additional questions (if any)
     - Submit button with loading state
     - Success confirmation modal
   - **My Applications** (`/jobs/my-applications`):
     - List of applied jobs
     - Application status badges (Pending, Reviewed, Shortlisted, Rejected)
     - Application date
     - Filter by status
     - View application details

3. **Job Posting (Alumni/Recruiter)**
   - **Post Job Form** (`/jobs/post`):
     - Multi-step form:
       - Basic Info (title, company, location)
       - Job Details (type, description, requirements)
       - Skills Required (tag input)
       - Application Settings (deadline, apply link)
     - Rich text editor for description
     - Preview before publish
     - Save as draft option
   - **Manage Jobs** (`/jobs/manage`):
     - Posted jobs list
     - Edit/Delete buttons
     - View applications button
     - Job status toggle (Active/Closed)
     - Job performance stats (views, applications)

4. **Recruiter Features**
   - **Applications Manager** (`/jobs/:jobId/applications`):
     - List of applicants
     - Filter by status
     - Applicant cards with:
       - Profile info
       - Applied date
       - Status dropdown
       - View profile/CV buttons
       - Action buttons (Shortlist, Reject)
     - Bulk actions
   - **Job Analytics**:
     - Views count
     - Applications count
     - Application rate chart
     - Applicant sources

5. **UI Components**
   - JobCard component
   - JobFilterSidebar component
   - ApplicationStatusBadge component
   - ApplicationModal component
   - RichTextEditor component (for job description)

### Testing Checkpoints
- Test job browsing and filtering
- Verify job application submission
- Test job posting flow
- Verify application management
- Test application status updates
- Test mobile responsiveness

### Deliverables
- Complete job browsing interface
- Job application system
- Job posting and management dashboard
- Application tracking interface
- Recruiter analytics dashboard

---

## 📋 PHASE 5: Mentorship System UI (4-5 credits)

### Objectives
- Build mentor discovery and browsing
- Create mentorship request flow
- Implement session scheduling interface
- Design mentorship dashboard

### Tasks
1. **Mentor Discovery**
   - **Find Mentors** (`/mentorship/find`):
     - Search bar for mentor name
     - Filter sidebar:
       - Expertise areas (multi-select)
       - Availability toggle
       - Rating filter
       - Experience level
     - Mentor cards with:
       - Profile photo
       - Name and headline
       - Expertise tags
       - Rating stars
       - Current mentees count
       - Availability badge
       - "Request Mentorship" button
     - Sort by (Rating, Experience, Availability)
     - Pagination

   - **Mentor Profile** (`/mentorship/mentor/:userId`):
     - Full profile view
     - Mentorship stats (sessions, rating, mentees)
     - Expertise areas
     - Mentorship approach/bio
     - Reviews/Feedback section
     - "Request Mentorship" button

2. **Mentorship Request Flow**
   - **Request Modal**:
     - Select mentor (if not pre-selected)
     - Request message textarea
     - Your goals/expectations
     - Preferred topics
     - Submit button
   - **Request Confirmation**:
     - Success message
     - Expected response time
     - View request status button

3. **Mentorship Dashboard**
   - **Student View** (`/mentorship/dashboard`):
     - Tabs:
       - Active Mentorships
       - Pending Requests
       - Past Mentorships
     - Active Mentorships:
       - Mentor card
       - Upcoming sessions list
       - Schedule new session button
       - Session history
       - Send message button
     - Pending Requests:
       - Request cards with status
       - Cancel request option
     - Session cards with:
       - Date and time
       - Duration
       - Meeting link (if available)
       - Add to calendar button
       - Session notes section

   - **Mentor View** (`/mentorship/mentor-dashboard`):
     - Tabs:
       - Mentorship Requests
       - Active Mentees
       - Session Schedule
       - Past Sessions
     - Request cards with:
       - Student profile preview
       - Request message
       - Accept/Reject buttons
     - Active Mentees list:
       - Mentee cards
       - Upcoming sessions
       - Session history
       - Send message button
     - Availability toggle (accept new requests)
     - Max mentees setting

4. **Session Management**
   - **Schedule Session Modal**:
     - Date and time picker
     - Duration selector
     - Meeting link input
     - Agenda/Notes textarea
     - Send calendar invite checkbox
   - **Session Details Page** (`/mentorship/sessions/:sessionId`):
     - Session information
     - Meeting link (Join button)
     - Session notes
     - Mark as completed button
     - Cancel/Reschedule button
   - **Feedback Modal** (post-session):
     - Rating stars
     - Feedback textarea
     - Submit button

5. **UI Components**
   - MentorCard component
   - SessionCard component
   - RequestCard component
   - SessionScheduler component
   - FeedbackForm component
   - RatingDisplay component

### Testing Checkpoints
- Test mentor search and filtering
- Verify mentorship request submission
- Test request acceptance/rejection
- Verify session scheduling
- Test session management features
- Test feedback submission

### Deliverables
- Mentor discovery interface
- Mentorship request system
- Session scheduling and management
- Dual-purpose mentorship dashboard (student/mentor)
- Feedback and rating system

---

## 📋 PHASE 6: Events & Community Forum UI (4-5 credits)

### Objectives
- Create event browsing and RSVP system
- Build community forum with discussions
- Implement event management interface
- Design social interaction features

### Tasks
1. **Events Section**
   - **Events Listing** (`/events`):
     - Toggle tabs: Upcoming / Past Events
     - Event cards with:
       - Event banner image
       - Title and date/time
       - Location (or "Virtual" badge)
       - Short description
       - RSVP button with attendee count
       - "View Details" button
     - Calendar view option
     - Filter by event type
     - Search events

   - **Event Details** (`/events/:eventId`):
     - Hero section with banner image
     - Event information:
       - Title, date, time
       - Location/meeting link
       - Full description
       - Organizer info
       - Attendee limit
     - RSVP button with status (Going/Maybe/Not Going)
     - Attendees list (avatars)
     - Add to calendar button
     - Share event button
     - Similar events section

2. **Event Management (Admin/Alumni)**
   - **Create Event** (`/events/create`):
     - Event form:
       - Title and description (rich text)
       - Event type (Workshop, Webinar, Meetup, Conference, etc.)
       - Date and time pickers
       - Location or Virtual toggle
       - Meeting link (if virtual)
       - Banner image upload
       - Registration deadline
       - Max attendees
     - Preview before publish
     - Save as draft option

   - **Manage Events** (`/events/manage`):
     - Created events list
     - Edit/Delete buttons
     - View attendees button
     - Event stats (views, RSVPs)
     - Event status toggle

   - **Event Attendees** (`/events/:eventId/attendees`):
     - Attendee list with profiles
     - RSVP status
     - Export attendee list
     - Send announcement to attendees

3. **Community Forum**
   - **Forum Home** (`/forum`):
     - Post composition box at top (for logged-in users)
     - Filter tabs: Recent / Popular / Following
     - Post cards with:
       - Author info (photo, name, role)
       - Post content (text, can include images)
       - Tags
       - Like and comment counts
       - Timestamp
       - "View Discussion" button
     - Tag filters (clickable tags)
     - Search posts
     - Infinite scroll

   - **Create Post Modal**:
     - Title (optional)
     - Post content (rich text editor)
     - Tags input (autocomplete)
     - Image upload (optional)
     - Post button

   - **Post Details** (`/forum/posts/:postId`):
     - Full post display
     - Like button with count
     - Share button
     - Edit/Delete (for author/admin)
     - Comments section:
       - Comment list
       - Reply functionality (nested)
       - Like comments
       - Edit/Delete comments
     - Comment input box at bottom
     - Related posts section

4. **Social Features**
   - Like/Unlike functionality
   - Comment threading
   - @mentions in posts/comments (optional)
   - Pinned posts (admin feature)
   - Report post/comment (moderation)

5. **UI Components**
   - EventCard component
   - EventCalendar component
   - RSVPButton component
   - PostCard component
   - CommentThread component
   - RichTextEditor component
   - TagInput component
   - ImageUploader component

### Testing Checkpoints
- Test event browsing and RSVP
- Verify event creation and management
- Test forum post creation
- Verify comment and reply functionality
- Test like functionality
- Test mobile responsiveness

### Deliverables
- Complete events system UI
- Event management dashboard
- Community forum with discussions
- Social interaction features
- Event calendar view

---

## 📋 PHASE 7: Notifications & Real-time Features UI (4-5 credits)

### Objectives
- Build notification center
- Implement real-time notification updates
- Create notification preferences
- Design toast notifications

### Tasks
1. **Notification Center**
   - **Notification Bell Icon** (in navbar):
     - Unread count badge
     - Dropdown notification preview (recent 5)
     - "View All" link

   - **Notifications Page** (`/notifications`):
     - Tabs: All / Unread / Read
     - Filter by type (dropdown):
       - Profile Updates
       - Mentorship
       - Job Applications
       - Events
       - Forum Activity
     - Notification cards with:
       - Icon based on type
       - Title and message
       - Timestamp (relative)
       - Link to related item
       - Mark as read/unread toggle
     - "Mark all as read" button
     - Pagination or infinite scroll
     - Delete notification option
     - Empty state for no notifications

2. **Notification Types & Designs**
   - Profile verification (approved/rejected)
   - Mentorship request received/accepted/rejected
   - Job application status update
   - New job matching your skills
   - Event reminder
   - Forum reply/comment
   - New mentorship session scheduled
   - Session reminder (upcoming)
   - Each type has distinct icon and styling

3. **Toast Notifications**
   - Real-time toast for new notifications
   - Success/Error toasts for actions
   - Position: top-right corner
   - Auto-dismiss after 5 seconds
   - Action buttons in toast (View, Dismiss)
   - Queue management for multiple toasts

4. **Notification Preferences**
   - **Settings Page** (`/settings/notifications`):
     - Email notifications toggle
     - Push notifications toggle (if PWA)
     - Per-category preferences:
       - Profile updates (email/push/off)
       - Mentorship updates
       - Job updates
       - Event reminders
       - Forum activity
     - Notification frequency (Instant/Daily Digest/Weekly)
     - Quiet hours setting
     - Save preferences button

5. **Real-time Updates (Optional)**
   - WebSocket connection setup
   - Real-time notification reception
   - Auto-update unread count
   - Sound notification (with user permission)

6. **UI Components**
   - NotificationBell component
   - NotificationDropdown component
   - NotificationCard component
   - ToastNotification component (using sonner)
   - NotificationPreferences component

### Testing Checkpoints
- Test notification display and marking as read
- Verify notification filtering
- Test toast notifications
- Verify preferences save correctly
- Test real-time updates (if implemented)
- Test notification linking

### Deliverables
- Notification center UI
- Real-time notification system
- Toast notification implementation
- Notification preferences interface
- Notification bell with badge

---

## 📋 PHASE 8: Admin Dashboard & Analytics UI (5 credits)

### Objectives
- Create comprehensive admin dashboard
- Build data visualization components
- Implement user and content management interfaces
- Design analytics pages with charts

### Tasks
1. **Admin Dashboard Home** (`/admin/dashboard`)
   - Key Metrics Cards:
     - Total users (with growth %)
     - Verified alumni count
     - Active jobs
     - Upcoming events
     - Pending verifications
     - Monthly signups chart (sparkline)
   - Charts Section:
     - User growth over time (line chart)
     - Users by role (pie chart)
     - Job postings trend (bar chart)
     - Event participation (line chart)
   - Recent Activity Feed:
     - New user registrations
     - Job postings
     - Event creation
     - Admin actions
   - Quick Actions:
     - Approve pending profiles
     - Moderate content
     - Create announcement
     - View reports

2. **User Management** (`/admin/users`)
   - User table with columns:
     - Profile photo
     - Name and email
     - Role badge
     - Verified status
     - Registration date
     - Last active
     - Actions (View, Edit, Suspend, Delete)
   - Search and filters:
     - Search by name/email
     - Filter by role
     - Filter by verification status
     - Filter by status (Active/Suspended)
   - Bulk actions
   - Export users button
   - User details modal:
     - Full profile view
     - Activity log
     - Role change dropdown
     - Suspend/Activate button
     - Delete with confirmation

3. **Verification Management** (`/admin/verifications`)
   - Pending verification requests table
   - Profile preview card
   - Verification checklist
   - Approve/Reject buttons with reason
   - History of verifications

4. **Content Moderation** (`/admin/moderation`)
   - Tabs: Flagged Posts / Flagged Comments / Jobs / Events
   - Content cards with:
     - Content preview
     - Author info
     - Flagged reason
     - Timestamp
     - View full content button
     - Approve/Remove buttons
   - Moderation history log

5. **Analytics Dashboard** (`/admin/analytics`)
   - **Overview Tab**:
     - Key metrics summary
     - Engagement rate
     - Platform growth chart
     - Active users chart

   - **Alumni Analytics Tab**:
     - Alumni by location (map visualization)
     - Top companies (horizontal bar chart)
     - Top skills (word cloud or bar chart)
     - Batch distribution (bar chart)
     - Alumni growth over time

   - **Jobs Analytics Tab**:
     - Total jobs posted
     - Application rate
     - Top job categories (pie chart)
     - Jobs by location
     - Time to hire stats

   - **Mentorship Analytics Tab**:
     - Total mentorships
     - Active mentors count
     - Sessions completed
     - Average rating
     - Mentor participation rate
     - Top expertise areas

   - **Events Analytics Tab**:
     - Total events hosted
     - Average attendance rate
     - Events by type
     - Participation trend

   - **Engagement Analytics Tab**:
     - Daily/Weekly/Monthly active users
     - Feature usage breakdown
     - User retention rate
     - Session duration average

6. **System Settings** (`/admin/settings`)
   - General settings
   - Email templates editor
   - System announcements
   - Maintenance mode toggle
   - Feature flags

7. **Chart Components** (using recharts or similar)
   - LineChart component
   - BarChart component
   - PieChart component
   - AreaChart component
   - Map visualization (optional)
   - Word cloud (optional)

### Testing Checkpoints
- Test all admin dashboard metrics
- Verify chart data accuracy
- Test user management operations
- Verify verification workflow
- Test content moderation
- Test analytics data display

### Deliverables
- Complete admin dashboard
- User management interface
- Verification management system
- Content moderation tools
- Analytics dashboard with charts
- System settings interface

---

## 📋 PHASE 9: Advanced Features & Visualizations UI (4-5 credits)

### Objectives
- Build skill graph visualization
- Create career path explorer
- Implement engagement leaderboard
- Design digital alumni ID card
- Build talent heatmap

### Tasks
1. **Skill Graph Visualization** (`/skills/graph`)
   - Interactive network graph showing:
     - Skills as nodes
     - Connections between related skills
     - Alumni count per skill (node size)
     - Industries connected to skills
   - Filter by industry
   - Search for specific skill
   - Click skill to see alumni with that skill
   - Zoom and pan controls
   - Legend explaining visualization
   - Use D3.js or vis.js for graph

2. **Career Path Explorer** (`/career/paths`)
   - **Search Interface**:
     - Select starting role/skill
     - Select target role/industry
   - **Visualization**:
     - Career path flow diagram
     - Common transitions (with % of alumni)
     - Timeline visualization
     - Success stories from alumni
   - **Alumni Stories**:
     - Filter alumni by career path
     - View transition details
     - Connect with alumni button

3. **Engagement Leaderboard** (`/leaderboard`)
   - **Leaderboard Table**:
     - Rank, Profile photo, Name, Score
     - Contributions breakdown
     - Trend indicator (up/down)
   - Filter by time period (This Week, Month, All Time)
   - Filter by role
   - User's own position highlight
   - **My Score Card**:
     - Current score
     - Rank position
     - Score breakdown:
       - Profile completeness points
       - Mentorship points
       - Forum activity points
       - Job applications points
       - Event participation points
     - Next achievement goal
   - **Achievements/Badges Section**:
     - Badge collection display
     - Locked badges (show requirements)
     - Badge rarity indicator

4. **Digital Alumni ID Card** (`/alumni-card`)
   - **ID Card Display**:
     - Professional card design
     - College logo
     - Profile photo
     - Name and batch year
     - Alumni ID number
     - QR code for verification
     - Verified badge
     - Card validity period
   - Download as image button
   - Share button
   - Print button
   - **Verify Card Page** (`/alumni-card/verify`):
     - QR code scanner (using device camera)
     - Manual ID verification input
     - Verification result display

5. **Talent & Opportunity Heatmap** (`/heatmap`)
   - **Map View**:
     - Interactive world/country map
     - Toggle: Talent Distribution / Job Opportunities
     - Heat intensity showing concentration
     - City/Region labels
   - **Filters**:
     - Filter by skill
     - Filter by industry
     - Filter by experience level
   - **Info Cards**:
     - Click region to see details:
       - Alumni count in region
       - Top companies
       - Top skills
       - Job opportunities count
   - **List View Toggle**:
     - Sortable table of locations
     - Alumni count, Jobs count

6. **Knowledge Capsules** (`/knowledge`)
   - **Capsules Feed**:
     - Card-based layout
     - Capsule cards with:
       - Author info
       - Title and category
       - Duration/Length indicator
       - Tags
       - Likes and views
       - Bookmark button
   - Filter by category and tags
   - Sort by (Recent, Popular, Trending)
   - **Capsule Details** (`/knowledge/:capsuleId`):
     - Full content display
     - Like and bookmark buttons
     - Comment section
     - Share button
     - Related capsules
   - **Create Capsule** (Alumni only):
     - Title and category
     - Rich text content editor
     - Tags input
     - Featured image upload
     - Publish button

7. **UI Components & Libraries**
   - NetworkGraph component (D3.js/vis.js)
   - HeatMap component (leaflet/mapbox)
   - FlowDiagram component
   - BadgeDisplay component
   - IDCard component
   - QRCodeScanner component

### Testing Checkpoints
- Test skill graph interactivity
- Verify career path visualization
- Test leaderboard display and filtering
- Verify ID card generation
- Test heatmap data display
- Test knowledge capsules CRUD

### Deliverables
- Interactive skill graph
- Career path visualization tool
- Engagement leaderboard with badges
- Digital ID card system
- Talent heatmap visualization
- Knowledge capsules platform

---

## 📋 PHASE 10: Polish, Optimization & Responsive Design (4-5 credits)

### Objectives
- Ensure full mobile responsiveness
- Implement loading states and animations
- Optimize performance
- Add accessibility features
- Create error boundaries and empty states

### Tasks
1. **Mobile Responsiveness**
   - Review and fix all pages for mobile devices
   - Test on different screen sizes (320px to 768px)
   - Implement responsive navigation (hamburger menu)
   - Optimize touch interactions
   - Ensure proper spacing and typography on mobile
   - Test forms on mobile devices
   - Optimize image sizes for mobile

2. **Loading States & Skeletons**
   - Create skeleton loaders for:
     - Profile cards
     - Job listings
     - Event cards
     - Tables
     - Dashboard widgets
   - Loading spinners for buttons
   - Progress bars for file uploads
   - Shimmer effects for loading content
   - Disable interactions during loading

3. **Animations & Transitions**
   - Page transition animations
   - Modal slide-in/fade-in animations
   - Hover effects on cards and buttons
   - List item animations (stagger)
   - Smooth scroll behavior
   - Loading progress animations
   - Success animations (checkmarks, confetti)
   - Use framer-motion or similar library

4. **Empty States**
   - Design empty states for:
     - No search results
     - No jobs available
     - No events
     - No notifications
     - Empty dashboard widgets
     - No posts in forum
   - Include helpful messaging
   - Call-to-action buttons
   - Illustrations or icons

5. **Error Handling UI**
   - Global error boundary component
   - 404 Page Not Found
   - 500 Server Error page
   - Network error messages
   - Form validation errors (inline)
   - Toast notifications for errors
   - Retry mechanisms for failed requests
   - Offline mode detection

6. **Performance Optimization**
   - Lazy loading for routes
   - Image lazy loading
   - Code splitting
   - Memoization of expensive components
   - Optimize bundle size
   - Remove unused dependencies
   - Implement virtual scrolling for long lists
   - Debounce search inputs
   - Optimize API calls (caching, deduplication)

7. **Accessibility (a11y)**
   - Semantic HTML elements
   - ARIA labels for interactive elements
   - Keyboard navigation support
   - Focus indicators
   - Alt text for images
   - Color contrast compliance (WCAG)
   - Screen reader compatibility
   - Skip to main content link

8. **User Experience Enhancements**
   - Confirm dialogs for destructive actions
   - Auto-save for long forms
   - Undo actions (where applicable)
   - Keyboard shortcuts (optional)
   - Breadcrumb navigation
   - Back button handling
   - Search history
   - Recently viewed items

9. **Theme & Styling**
   - Consistent color scheme
   - Typography hierarchy
   - Spacing system consistency
   - Component styling consistency
   - Dark mode support (optional)
   - Print stylesheets (for ID cards, profiles)

10. **Testing & QA**
    - Cross-browser testing (Chrome, Firefox, Safari, Edge)
    - Mobile device testing (iOS, Android)
    - Accessibility testing
    - Performance testing (Lighthouse)
    - User acceptance testing
    - Fix all console warnings/errors

### Testing Checkpoints
- Test on multiple devices and browsers
- Verify all loading states work
- Test error scenarios
- Verify accessibility with screen reader
- Run Lighthouse performance audit
- Test all animations and transitions

### Deliverables
- Fully responsive application
- Loading states for all async operations
- Smooth animations and transitions
- Comprehensive error handling
- Accessibility improvements
- Performance optimizations
- Empty state designs
- Cross-browser compatibility

---

## 🎯 Summary

**Total Phases: 10**
**Total Estimated Credits: 45-50 credits**

### Phase Overview:
1. ✅ Core Layout & Authentication (4-5 credits)
2. ✅ Dashboard & Profile Management (4-5 credits)
3. ✅ Alumni Directory & Search (4-5 credits)
4. ✅ Jobs & Career Portal (4-5 credits)
5. ✅ Mentorship System (4-5 credits)
6. ✅ Events & Community Forum (4-5 credits)
7. ✅ Notifications & Real-time (4-5 credits)
8. ✅ Admin Dashboard & Analytics (5 credits)
9. ✅ Advanced Features & Visualizations (4-5 credits)
10. ✅ Polish & Optimization (4-5 credits)

### Execution Strategy:
- Each phase creates a complete, usable feature
- Can work in parallel with backend phases
- Regular UI reviews and user feedback
- Incremental integration with backend APIs
- Continuous responsive design testing

### Dependencies:
- Phase 1 must complete before all others
- Phases 2-6 can run somewhat in parallel
- Phase 7 requires Phase 1 completion
- Phase 8 requires most other phases
- Phase 9 requires Phases 2-5
- Phase 10 is continuous throughout but finalized at end

### Tech Stack:
- React 19 with Hooks
- React Router DOM for routing
- Axios for API calls
- Tailwind CSS for styling
- shadcn/ui for components
- Recharts for data visualization
- D3.js/vis.js for graph visualizations
- React Hook Form + Zod for form validation
- Framer Motion for animations
- Sonner for toast notifications

---

**Note**: Each phase includes comprehensive testing, responsive design, and accessibility considerations to ensure production-ready UI/UX quality. All components are built with reusability and maintainability in mind.
