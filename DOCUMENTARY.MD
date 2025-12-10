# AlumUnity – Smart Intelligence Alumni Platform

## 1. Elevator Pitch

**AlumUnity** is a smart alumni–student–recruiter platform that connects your entire academic ecosystem in one place.  
It combines alumni directory, career opportunities, mentorship, events, community discussions, and advanced analytics into a single, role‑based web application.

Universities and institutions can use AlumUnity to:
- Help students discover alumni, mentors, and jobs.
- Give alumni a structured way to give back through mentoring, hiring, and knowledge sharing.
- Allow recruiters to efficiently discover talent.
- Provide administrators with powerful tools to manage users, content, datasets, and AI‑powered features.

---

## 2. Problem & Solution Overview

### 2.1 The Problem

Most institutions face scattered, under‑utilized alumni networks:
- Alumni are not centralized in a single, searchable system.
- Students struggle to find relevant mentors and referrals.
- Recruiters cannot easily explore alumni data or open roles to the community.
- Admins lack a unified view of engagement, events, and outcomes.
- Advanced analytics and AI‑driven insights (skill gaps, career paths, recommendations) are rarely used.

### 2.2 The Solution

**AlumUnity** provides an end‑to‑end platform that:

- Brings **students, alumni, recruiters, and admins** onto a single, role‑aware platform.
- Offers **structured modules** for profiles, jobs, mentorship, events, forums, notifications, and analytics.
- Uses a **modern web stack** (React + FastAPI + MySQL + AI/ML tooling) to support scalable, data‑driven features.
- Includes **advanced and AI‑ready modules** such as skill graphs, career paths, leaderboards, talent heatmaps, digital alumni cards, and knowledge capsules.

---

## 3. Target Users & Roles

AlumUnity is built around four main roles, enforced by role‑based access control (RBAC):

- **Student**
  - Discover alumni and mentors.
  - Explore and apply to jobs.
  - Join events and participate in community discussions.
  - Receive personalized notifications and insights.

- **Alumni**
  - Maintain a rich professional profile.
  - Post jobs and opportunities.
  - Mentor students through structured mentorship flows.
  - Organize or participate in events.
  - Share expertise using knowledge capsules and other advanced modules.

- **Recruiter**
  - Post job openings and manage applications.
  - Search and filter alumni/student profiles.
  - Track hiring pipelines and communicate with candidates.

- **Admin**
  - Manage users, roles, and verifications.
  - Moderate content across jobs, forum, events, and knowledge modules.
  - Configure notification rules and system settings.
  - Upload datasets and monitor AI/advanced systems.
  - View platform‑wide analytics and engagement metrics.

---

## 4. What Is Implemented Today (High-Level)

At a high level, AlumUnity currently includes:

- A **fully implemented backend** using FastAPI and MySQL, organized into modular route groups:
  - Authentication, profiles, admin, jobs, applications, recruiter, mentorship, events, forum, notifications, privacy, analytics, admin dashboards, matching, recommendations, engagement, knowledge capsules, skill graph, career paths, alumni card, heatmap, datasets, and capsule ranking.

- A **feature‑rich React frontend** with:
  - Separate dashboards for student, alumni, recruiter, and admin.
  - Dedicated pages for profiles, directory, jobs, mentorship, events, forum, notifications, advanced features, admin tools, datasets, and AI monitoring.
  - A flexible data layer that can use live backend APIs or mock data for demos.

The sections below break this down by module, clearly separating **Currently Implemented** features from **Future Enhancements** we plan to build on top.

---

## 5. Core Modules & Features

### 5.1 Authentication & Onboarding

**Currently implemented**

- **Email/password authentication** with dedicated pages for:
  - `Login`
  - `Register`
  - `Forgot password`
  - `Reset password`
- **Protected routes** on the frontend using a `ProtectedRoute` component.
- **Role‑based routing**:
  - `/dashboard` automatically redirects to the correct dashboard:
    - `/dashboard/student`
    - `/dashboard/alumni`
    - `/dashboard/recruiter`
    - `/dashboard/admin`
