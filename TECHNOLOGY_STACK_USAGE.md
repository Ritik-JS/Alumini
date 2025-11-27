# 🛠️ Complete Technology Stack - Where Everything is Used

---

## 📊 FRONTEND TECHNOLOGIES

### **React 19** ✅
**File:** `frontend/package.json` (Line 42)
```json
"react": "^19.0.0",
"react-dom": "^19.0.0",
```
**Usage Locations:**
- **`frontend/src/App.js`** - Main React application with 60+ lazy-loaded pages
  - Routes setup with React Router
  - Authentication context provider
  - Error boundaries & Suspense boundaries
  - All 60+ pages/components built with React 19
- **`frontend/src/index.js`** - React DOM render root
- **`frontend/src/contexts/AuthContext.jsx`** - Context API for auth state
- **`frontend/src/page/**/*.jsx`** - All page components
  - AlumniDirectory.jsx
  - StudentDashboard.jsx
  - AdminDashboard.jsx
  - Profile.jsx, Settings.jsx
  - Plus 55+ more pages
- **`frontend/src/components/**/*.jsx`** - 100+ reusable components
  - Error boundary components
  - Loading skeleton loaders
  - ProtectedRoute component
  - Animations & layouts

---

### **React Router DOM 7.5.1** ✅
**File:** `frontend/package.json` (Line 46)
```json
"react-router-dom": "^7.5.1",
```
**Usage Locations:**
- **`frontend/src/App.js`** (Lines 2-85)
  ```javascript
  import { Routes, Route, Navigate } from 'react-router-dom';
  
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/home" element={<Home />} />
    
    // Protected routes with ProtectedRoute wrapper
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<AlumniDashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/jobs" element={<Jobs />} />
      ...60+ more routes
    </Route>
  </Routes>
  ```
- **`frontend/src/components/ProtectedRoute.jsx`** - Route protection logic
- Navigation setup for all 60+ pages
- Deep linking support
- URL parameter handling

---

### **Tailwind CSS 3.4.17** ✅
**Files:** 
- `frontend/tailwind.config.js` (Configuration)
- `frontend/postcss.config.js` (PostCSS integration)
- `frontend/package.json` (Line 95)

**Configuration:**
```javascript
// frontend/tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Custom theme extensions
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

**Usage Locations:**
- **Every `.jsx` component file** - All styling done with Tailwind classes
  - Colors: from Tailwind palette
  - Layout: flexbox, grid via Tailwind
  - Spacing: padding, margins via Tailwind classes
  - Responsive design: `sm:`, `md:`, `lg:` prefixes
- **`frontend/src/index.css`** - Global styles with Tailwind imports
- **All 60+ pages** use Tailwind for styling
- **All 100+ components** styled with Tailwind utility classes

**Example from components:**
```jsx
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Alumni Portal</h1>
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
    Login
  </button>
</div>
```

---

### **Radix UI Components** ✅
**File:** `frontend/package.json` (Lines 7-32)
```json
"@radix-ui/react-accordion": "^1.2.8",
"@radix-ui/react-alert-dialog": "^1.1.11",
"@radix-ui/react-avatar": "^1.1.7",
"@radix-ui/react-checkbox": "^1.2.3",
"@radix-ui/react-dialog": "^1.1.11",
"@radix-ui/react-dropdown-menu": "^2.1.12",
"@radix-ui/react-label": "^2.1.4",
"@radix-ui/react-select": "^2.2.2",
"@radix-ui/react-tabs": "^1.1.9",
"@radix-ui/react-toast": "^1.2.11",
... 15+ more
```

**Usage Locations:**
- **UI Components directory:** `frontend/src/components/ui/`
- **Dialog/Modal:** Modals, confirmations, alerts
- **Dropdown Menu:** Navigation menus
- **Select:** Form dropdowns
- **Tabs:** Tabbed interfaces
- **Toast:** Notifications via Sonner
- **Avatar:** User profile pictures
- **Checkbox/Radio:** Form inputs
- **Label:** Form labels
- All 60+ pages using Radix-based UI components

**Example Usage:**
```jsx
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";

<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <Select>
      <SelectItem value="option1">Option 1</SelectItem>
    </Select>
  </DialogContent>
