# 🎓 AlumUnity
// $env:Path += ";C:\Users\admin\AppData\Roaming\npm"
<div align="center">

![AlumUnity](https://img.shields.io/badge/AlumUnity-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![License](https://img.shields.io/badge/License-Private-lightgrey?style=for-the-badge)

**A comprehensive platform connecting alumni, students, recruiters, and administrators for networking, mentorship, and career development.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [User Roles](#-user-roles)
- [Core Modules](#-core-modules)
- [Advanced Features](#-advanced-features)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Screenshots](#-screenshots)
- [Documentation](#-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🌟 Overview

AlumUnity is a full-stack web application designed to foster meaningful connections within academic communities. It provides a comprehensive ecosystem where alumni can share opportunities, students can seek mentorship, recruiters can find talent, and administrators can manage the entire platform efficiently.

### Key Highlights

- **42+ Pages** with role-specific dashboards
- **90+ Reusable Components** built with React and shadcn/ui
- **Notification System** designed for timely updates
- **Advanced Analytics** with interactive data visualizations
- **Responsive Design** optimized for mobile, tablet, and desktop
- **Accessibility-focused** design aligned with WCAG 2.1 AA best practices
- **Mock Data Services** for rapid development and testing

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based secure authentication
- Role-based access control (RBAC)
- Google OAuth integration (UI ready)
- Password reset and email verification
- Persistent login sessions

### 👤 Profile Management
- Comprehensive user profiles with work experience, education, and skills
- Profile photo upload and social media links
- Verification badges for verified alumni
- Privacy settings and profile completion tracking

### 🔍 Alumni Directory
- Advanced search with multiple filters (name, company, graduation year, skills)
- Grid and list view options
- Sorting and pagination
- Export functionality

### 💼 Job Portal
- Job posting and application management
- Advanced filtering (job type, location, salary range, experience level)
- Application tracking system
- Recruiter dashboard for managing applications
- Job recommendations based on profile

### 🤝 Mentorship System
- Find and connect with mentors by expertise
- Session scheduling and management
- Video call integration (UI ready)
- Progress tracking and feedback system

### 📅 Events Management
- Create and manage events (networking, workshops, career fairs)
- RSVP functionality with capacity limits
- Calendar integration
- Attendee management and check-in system

### 💬 Community Forum
- Discussion threads with categories
- Upvote/downvote system
- Nested comments and replies
- Rich media support

### 🔔 Notifications
- In-app notification system for user updates
- Categorized notifications (jobs, mentorship, events, forum)
- Customizable notification preferences
- Email and push notifications (designed, implementation can be extended)

### 🛡️ Admin Panel
- User management and verification
- Content moderation tools
- Comprehensive analytics dashboard
- System settings and configuration

### 🚀 Advanced Features
- **Skill Graph**: Interactive network visualization of skills across the alumni network
- **Career Paths**: Data-driven career trajectory visualization
- **Leaderboard**: Gamified engagement system with badges and points
- **Digital Alumni Card**: QR code-enabled digital ID cards
- **Talent Heatmap**: Geographic distribution of alumni
- **Knowledge Capsules**: Micro-learning platform for sharing expertise

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v3.4
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context API
- **Charts**: Recharts v3.5
- **Animations**: Framer Motion v12
- **HTTP Client**: Axios v1.8
- **Notifications**: Sonner v2
- **Date Handling**: date-fns v4

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MySQL with aiomysql
- **Authentication**: JWT (PyJWT)
- **Password Hashing**: bcrypt
- **ORM**: aiomysql (async)
- **API Documentation**: Swagger/OpenAPI (FastAPI built-in)

### Development Tools
- **Package Manager**: Yarn
- **Code Formatting**: Black, isort (Python) / Prettier (JS)
- **Linting**: ESLint (JS) / Flake8 (Python)
- **Testing**: Jest, React Testing Library / pytest

---

## 📁 Project Structure

```
/app
├── backend/                      # FastAPI backend
│   ├── server.py                 # Main FastAPI application
│   ├── requirements.txt          # Python dependencies
│   ├── database/                 # DB connection and helpers
│   ├── routes/                   # Modular API route files
│   ├── services/                 # Business logic & service layer
│   ├── ml/                       # AI/ML utilities
│   ├── middleware/               # Custom middleware (rate limiting, etc.)
│   └── utils/                    # Shared backend utilities
│
├── frontend/                     # React frontend
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── admin/            # Admin-specific components
│   │   │   ├── advanced/         # Advanced feature components
│   │   │   ├── animations/       # Animation components
│   │   │   ├── directory/        # Directory components
│   │   │   ├── events/           # Event components
│   │   │   ├── forum/            # Forum components
│   │   │   ├── jobs/             # Job components
│   │   │   ├── layout/           # Layout components
│   │   │   ├── loading/          # Skeleton loaders
│   │   │   ├── mentorship/       # Mentorship components
│   │   │   ├── notifications/    # Notification components
│   │   │   └── ui/               # shadcn/ui components
│   │   ├── contexts/             # React contexts (e.g., AuthContext)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utility functions
│   │   ├── page/                 # Page components (dashboards, modules)
│   │   ├── pages/                # Error pages and misc.
│   │   ├── schemas/              # Zod validation schemas
│   │   ├── services/             # API & mock services
│   │   ├── App.js                # Main React component
│   │   └── index.js              # React entry point
│   ├── package.json
│   └── tailwind.config.js
│
├── tests/                        # Test stubs and future tests
├── database_schema.sql           # MySQL database schema
├── mockdata.json                 # Mock data for development
├── *.md                          # Documentation files
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (v3.10+)
- **MySQL** (v8.0+)
- **Yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ritik-JS/Alumini.git
   cd Alumini
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   
   # Create a virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up the Database**
   ```bash
   # Login to MySQL
   mysql -u root -p
   
   # Create database
   CREATE DATABASE alumni_portal;
   
   # Import schema
   mysql -u root -p alumni_portal < database_schema.sql
   ```

4. **Set up the Frontend**
   ```bash
   cd frontend
   
   # Install dependencies
   yarn install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your API URL
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   python server.py
   # Server runs on http://localhost:8000
   ```

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   yarn start
   # App runs on http://localhost:3000
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Environment Variables

> Note: The exact variable names can differ slightly between local development and specific deployment environments. Below is the canonical setup used in this codebase.

**Backend (.env)**
```env
# Database configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=alumni_user
DB_PASSWORD=alumni_pass_123
DB_NAME=AlumUnity

# MySQL connection URL (used internally)
MYSQL_URL=mysql://alumni_user:alumni_pass_123@localhost:3306/AlumUnity

# JWT configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS configuration
CORS_ORIGINS=*
```

**Frontend (.env)**
```env
# Toggle between mock data and backend API
REACT_APP_USE_MOCK_DATA=true

# Backend API URL used by the React app
# In some older docs this may be referred to as REACT_APP_API_URL,
# but in this codebase we use REACT_APP_BACKEND_URL.
REACT_APP_BACKEND_URL=<your-backend-url>
```

---

## 👥 User Roles

| Role | Description | Key Features |
|------|-------------|--------------|
| **Student** 🎓 | Current students seeking opportunities | Browse directory, apply for jobs, find mentors, attend events |
| **Alumni** 🏆 | Graduated students giving back | All student features + post jobs, mentor, create events |
| **Recruiter** 💼 | Hiring professionals | Post jobs, manage applications, browse alumni profiles |
| **Admin** 🛡️ | Platform administrators | User management, verification, analytics, moderation |

---

## 🧩 Core Modules

### 1. Dashboard System
Role-specific dashboards with personalized widgets, quick stats, and action cards.

### 2. Profile Management
Comprehensive profile creation with education, work experience, skills, and social links.

### 3. Alumni Directory
Advanced search and filtering system to discover and connect with alumni.

### 4. Job Portal
Complete job lifecycle management from posting to hiring.

### 5. Mentorship Platform
Connect mentors and mentees with session management and progress tracking.

### 6. Events Management
Create, manage, and attend various types of events with RSVP functionality.

### 7. Community Forum
Discussion platform with categories, voting, and nested comments.

### 8. Notification System
Notification system with customizable preferences.

### 9. Admin Panel
Comprehensive tools for user management, analytics, and platform configuration.

---

## 🎨 Advanced Features

### Skill Graph 🕸️
Interactive network visualization showing skill relationships and connections across the alumni network.

### Career Paths 📈
Visual representation of common career trajectories based on alumni data.

### Leaderboard 🏆
Gamification system recognizing top contributors with points and badges.

### Digital Alumni Card 🪪
Generate QR code-enabled digital ID cards for verified alumni.

### Talent Heatmap 🗺️
Geographic visualization of alumni distribution worldwide.

### Knowledge Capsules 📚
Micro-learning platform for sharing expertise in bite-sized formats.

---

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/login          # User login
POST   /api/auth/register       # User registration
POST   /api/auth/logout         # User logout
POST   /api/auth/refresh        # Refresh JWT token
POST   /api/auth/forgot-password # Password reset request
POST   /api/auth/reset-password  # Reset password
```

### User Endpoints
```
GET    /api/users/profile       # Get current user profile
PUT    /api/users/profile       # Update profile
GET    /api/users/{id}          # Get user by ID
GET    /api/users               # List users (admin)
```

### Jobs Endpoints
```
GET    /api/jobs                # List all jobs
POST   /api/jobs                # Create job posting
GET    /api/jobs/{id}           # Get job details
PUT    /api/jobs/{id}           # Update job
DELETE /api/jobs/{id}           # Delete job
POST   /api/jobs/{id}/apply     # Apply for job
GET    /api/jobs/{id}/applications # Get applications
```

_For complete API documentation, visit `/docs` endpoint when running the backend server._

---

## 🗄️ Database Schema

The database consists of 15+ tables including:

- **users**: User accounts and authentication
- **profiles**: Detailed user profiles
- **jobs**: Job postings
- **applications**: Job applications
- **events**: Event listings
- **rsvps**: Event registrations
- **mentorship_sessions**: Mentorship data
- **forum_posts**: Forum discussions
- **comments**: Post comments
- **notifications**: User notifications
- **skills**: Skill definitions
- **user_skills**: User skill relationships

See `database_schema.sql` for the complete schema.

---

## 📸 Screenshots

_Screenshots to be added_

<!-- Add screenshots of:
- Landing page
- Dashboard views for each role
- Alumni directory
- Job portal
- Mentorship system
- Events page
- Forum
- Admin panel
- Advanced features (skill graph, career paths, etc.)
-->

---

## 📖 Documentation

Comprehensive documentation is available in the repository:

- **[FEATURES_SUMMARY.md](./FEATURES_SUMMARY.md)**: Complete feature list with detailed descriptions
- **[BACKEND_WORKFLOW.md](./BACKEND_WORKFLOW.md)**: Backend development phases and guidelines
- **[FRONTEND_WORKFLOW.md](./FRONTEND_WORKFLOW.md)**: Frontend development workflow
- **[MASTER_WORKFLOW.md](./MASTER_WORKFLOW.md)**: Overall project execution strategy
- **[DATABASE_README.md](./DATABASE_README.md)**: Database schema and relationships
- **[MOCKDATA_README.md](./MOCKDATA_README.md)**: Mock data structure and usage
- **[TOGGLE_GUIDE.md](./TOGGLE_GUIDE.md)**: Switching between mock and real data

---

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
yarn test
```

### Backend Testing
```bash
cd backend
pytest
```

_Note: Test implementation is in progress._

---

## 🚢 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend
yarn build
# Deploy the build folder
```

### Backend Deployment (Heroku/AWS/DigitalOcean)
```bash
cd backend
# Set environment variables
# Deploy using your preferred platform
```

### Docker Deployment
```bash
# Coming soon
docker-compose up
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Coding Standards
- Follow ESLint rules for JavaScript
- Follow PEP 8 for Python
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📊 Project Status

| Component | Status | Completion |
|-----------|--------|------------|
| Frontend | ✅ Complete | 100% |
| UI/UX | ✅ Complete | 100% |
| Mock Services | ✅ Complete | 100% |
| Backend APIs | ✅ Complete | 100% |
| Database | ✅ Schema Defined | 100% |
| Testing | 📋 TODO | 10% |
| Deployment | 📋 TODO | 0% |

---

## 🏆 Acknowledgments

- **shadcn/ui** for the beautiful UI components
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for the utility-first CSS framework
- **FastAPI** for the modern Python web framework
- **React** team for the amazing frontend library

---

## 📝 License

This project is currently **private**. A formal open-source license (such as MIT) has **not** been granted yet. Please do not reuse or redistribute this code without explicit permission from the author.

---

## 👨‍💻 Contact

**Ritik JS**

- GitHub: [@Ritik-JS](https://github.com/Ritik-JS)
- Email: your.email@example.com
- LinkedIn: [Your LinkedIn Profile](https://linkedin.com/in/yourprofile)

**Project Link**: [https://github.com/Ritik-JS/Alumini](https://github.com/Ritik-JS/Alumini)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ for the alumni community

</div>