- **Client‑side session handling**:
  - User object (including role) stored client‑side (e.g., localStorage) for routing decisions.
- Organized **auth API service layer** to call backend auth endpoints.

**Future enhancements**

- Add/expand **social login providers** (e.g., Google OAuth) where required.
- Strengthen **multi‑factor authentication** and device/session management.
- Add **organization‑level onboarding flows** (e.g., invite‑only access for specific institutions).

---

### 5.2 Role-Based Dashboards

**Currently implemented**

- **Student Dashboard**
  - Central place to see key information relevant to students (e.g., recommended jobs, mentorship sessions, events, notifications).
  - Role‑restricted route: `/dashboard/student`.

- **Alumni Dashboard**
  - Snapshot of alumni‑specific actions (e.g., posted jobs, mentorship commitments, events, knowledge contributions).
  - Role‑restricted route: `/dashboard/alumni`.

- **Recruiter Dashboard**
  - Focused on open positions and candidate pipelines.
  - Role‑restricted route: `/dashboard/recruiter`.

- **Admin Dashboard**
  - High‑level view of platform activity: users, content, jobs, events, AI modules, and system health.
  - Role‑restricted route: `/dashboard/admin`.

**Future enhancements**

- Personalizable **widgets/cards** on each dashboard.
- Deeper **analytics visualizations** for each role (e.g., historical graphs for recruiters, mentoring impact for alumni).
- Cross‑role insights (e.g., how alumni engagement drives student outcomes).

---

### 5.3 Profile Management & Alumni Directory

**Currently implemented**

- **Profile Management**
  - Authenticated users can view and edit their profile via `/profile`.
  - Detailed profile pages for other users via `/profile/:userId`.
  - Support for:
    - Personal details and contact links.
    - Education and work experience.
    - Skills and social profiles (e.g., LinkedIn), aligned with backend entities.

- **Alumni Directory**
  - Dedicated directory page at `/directory`.
  - Structured list/grid of profiles.
  - Search and filtering logic, backed by directory API services (with optional mock data mode).
  - Profile detail pages linked from directory results.

**Future enhancements**

- More advanced search filters (e.g., skill tags, location, graduation batch, domain).
- “Similar profiles” and **AI‑powered recommendations** based on skill overlap and career paths.
- Export options for admins (e.g., CSV/Excel downloads for institutional reporting).

---

### 5.4 Job Portal & Applications

**Currently implemented**

- **Job Browsing & Details**
  - `/jobs` – main job listings page.
  - `/jobs/:jobId` – job detail page showing full description and context.

- **Job Applications (Candidate Side)**
  - `/jobs/my-applications` – page to track a user’s job applications.
  - Application flows integrated with job detail pages and job application APIs.

- **Job Management (Recruiter / Admin Side)**
  - `/jobs/post` – create/post new job listings.
  - `/jobs/edit/:jobId` – edit existing postings.
  - `/jobs/manage` – manage jobs posted by the current user.
  - `/jobs/:jobId/applications` and `/jobs/applications/:jobId` – manage and review applications for a specific job.

- **Backend APIs**
  - Job‑related FastAPI routes covering:
    - CRUD operations on jobs.
    - Applying to jobs.
    - Listing applications by job.

**Future enhancements**

- More granular **application stages** (screening, interview, offer, hired).
- In‑app messaging between candidate and recruiter.
- Deeper **analytics on job performance** (views, click‑throughs, conversion rates).
- Integration with external job boards or ATS as needed.

---

### 5.5 Mentorship System

**Currently implemented**

- **Mentor Discovery & Profiles**
  - `/mentorship` redirects to `/mentorship/find`.
  - `/mentorship/find` – find mentors, with search/filtering options.
  - `/mentorship/mentor/:userId` – view detailed mentor profile.

- **Mentorship Management**
  - `/mentorship/dashboard` – overview of a user’s mentorship activity (sessions, requests, etc.).
  - `/mentorship/manage` – manage mentor/mentee relationships and session requests.
  - `/mentorship/sessions/:sessionId` – detailed view of a single mentorship session (status, notes, actions).