</Dialog>
```

---

### **Framer Motion 12.23.24** ✅
**File:** `frontend/package.json` (Line 40)
```json
"framer-motion": "^12.23.24",
```

**Usage Locations:**
- **`frontend/src/page/Home.jsx`** (Line 3)
  ```javascript
  import { motion } from 'framer-motion';
  
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
  ```
- **`frontend/src/pages/error/NotFound.jsx`** - Error page animations
- **`frontend/src/pages/error/ServerError.jsx`** - Server error animations
- **`frontend/src/components/animations/`** - Animation components folder
- **Smooth page transitions** on all pages
- **Loading animations** and skeleton screens
- **Card hover effects** and interactive elements
- **Parallax scrolling** effects

---

### **React Hook Form 7.56.2 + Zod 3.24.4** ✅
**Files:** `frontend/package.json` (Lines 45, 51)
```json
"react-hook-form": "^7.56.2",
"zod": "^3.24.4",
"@hookform/resolvers": "^5.0.1",
```

**Usage Locations:**
- **`frontend/src/page/auth/Login.jsx`** (Lines 4-5)
  ```javascript
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });
  ```
- **`frontend/src/page/auth/Register.jsx`** - User registration form
- **`frontend/src/page/auth/ResetPassword.jsx`** (Lines 4-5)
  ```javascript
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  ```
- **`frontend/src/page/auth/ForgotPassword.jsx`** - Password reset
- **`frontend/src/page/Profile.jsx`** - Profile edit form
- **`frontend/src/page/jobs/PostJob.jsx`** - Job posting form
- **`frontend/src/page/events/CreateEvent.jsx`** - Event creation form
- **`frontend/src/schemas/authSchemas.js`** - Auth validation schemas
- **All form validations** across 60+ pages
  - Email validation
  - Password strength validation
  - Required field validation
  - Custom field validation rules

**Example:**
```javascript
// frontend/src/schemas/authSchemas.js
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password too short"),
});

// Used in Login.jsx
const { register, handleSubmit } = useForm({
  resolver: zodResolver(loginSchema),
});
```

---

### **Recharts 3.5.0** ✅
**File:** `frontend/package.json` (Line 48)
```json
"recharts": "^3.5.0",
```

**Usage Locations:**
- **`frontend/src/page/advanced/SkillGraph.jsx`** - Skill relationship graphs
- **`frontend/src/page/advanced/CareerPaths.jsx`** - Career transition charts
- **`frontend/src/page/advanced/TalentHeatmap.jsx`** - Heatmap visualization
- **`frontend/src/page/advanced/Leaderboard.jsx`** - Ranking charts
- **`frontend/src/page/admin/AdminAnalytics.jsx`** - Dashboard analytics
- **`frontend/src/components/career/**/*.jsx`** - Career visualization
- **Chart types used:**
  - LineChart - Trend analysis
  - BarChart - Comparisons
  - PieChart - Distribution
  - AreaChart - Historical data
  - RadarChart - Multi-dimensional analysis
  - Heatmap - Talent distribution

**Example:**
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

<LineChart data={skillData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Line type="monotone" dataKey="value" stroke="#8884d8" />
</LineChart>
```

---

### **Embla Carousel 8.6.0** ✅
**File:** `frontend/package.json` (Line 38)
```json
"embla-carousel-react": "^8.6.0",
```

**Usage Locations:**
- **`frontend/src/components/ui/carousel.jsx`** - Carousel component
- **`frontend/src/page/Home.jsx`** - Home page carousel/hero slider
- **`frontend/src/page/events/Events.jsx`** - Events carousel
- **`frontend/src/page/advanced/AlumniCard.jsx`** - Alumni card slider
- **Features:**
  - Image carousel for events
  - Alumni profile cards carousel
  - Featured content slider
  - Touch/swipe support
  - Responsive carousel

---

### **Axios 1.8.4** ✅
**File:** `frontend/package.json` (Line 33)
```json
"axios": "^1.8.4",
```

**Usage Locations:**
- **All API service files:** `frontend/src/services/api*.js`
  - `apiAuth.js` - Authentication endpoints
  - `apiJobService.js` - Job endpoints
  - `apiEventService.js` - Event endpoints
  - `apiProfileService.js` - Profile endpoints
  - `apiMentorshipService.js` - Mentorship endpoints
  - `apiForumService.js` - Forum endpoints
  - `apiNotificationService.js` - Notification endpoints
  - `apiDirectoryService.js` - Directory endpoints
  - `apiAlumniCardService.js` - Alumni card endpoints
  - `apiCareerPathService.js` - Career path endpoints
  - `apiHeatmapService.js` - Heatmap endpoints
  - `apiSkillGraphService.js` - Skill graph endpoints
  - `apiKnowledgeService.js` - Knowledge endpoints
  - ...plus 13+ more services

