import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth Pages
import Login from '@/page/auth/Login';
import Register from '@/page/auth/Register';
import ForgotPassword from '@/page/auth/ForgotPassword';
import ResetPassword from '@/page/auth/ResetPassword';

// Main Pages
import Home from '@/page/Home';
import AlumniDirectory from '@/page/AlumniDirectory';
import ProfileView from '@/page/ProfileView';

// Job Pages
import Jobs from '@/page/jobs/Jobs';
import JobDetails from '@/page/jobs/JobDetails';
import MyApplications from '@/page/jobs/MyApplications';
import PostJob from '@/page/jobs/PostJob';
import ManageJobs from '@/page/jobs/ManageJobs';
import ApplicationsManager from '@/page/jobs/ApplicationsManager';

// Mentorship Pages
import FindMentors from '@/page/mentorship/FindMentors';
import MentorProfile from '@/page/mentorship/MentorProfile';
import MentorshipDashboard from '@/page/mentorship/MentorshipDashboard';
import SessionDetails from '@/page/mentorship/SessionDetails';

// Event Pages
import Events from '@/page/events/Events';
import EventDetails from '@/page/events/EventDetails';
import CreateEvent from '@/page/events/CreateEvent';
import ManageEvents from '@/page/events/ManageEvents';
import EventAttendees from '@/page/events/EventAttendees';

// Forum Pages
import Forum from '@/page/forum/Forum';
import PostDetails from '@/page/forum/PostDetails';

// Dashboards (Role-specific)
import StudentDashboard from '@/page/StudentDashboard';
import AlumniDashboard from '@/page/AlumniDashboard';
import RecruiterDashboard from '@/page/RecruiterDashboard';
import AdminDashboard from '@/page/AdminDashboard';

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
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
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

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