- **Backend Support**
  - Mentorship routes for:
    - Creating and updating mentorship sessions.
    - Linking mentors with mentees.
    - Managing session status and feedback.

**Future enhancements**

- Integrations with **calendar tools** (Google Calendar, Outlook) for scheduling.
- Richer feedback loops (ratings, testimonials, structured feedback forms).
- Optional integration points for **video meeting platforms** (e.g., links to Zoom/Meet).

---

### 5.6 Events Management

**Currently implemented**

- **Events Lifecycle**
  - `/events` – browse upcoming and past events.
  - `/events/:eventId` – event detail view.
  - `/events/create` – create new events (for authorized roles).
  - `/events/manage` – manage and edit events created by the user.
  - `/events/:eventId/attendees` – view and manage attendee lists.

- **Backend Support**
  - Event routes covering:
    - Creation and update of events.
    - RSVP handling and attendee tracking.

**Future enhancements**

- Calendar‑style views (month/week/day) integrated into the UI.
- Event reminders and post‑event follow‑ups (feedback, recordings, resources).
- Ticketing/invitation flows for exclusive events.

---

### 5.7 Community Forum

**Currently implemented**

- **Discussion Boards**
  - `/forum` – main forum page with threads/posts.
  - `/forum/posts/:postId` – individual post detail page with comments.
  - `/forum/manage` – manage posts (especially for moderators/admin).

- **Backend Support**
  - Forum and comment routes for:
    - Creating and listing posts.
    - Commenting and moderating as needed.

**Future enhancements**

- Topic categories and tags (e.g., careers, higher studies, entrepreneurship).
- Upvote/downvote and reputation systems tied to the **leaderboard**.
- Rich media support (images, links, attachments) with moderation tools.

---

### 5.8 Notifications & Preferences

**Currently implemented**

- **Notification Center**
  - `/notifications` – unified notification page where users can see updates across modules (jobs, mentorship, events, forum, etc.).
- **Notification Settings**
  - `/settings/notifications` – user‑level control over which notifications they receive and how often.
- **Backend Support**
  - Notification routes for sending and fetching notifications, tied to actions across modules.

**Future enhancements**

- Email and mobile push integrations for out‑of‑app notifications.
- More granular notification rules (e.g., only jobs matching specific skills or locations).
- Digest emails summarizing weekly or monthly activity.

---

### 5.9 Advanced & AI-Ready Features

The platform includes several **advanced modules** that leverage or are prepared to leverage AI/ML and rich visualizations.

**Currently implemented (UI + API support)**

- **Skill Graph**
  - Route: `/skills/graph`.
  - Visual exploration of skills and their relationships across users.
  - Backed by dedicated backend routes and AI/ML libraries (e.g., sentence‑transformers, FAISS) to support similarity and graph‑like queries.

- **Career Paths & Insights**
  - `/career/paths` – explore typical career trajectories.
  - `/career/insights` – career insights for students and alumni.
  - Backend routes for career paths and preferences, built on ML‑ready stack.

- **Leaderboard**
  - `/leaderboard` – gamified ranking of users based on contributions and engagement.
  - Ties into multiple modules (forum, events, mentorship, knowledge contributions) as scoring sources.

- **Digital Alumni Card**
  - `/alumni-card` – digital alumni card module.
  - Backend support for generating/verifying card data, with dependencies for QR code and PDF/image generation.

- **Talent Heatmap**
  - `/heatmap` – geographic visualization of alumni and talent distribution.
  - Backend routes for aggregating location‑based data.

- **Knowledge Capsules**
  - `/knowledge` – browse knowledge capsules (short, focused pieces of expertise).
  - `/knowledge/create` – create and publish new capsules (for authorized roles).
  - `/knowledge/:capsuleId` – detailed view of a single capsule.
  - `/knowledge/learning-path` – build or view structured learning paths composed of capsules.
  - Backend routes for capsules and a **capsule ranking engine** to prioritize valuable content.

**Future enhancements**