**Example from `apiSkillGraphService.js`:**
```javascript
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const getSkillGraph = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/skills/graph`);
  return response.data;
};

export const getSkillDetails = async (skillName) => {
  const response = await axios.get(
    `${BACKEND_URL}/api/skills/${encodeURIComponent(skillName)}`
  );
  return response.data;
};
```

---

### **Additional Frontend Libraries** ✅
- **Sonner 2.0.3** - Toast notifications
  - Used in all error/success message alerts
- **Lucide React 0.507.0** - Icon library
  - Used throughout UI components
- **date-fns 4.1.0** - Date utilities
  - Calendar, date formatting in events/scheduling
- **React Day Picker 8.10.1** - Date picker
  - Event scheduling, date selection
- **React Resizable Panels 3.0.1** - Resizable layouts
  - Admin dashboards, complex layouts
- **Vaul 1.1.2** - Drawer component
  - Side navigation drawers
- **CMDk 1.1.1** - Command palette
  - Keyboard shortcuts, search
- **Input-OTP 1.4.2** - OTP input
  - Email verification flows

---

## 🔧 BACKEND TECHNOLOGIES

### **FastAPI 0.110.1** ✅
**File:** `backend/requirements.txt` (Line 1)
```
fastapi==0.110.1
```

**Usage Location:** `backend/server.py`
```python
from fastapi import FastAPI, APIRouter

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"message": "Hello World - Alumni Portal API"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

app.include_router(api_router)
```

**Features Used:**
- API endpoints routing
- Async request handling
- Dependency injection
- Request validation (Pydantic)
- CORS middleware
- Auto API documentation (Swagger/ReDoc)
- JWT authentication middleware

---

### **Uvicorn 0.25.0** ✅
**Files:** 
- `backend/requirements.txt` (Line 2)
- `DOWNLOAD_INSTRUCTIONS.md` (Line 67)

```bash
# Development startup
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Usage:**
- Runs FastAPI application server
- Listens on port 8001
- Auto-reloads on file changes (--reload)
- Serves ASGI application
- Production: Can use with Gunicorn for multi-worker setup

---

### **PyJWT 2.10.1** ✅
**File:** `backend/requirements.txt` (Line 9)
```
pyjwt>=2.10.1
```

**Usage in Backend:**
- **JWT token generation** on login
  ```python
  import jwt
  
  token = jwt.encode(
      {"user_id": user.id, "role": user.role},
      SECRET_KEY,
      algorithm="HS256"
  )
  ```
- **Token verification** in middleware
  ```python
  decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
  ```
- **Authentication endpoints:**
  - `/api/auth/login` - Generate JWT token
  - `/api/auth/me` - Verify token and get user
  - All protected endpoints verify JWT

---

### **Bcrypt 4.1.3** ✅
**File:** `backend/requirements.txt` (Line 10)
```
bcrypt==4.1.3
```

**Usage in Backend:**
- **Password hashing** on registration
  ```python
  import bcrypt
  
  password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
  ```
- **Password verification** on login
  ```python
  bcrypt.checkpw(password.encode(), stored_hash)
  ```
- **Auth endpoints:**
  - `/api/auth/register` - Hash password
  - `/api/auth/login` - Verify password

---

### **MySQL via aiomysql 0.2.0** ✅
**Files:**
- `backend/requirements.txt` (Line 25)
- `backend/server.py` (Lines 11-30)

```python
import aiomysql

async def get_db_pool():
    """Get or create database connection pool"""
    global db_pool
    if db_pool is None:
        db_pool = await aiomysql.create_pool(
            host=os.environ.get('DB_HOST', 'localhost'),
            port=int(os.environ.get('DB_PORT', 3306)),
            user=os.environ.get('DB_USER', 'alumni_user'),
            password=os.environ.get('DB_PASSWORD', 'alumni_pass_123'),
            db=os.environ.get('DB_NAME', 'alumni_portal'),
            charset='utf8mb4',
            autocommit=False,
            minsize=1,
            maxsize=10
        )
    return db_pool
```

**Features:**
- Async MySQL driver
- Connection pooling
- All data persistence
- 50+ normalized tables
- See `database_schema.sql` for full schema

---

### **Pandas 2.2.0 + NumPy 1.26.0** ✅
**File:** `backend/requirements.txt` (Lines 20-21)
```
pandas>=2.2.0
numpy>=1.26.0
```

