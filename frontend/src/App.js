import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { FullPageSkeleton } from '@/components/loading/SkeletonLoaders';

// Auth Pages (not lazy loaded - needed immediately)
import Login from '@/page/auth/Login';
import Register from '@/page/auth/Register';
import ForgotPassword from '@/page/auth/ForgotPassword';
import ResetPassword from '@/page/auth/ResetPassword';

// Error Pages
import NotFound from '@/pages/error/NotFound';
import ServerError from '@/pages/error/ServerError';

// Main Pages
import Home from '@/page/Home';
import About from '@/page/About';

// Lazy load other pages for performance
const AlumniDirectory = lazy(() => import('@/page/AlumniDirectory'));
const ProfileView = lazy(() => import('@/page/ProfileView'));

// Job Pages
const Jobs = lazy(() => import('@/page/jobs/Jobs'));
const JobDetails = lazy(() => import('@/page/jobs/JobDetails'));
const MyApplications = lazy(() => import('@/page/jobs/MyApplications'));
const PostJob = lazy(() => import('@/page/jobs/PostJob'));
const ManageJobs = lazy(() => import('@/page/jobs/ManageJobs'));
const ApplicationsManager = lazy(() => import('@/page/jobs/ApplicationsManager'));

// Mentorship Pages
const FindMentors = lazy(() => import('@/page/mentorship/FindMentors'));
const MentorProfile = lazy(() => import('@/page/mentorship/MentorProfile'));
const MentorshipDashboard = lazy(() => import('@/page/mentorship/MentorshipDashboard'));
const SessionDetails = lazy(() => import('@/page/mentorship/SessionDetails'));

// Event Pages
const Events = lazy(() => import('@/page/events/Events'));
const EventDetails = lazy(() => import('@/page/events/EventDetails'));
const CreateEvent = lazy(() => import('@/page/events/CreateEvent'));
const ManageEvents = lazy(() => import('@/page/events/ManageEvents'));
const EventAttendees = lazy(() => import('@/page/events/EventAttendees'));

// Forum Pages
const Forum = lazy(() => import('@/page/forum/Forum'));
const PostDetails = lazy(() => import('@/page/forum/PostDetails'));

// Notification Pages
const Notifications = lazy(() => import('@/page/notifications/Notifications'));
const NotificationPreferences = lazy(() => import('@/page/notifications/NotificationPreferences'));

// Dashboards (Role-specific)
const StudentDashboard = lazy(() => import('@/page/StudentDashboard'));
const AlumniDashboard = lazy(() => import('@/page/AlumniDashboard'));
const RecruiterDashboard = lazy(() => import('@/page/RecruiterDashboard'));
const AdminDashboard = lazy(() => import('@/page/AdminDashboard'));

// Admin Pages
const AdminUsers = lazy(() => import('@/page/admin/AdminUsers'));
const AdminVerifications = lazy(() => import('@/page/admin/AdminVerifications'));
const AdminModeration = lazy(() => import('@/page/admin/AdminModeration'));
const AdminAnalytics = lazy(() => import('@/page/admin/AdminAnalytics'));
const AdminSettings = lazy(() => import('@/page/admin/AdminSettings'));

// Phase 9: Advanced Features
const SkillGraph = lazy(() => import('@/page/advanced/SkillGraph'));
const CareerPaths = lazy(() => import('@/page/advanced/CareerPaths'));
const Leaderboard = lazy(() => import('@/page/advanced/Leaderboard'));
const AlumniCard = lazy(() => import('@/page/advanced/AlumniCard'));
const TalentHeatmap = lazy(() => import('@/page/advanced/TalentHeatmap'));
const KnowledgeCapsules = lazy(() => import('@/page/advanced/KnowledgeCapsules'));

import '@/App.css';

// Dashboard router component - redirects to role-specific dashboard
const DashboardRouter = () => {
  const userData = localStorage.getItem('user');
  if (!userData) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userData);
  
  switch (user.role) {
    case 'student':
      return <Navigate to="/dashboard/student" replace />;
    case 'alumni':
      return <Navigate to="/dashboard/alumni" replace />;
    case 'recruiter':
      return <Navigate to="/dashboard/recruiter" replace />;
    case 'admin':
      return <Navigate to="/dashboard/admin" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <OfflineIndicator />
          <Toaster position="top-right" richColors />
          <Suspense fallback={<FullPageSkeleton />}>
            <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Alumni Directory - Protected */}
          <Route
            path="/directory"
            element={
              <ProtectedRoute>
                <AlumniDirectory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <ProfileView />
              </ProtectedRoute>
            }
          />

          {/* Job Routes - Protected */}
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId"
            element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/my-applications"
            element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/post"
            element={
              <ProtectedRoute>
                <PostJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/manage"
            element={
              <ProtectedRoute>
                <ManageJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId/applications"
            element={
              <ProtectedRoute>
                <ApplicationsManager />
              </ProtectedRoute>
            }
          />

          {/* Mentorship Routes - Protected */}
          <Route
            path="/mentorship"
            element={
              <ProtectedRoute>
                <Navigate to="/mentorship/find" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentorship/find"
            element={
              <ProtectedRoute>
                <FindMentors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentorship/mentor/:userId"
            element={
              <ProtectedRoute>
                <MentorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentorship/dashboard"
            element={
              <ProtectedRoute>
                <MentorshipDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentorship/sessions/:sessionId"
            element={
              <ProtectedRoute>
                <SessionDetails />
              </ProtectedRoute>
            }
          />

          {/* Event Routes - Protected */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/create"
            element={
              <ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/manage"
            element={
              <ProtectedRoute>
                <ManageEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/attendees"
            element={
              <ProtectedRoute>
                <EventAttendees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <ProtectedRoute>
                <EventDetails />
              </ProtectedRoute>
            }
          />

          {/* Forum Routes - Protected */}
          <Route
            path="/forum"
            element={
              <ProtectedRoute>
                <Forum />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forum/posts/:postId"
            element={
              <ProtectedRoute>
                <PostDetails />
              </ProtectedRoute>
            }
          />

          {/* Notification Routes - Protected */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <ProtectedRoute>
                <NotificationPreferences />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/alumni"
            element={
              <ProtectedRoute>
                <AlumniDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/recruiter"
            element={
              <ProtectedRoute>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Protected */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verifications"
            element={
              <ProtectedRoute>
                <AdminVerifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <ProtectedRoute>
                <AdminModeration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* Phase 9: Advanced Features Routes - Protected */}
          <Route
            path="/skills/graph"
            element={
              <ProtectedRoute>
                <SkillGraph />
              </ProtectedRoute>
            }
          />
          <Route
            path="/career/paths"
            element={
              <ProtectedRoute>
                <CareerPaths />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alumni-card"
            element={
              <ProtectedRoute>
                <AlumniCard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/heatmap"
            element={
              <ProtectedRoute>
                <TalentHeatmap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge"
            element={
              <ProtectedRoute>
                <KnowledgeCapsules />
              </ProtectedRoute>
            }
          />

          {/* Error Pages */}
          <Route path="/500" element={<ServerError />} />
          
          {/* Redirect unknown routes to 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