- Deeper use of **AI models** for:
  - Personalized recommendations (mentors, jobs, capsules, events).
  - Career predictions and skill gap analysis.
  - Capsule ranking and learning path generation.
- More advanced visual analytics (e.g., interactive time‑series dashboards).
- Explanability features for AI‑derived insights (why a match/recommendation was shown).

---

### 5.10 Admin Panel & Governance

**Currently implemented**

Admin‑only routes, all protected by role checks (`allowedRoles={['admin']}`):

- **User & Verification Management**
  - `/admin/users` – manage user accounts and roles.
  - `/admin/verifications` – handle verification workflows (e.g., confirming alumni status).

- **Content Moderation**
  - `/admin/moderation` – moderate posts, events, and other user‑generated content.
  - `/admin/jobs`, `/admin/events`, `/admin/mentorship` – admin views into each respective module.

- **Analytics & Settings**
  - `/admin/analytics` – view system‑wide metrics (engagement, usage, growth).
  - `/admin/settings` – manage global configuration and platform settings.

- **Badges, Notifications & Audit**
  - `/admin/badges` – manage badges and recognition rules.
  - `/admin/notifications` – configure system‑level notification campaigns or templates.
  - `/admin/audit-logs` – view audit logs of critical actions (for transparency and security).

- **File Uploads & Email Queue**
  - `/admin/file-uploads` – manage uploaded files.
  - `/admin/email-queue` – monitor queued emails and status.

- **Digital Card Verification**
  - `/admin/card-verifications` – review and validate digital alumni cards.

- **AI System Health Monitoring**
  - `/admin/ai/monitor` – dedicated page to monitor AI/ML components (e.g., models, queues, embeddings, indexing jobs).

**Future enhancements**

- Organization‑level multi‑tenant management (e.g., multiple institutions on one platform).
- Configurable **role templates** and custom permissions per organization.
- More advanced audit tooling (filters, exports, anomaly alerts).

---

### 5.11 Dataset Upload & AI Data Management

**Currently implemented**

Admin‑only dataset routes (Phase 11.1) to feed advanced and AI features:

- `/admin/datasets/upload` – upload alumni/career datasets.
- `/admin/datasets/upload/:uploadId/progress` – track ingestion progress.
- `/admin/datasets/upload/:uploadId/report` – see results, issues, and summaries.
- `/admin/datasets/history` – review historical dataset uploads.

Backend has:
- Dataset routes for ingesting and validating data.
- Supporting libraries for spreadsheets (e.g., `openpyxl`, `xlrd`) and data processing (`pandas`, `numpy`).

**Future enhancements**

- Automated schema validation and data quality scoring.
- Incremental updates and scheduled syncs from external SIS/HR systems.
- More powerful dataset analytics and lineage tracking.

---

## 6. User Flows

### 6.1 Student Flow

1. **Sign Up & Login**
   - Register using email/password on the `Register` page.
   - Log in via `Login` and land on the **Student Dashboard**.

2. **Complete Profile**
   - Navigate to `/profile` to add education, experience, skills, and links.
   - Save changes and view your public profile at `/profile/:userId`.

3. **Discover Alumni & Mentors**
   - Go to `/directory` to browse alumni profiles.
   - Use search/filters to find relevant alumni.
   - Visit mentor profiles at `/mentorship/mentor/:userId` from the mentor finder.

4. **Apply for Jobs**
   - Visit `/jobs` to explore open roles.
   - Open a job detail page at `/jobs/:jobId`.
   - Apply for jobs and then track applications at `/jobs/my-applications`.

5. **Join Mentorship Programs**
   - Browse mentors at `/mentorship/find`.
   - Request sessions and manage them via `/mentorship/dashboard` and `/mentorship/sessions/:sessionId`.

6. **Attend Events**
   - Explore events at `/events`.
   - View specific details at `/events/:eventId`.
   - RSVP and check your attendance status via `/events/:eventId/attendees` (where relevant).

7. **Engage with the Community**
   - Join discussions in `/forum` and individual threads at `/forum/posts/:postId`.

8. **Stay Informed**
   - Watch updates in `/notifications`.
   - Customize notification preferences at `/settings/notifications`.