**Usage in Backend:**
- **Data processing for AI features** (Phase 10):
  - Reading CSV/Excel datasets
  - Data cleaning and transformation
  - Statistical analysis
  - Feature engineering for ML models
  - Dataset upload pipeline
- **Used in ML endpoints:**
  - `/api/datasets/upload` - Process uploaded data
  - `/api/ai/predict` - AI prediction pipelines
  - `/api/analytics/compute` - Analytics calculations

---

### **Advanced ML Libraries** (For Phase 10 AI Features)
While not currently in requirements.txt, these are mentioned for future AI implementation:

**Python ML Pipeline:**
- **scikit-learn** - ML algorithms (clustering, classification)
- **sentence-transformers** - Text embeddings for skill matching
- **faiss-cpu** - Fast similarity search

**Expected to be used in:**
- **Skill Matching Engine** - Match skills to job requirements
- **Career Prediction** - Predict career progression
- **Talent Clustering** - Group similar candidates
- **Knowledge Ranking** - Rank educational content

---

### **Advanced Features Libraries** ✅
**File:** `backend/requirements.txt` (Lines 28-30)
```
qrcode>=7.4.2      # QR code generation
Pillow>=10.2.0     # Image processing
reportlab>=4.0.0   # PDF generation
```

**Usage Locations:**
- **QR Code Generation:**
  - Digital ID cards (alumni cards with QR codes)
  - Event registration QR codes
  - Endpoint: `/api/alumni/generate-qr-code`

- **Image Processing (Pillow):**
  - Profile photo uploads and resizing
  - Certificate image processing
  - Thumbnail generation
  - Endpoint: `/api/profiles/upload-photo`

- **PDF Generation (ReportLab):**
  - Certificate generation
  - Report exports
  - Resume/CV generation
  - Endpoint: `/api/certificates/generate-pdf`

---

### **Testing & Code Quality** ✅

**File:** `backend/requirements.txt` (Lines 13-17)

**PyTest 8.0.0** (Line 13)
```
pytest>=8.0.0
```
- Unit tests for backend
- Integration tests for API endpoints
- Tests directory: `tests/`
- Run: `pytest tests/`

**Black 24.1.1** (Line 14)
```
black>=24.1.1
```
- Code formatting
- Run: `black backend/`
- Ensures consistent code style

**Flake8 7.0.0** (Line 16)
```
flake8>=7.0.0
```
- Code linting
- PEP8 compliance checking
- Run: `flake8 backend/`

**isort 5.13.2** (Line 15)
```
isort>=5.13.2
```
- Import sorting and organizing
- Run: `isort backend/`

**mypy 1.8.0** (Line 17)
```
mypy>=1.8.0
```
- Static type checking
- Type hint validation
- Run: `mypy backend/`

---

### **Other Backend Libraries** ✅

- **Pydantic 2.6.4** - Data validation models
- **python-dotenv 1.0.1** - Environment variable loading
- **email-validator 2.2.0** - Email validation
- **python-jose 3.3.0** - JWT alternative
- **requests 2.31.0** - HTTP client for external APIs
- **python-multipart 0.0.9** - File upload handling
- **python-dateutil 2.8.2** - Date/time utilities
- **Typer 0.9.0** - CLI tool building
- **boto3** - AWS S3 integration (future use)

---

## 📦 MOCK DATA & SERVICE SWITCHER

### **Mock Data System** ✅

**Files:**
- `frontend/mockdata.json` (2534 lines of test data)
- `frontend/src/services/mock*.js` (13 mock service files)
- `frontend/src/services/index.js` (Service switcher)

**Mock Data Content:**
```json
{
  "users": [10 sample users with all roles],
  "alumni_profiles": [Alumni profiles with experience],
  "student_profiles": [Student profiles],
  "job_postings": [10+ job listings],
  "events": [20+ events],
  "mentorship_relationships": [Mentor pairs],
  "forum_posts": [Discussion threads],
  "notifications": [Sample notifications]
}
```

**Service Switcher in `frontend/src/services/index.js`:**
```javascript
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Dynamically export either mock or API services
export const authService = USE_MOCK_DATA ? mockAuth : apiAuth;
export const jobService = USE_MOCK_DATA ? mockJobService : apiJobService;
export const eventService = USE_MOCK_DATA ? mockEventService : apiEventService;
// ... 13+ more services
```