9. **Explore Advanced Insights**
   - Visit `/career/insights` for career‑related insights.
   - Explore `/skills/graph`, `/career/paths`, `/leaderboard`, `/knowledge`, and `/knowledge/learning-path` as they are made available.

---

### 6.2 Alumni Flow

1. **Login & Alumni Dashboard**
   - Log in and be redirected to `/dashboard/alumni`.

2. **Maintain Your Profile**
   - Update current role, company, skills, and achievements at `/profile`.
   - Use your profile to make it easier for students and recruiters to find you.

3. **Share Opportunities**
   - Post new job opportunities via `/jobs/post`.
   - Manage your postings in `/jobs/manage` and view applications at `/jobs/:jobId/applications`.

4. **Mentor Students**
   - Opt in as a mentor and appear in `/mentorship/find`.
   - Accept/manage mentorship sessions via `/mentorship/manage` and `/mentorship/dashboard`.

5. **Participate in Events**
   - Create and manage events if authorized, via `/events/create` and `/events/manage`.
   - Join events relevant to your expertise or interests.

6. **Contribute Knowledge**
   - Create knowledge capsules at `/knowledge/create`.
   - Share structured learning content that appears on `/knowledge` and can be part of `/knowledge/learning-path`.

7. **Use Advanced Features**
   - Access your **Digital Alumni Card** at `/alumni-card`.
   - Explore **leaderboards**, **skill graphs**, **career paths**, and **talent heatmaps** (where relevant to your role).

---

### 6.3 Recruiter Flow

1. **Login & Recruiter Dashboard**
   - Log in and be routed to `/dashboard/recruiter`.

2. **Create Job Listings**
   - Post openings via `/jobs/post`.
   - Edit or close positions using `/jobs/edit/:jobId`.

3. **Manage Applications**
   - Track applications for each job at:
     - `/jobs/:jobId/applications`
     - `/jobs/applications/:jobId`
   - Review candidate profiles and move them through your internal process.

4. **Search Talent**
   - Use `/directory` to search alumni and student profiles.
   - Open `/profile/:userId` to see detailed candidate information.

5. **Engage with the Community (Optional)**
   - Participate in forum discussions at `/forum` and events at `/events` to build employer brand.

---

### 6.4 Admin Flow

1. **Admin Login & Dashboard**
   - Log in as an admin and access `/dashboard/admin` to see an overview of system activity.

2. **Manage Users & Roles**
   - Use `/admin/users` to manage accounts, roles, and access levels.
   - Handle verification requests via `/admin/verifications`.

3. **Moderate Content**
   - Monitor and moderate posts, events, and jobs via:
     - `/admin/moderation`
     - `/admin/jobs`
     - `/admin/events`
     - `/admin/mentorship`

4. **Configure Platform Settings**
   - Adjust global configs at `/admin/settings`.
   - Manage notifications and campaigns at `/admin/notifications`.

5. **Oversee Advanced Modules**
   - Configure badges at `/admin/badges`.
   - Review audit logs at `/admin/audit-logs`.
   - Manage file uploads at `/admin/file-uploads`.
   - Oversee email queues at `/admin/email-queue`.
   - Handle digital alumni card verifications at `/admin/card-verifications`.

6. **Manage Datasets & AI Health**
   - Upload and track datasets via:
     - `/admin/datasets/upload`
     - `/admin/datasets/upload/:uploadId/progress`
     - `/admin/datasets/upload/:uploadId/report`
     - `/admin/datasets/history`
   - Monitor AI system health at `/admin/ai/monitor`.

7. **View Analytics**
   - Use `/admin/analytics` for high‑level analytics on usage, content, and engagement.

---

## 7. Tech Stack Overview

### 7.1 Frontend

- **Framework:** React (v19)
- **Routing:** React Router DOM (v7) with nested, protected routes.
- **Styling:**
  - Tailwind CSS
  - Custom CSS (`index.css`, `App.css`) for global behavior and accessibility
- **UI Library:**
  - `shadcn/ui` components + Radix UI primitives (e.g., dialogs, dropdowns, tabs, toasts).
- **State & Forms:**
  - React Context for auth and global state.
  - `react-hook-form` + `zod` for form management and validation.
- **Charts & Visualizations:**
  - Recharts, D3 (used for analytics, skill graphs, and other visual modules).
- **UX Enhancements:**
  - `framer-motion` for animations.
  - Custom hooks (e.g., `useDebounce`, `useMediaQuery`, `useConfirmation`).
- **Notifications:**
  - `sonner` for in‑app toast notifications.
- **HTTP Client & Services:**
  - Axios‑based API service layer, with:
    - Live API clients for the FastAPI backend.
    - Mock service implementations for safe demos and offline development.
- **Tooling:**
  - Yarn as package manager.
  - ESLint + Prettier‑compatible setup for consistent code quality.

### 7.2 Backend

- **Framework:** FastAPI (Python).
- **Database:** MySQL.
- **ORM / DB Access:** Async MySQL drivers (`aiomysql`, `PyMySQL`).
- **Authentication & Security:**
  - JWT‑based auth (via `python-jose` / `pyjwt`).
  - `bcrypt` and `passlib` for hashing.
- **AI/ML & Data:**
  - `scikit-learn`, `sentence-transformers`, `faiss-cpu` for embeddings and similarity search.
  - `pandas`, `numpy`, `scipy` for data processing.
- **Caching & Queueing:**
  - Redis (`redis`, `aioredis`) for caching/queues.
  - Celery + Redis as background task infrastructure (with Flower for monitoring).
- **File & Media Handling:**
  - `qrcode`, `Pillow`, `reportlab` for generating QR codes and documents (e.g., digital alumni cards).
- **Email & Integrations:**
  - `sendgrid` for email delivery support.
- **Monitoring & Logging:**
  - `prometheus-client`, `python-json-logger`, `sentry-sdk` for metrics and logging.

### 7.3 Data & Infrastructure Capabilities

- Designed for:
  - **Structured relational schema** (users, profiles, jobs, applications, events, mentorship, forum, notifications, skills, etc.).
  - **Async I/O** for scalability.
  - **Environment‑based configuration** (database, secrets, CORS, etc.).

---

## 8. Roadmap & Future Directions

All items below are **planned / future enhancements**, not claims about the current state. They build on top of the existing modules and architecture.

- **Deeper AI‑Driven Personalization**
  - Richer mentor/job/event recommendations.
  - Automated learning paths from knowledge capsules.
  - Career predictions and skill gap analysis powered by embeddings and ML models.

- **Mobile and Multi-Platform Experience**
  - Mobile‑optimized flows beyond current responsive web design.
  - Potential native or hybrid mobile apps using the same API layer.

- **Institution-Level Configurability**
  - Whitelabel support for multiple institutions.
  - Custom branding, domains, and role policies per institution.

- **Richer Analytics**
  - Longitudinal analytics for alumni engagement.
  - Impact analytics for mentorship and events on student outcomes.
  - Admin dashboards for funding, recruitment, and partnership reporting.

- **Integrations**
  - Integration with SIS/ERP systems for importing student/alumni data.
  - Integration with external job boards, ATS, and email marketing tools.

- **Compliance & Governance**
  - Stronger audit trails and policy enforcement.
  - Additional privacy and consent management features.

---

## 9. Summary

**AlumUnity – Smart Intelligence Alumni Platform** is a full‑stack, role‑based web application that:

- Connects **students, alumni, recruiters, and admins** on one platform.
- Offers **core modules** for profiles, directory, jobs, mentorship, events, forum, notifications, and admin tools.
- Includes **advanced, AI‑ready modules** such as skill graphs, career paths, leaderboards, digital alumni cards, talent heatmaps, and knowledge capsules.
- Is built on a **modern, scalable tech stack** (React + FastAPI + MySQL + Redis + AI/ML libraries).
- Provides a solid foundation for future AI‑driven and institution‑scale innovation.

This document separates **currently implemented** features from **future enhancements**, so it can be confidently shared with investors and potential customers without making unsupported claims.