**Mock Services Files:**
- `mockAuth.js` - Mock authentication
- `mockJobService.js` - Mock job operations
- `mockEventService.js` - Mock event operations
- `mockProfileService.js` - Mock profile operations
- `mockMentorshipService.js` - Mock mentorship
- `mockForumService.js` - Mock forum
- `mockNotificationService.js` - Mock notifications
- `mockDirectoryService.js` - Mock alumni directory
- `mockLeaderboardService.js` - Mock leaderboards
- `mockAlumniCardService.js` - Mock alumni cards
- `mockCareerPathService.js` - Mock career paths
- `mockHeatmapService.js` - Mock talent heatmap
- `mockSkillGraphService.js` - Mock skill graphs
- `mockKnowledgeService.js` - Mock knowledge capsules

---

## 🗄️ DATABASE

### **MySQL Database** ✅
**Schema File:** `database_schema.sql` (50+ tables)

**Tables Used:**
1. **Authentication:**
   - users
   - email_verifications
   - password_resets
   - user_roles

2. **Profiles:**
   - alumni_profiles
   - student_profiles
   - recruiter_profiles
   - skills
   - certifications
   - achievements

3. **Jobs:**
   - job_postings
   - job_applications
   - applications_timeline

4. **Events:**
   - events
   - event_registrations
   - event_feedback

5. **Mentorship:**
   - mentorship_relationships
   - mentorship_sessions

6. **Community:**
   - forum_posts
   - forum_comments
   - post_likes

7. **Notifications:**
   - notifications
   - notification_preferences
   - email_queue

8. **Advanced Features:**
   - skill_embeddings
   - career_transition_matrix
   - talent_clusters
   - leaderboards
   - badges_achievements
   - knowledge_capsules

9. **Admin:**
   - admin_audit_logs
   - dataset_uploads
   - ai_processing_queue
   - file_uploads

---

## 📊 COMPLETE TECHNOLOGY FLOW

```
USER BROWSER
    ↓
    ├─ [React 19] Renders UI
    ├─ [Tailwind CSS] Styles components
    ├─ [Radix UI] Provides accessible components
    ├─ [Framer Motion] Animates transitions
    ├─ [React Hook Form + Zod] Validates forms
    ├─ [Axios] Makes HTTP requests
    └─ [localStorage] Stores JWT token

    ↓ (environment variable check)
    
    ├─ TESTING MODE: REACT_APP_USE_MOCK_DATA=true
    │   ├─ [Mock Services] Return hardcoded data
    │   ├─ [mockdata.json] Supplies test data
    │   └─ [Recharts/Embla] Displays data locally
    │
    └─ PRODUCTION MODE: REACT_APP_USE_MOCK_DATA=false
        ├─ [API Services] Make HTTP requests
        └─ [Bearer JWT Token] Sent in headers
            ↓
        FASTAPI BACKEND (Port 8001)
            ├─ [Uvicorn] ASGI server
            ├─ [JWT/Bcrypt] Authenticates request
            ├─ [Pydantic] Validates input data
            ├─ [Python business logic] Processes
            └─ [aiomysql async pool] Database connection
                ↓
            MYSQL DATABASE (Port 3306)
                ├─ [50+ Tables] Stores all data
                ├─ [Indexes] Optimizes queries
                ├─ [Foreign Keys] Maintains relationships
                └─ [JSON columns] Flexible data
                
            Advanced Features:
            ├─ [Pandas/NumPy] Data analysis
            ├─ [QRCode] ID generation
            ├─ [Pillow] Image processing
            ├─ [ReportLab] PDF generation
            └─ [ML Libraries] AI predictions
```

---

## ✅ TESTING & QUALITY ASSURANCE

### **Frontend Testing** 
- **Jest** (via react-scripts)
- **ESLint** (code quality)
- **Manual testing** with mock data

### **Backend Testing**
- **PyTest** - Unit and integration tests
- **Black** - Code formatting
- **Flake8** - Linting
- **isort** - Import organization
- **mypy** - Type checking

---

## 🚀 DEPLOYMENT

### **Development Environment**
```bash
# Frontend
npm start  # React dev server on port 3000

# Backend
uvicorn server:app --reload  # FastAPI on port 8001
```

### **Production Environment**
```bash
# Frontend (built and served via Nginx/Caddy)
npm build  # Creates optimized build

# Backend (with Gunicorn + Uvicorn workers)
gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

---

**Every technology in your stack is actively used and integrated into this comprehensive Alumni Portal system!**
