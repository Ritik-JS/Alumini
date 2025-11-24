import mockData from '../mockdata.json';

// Storage keys
const PROFILES_KEY = 'alumni_profiles';
const USERS_KEY = 'users';
const JOBS_KEY = 'jobs';
const JOB_APPLICATIONS_KEY = 'job_applications';
const MENTOR_PROFILES_KEY = 'mentor_profiles';
const MENTORSHIP_REQUESTS_KEY = 'mentorship_requests';
const MENTORSHIP_SESSIONS_KEY = 'mentorship_sessions';
const EVENTS_KEY = 'events';
const EVENT_RSVPS_KEY = 'event_rsvps';

// Helper to get data from localStorage or fallback to mock data
const getStoredData = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
};

// Helper to save data to localStorage
const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Get profile by user ID
export const getProfileByUserId = async (userId) => {
  const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles);
  return profiles.find(p => p.user_id === userId);
};

// Get profile by profile ID
export const getProfileById = async (profileId) => {
  const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles);
  return profiles.find(p => p.id === profileId);
};

// Update profile
export const updateProfile = async (userId, updatedData) => {
  const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles);
  const index = profiles.findIndex(p => p.user_id === userId);
  
  if (index !== -1) {
    profiles[index] = { ...profiles[index], ...updatedData, updated_at: new Date().toISOString() };
    saveData(PROFILES_KEY, profiles);
    return profiles[index];
  }
  
  return null;
};

// Create profile
export const createProfile = async (profileData) => {
  const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles);
  const newProfile = {
    id: `profile-${Date.now()}`,
    ...profileData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  profiles.push(newProfile);
  saveData(PROFILES_KEY, profiles);
  return newProfile;
};

// Get job applications by user
export const getJobApplicationsByUser = async (userId) => {
  const applications = getStoredData(JOB_APPLICATIONS_KEY, mockData.job_applications || []);
  return applications.filter(app => app.applicant_id === userId);
};

// Get mentorship requests by student
export const getMentorshipRequestsByStudent = async (studentId) => {
  const requests = getStoredData(MENTORSHIP_REQUESTS_KEY, mockData.mentorship_requests || []);
  return requests.filter(req => req.student_id === studentId);
};

// Get mentorship requests by mentor
export const getMentorshipRequestsByMentor = async (mentorId) => {
  const requests = getStoredData(MENTORSHIP_REQUESTS_KEY, mockData.mentorship_requests || []);
  return requests.filter(req => req.mentor_id === mentorId);
};

// Get mentor profile by user ID
export const getMentorProfileByUserId = async (userId) => {
  const mentorProfiles = getStoredData(MENTOR_PROFILES_KEY, mockData.mentor_profiles || []);
  return mentorProfiles.find(m => m.user_id === userId);
};

// Get all mentor profiles
export const getAllMentorProfiles = async () => {
  return getStoredData(MENTOR_PROFILES_KEY, mockData.mentor_profiles || []);
};

// Get mentorship sessions
export const getMentorshipSessions = async (userId, role) => {
  const sessions = getStoredData(MENTORSHIP_SESSIONS_KEY, mockData.mentorship_sessions || []);
  const requests = getStoredData(MENTORSHIP_REQUESTS_KEY, mockData.mentorship_requests || []);
  
  // Filter based on role
  if (role === 'student') {
    const userRequests = requests.filter(r => r.student_id === userId);
    return sessions.filter(s => userRequests.some(r => r.id === s.mentorship_request_id));
  } else if (role === 'alumni') {
    const userRequests = requests.filter(r => r.mentor_id === userId);
    return sessions.filter(s => userRequests.some(r => r.id === s.mentorship_request_id));
  }
  
  return [];
};

// Get jobs posted by user (recruiter/alumni)
export const getJobsByPostedBy = async (userId) => {
  const jobs = getStoredData(JOBS_KEY, mockData.jobs || []);
  return jobs.filter(job => job.posted_by === userId);
};

// Get all jobs
export const getAllJobs = async () => {
  return getStoredData(JOBS_KEY, mockData.jobs || []);
};

// Get applications for a job
export const getApplicationsForJob = async (jobId) => {
  const applications = getStoredData(JOB_APPLICATIONS_KEY, mockData.job_applications || []);
  return applications.filter(app => app.job_id === jobId);
};

// Get upcoming events
export const getUpcomingEvents = async (limit = 5) => {
  const events = getStoredData(EVENTS_KEY, mockData.events || []);
  const now = new Date();
  
  return events
    .filter(event => new Date(event.start_date) > now)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, limit);
};

// Get event RSVPs by user
export const getEventRSVPsByUser = async (userId) => {
  const rsvps = getStoredData(EVENT_RSVPS_KEY, mockData.event_rsvps || []);
  return rsvps.filter(rsvp => rsvp.user_id === userId);
};

// Get system stats (for admin dashboard)
export const getSystemStats = async () => {
  const users = getStoredData(USERS_KEY, mockData.users || []);
  const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles || []);
  const jobs = getStoredData(JOBS_KEY, mockData.jobs || []);
  const events = getStoredData(EVENTS_KEY, mockData.events || []);
  
  return {
    totalUsers: users.length,
    studentCount: users.filter(u => u.role === 'student').length,
    alumniCount: users.filter(u => u.role === 'alumni').length,
    recruiterCount: users.filter(u => u.role === 'recruiter').length,
    totalProfiles: profiles.length,
    verifiedProfiles: profiles.filter(p => p.is_verified).length,
    pendingVerifications: profiles.filter(p => !p.is_verified).length,
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'active').length,
    totalEvents: events.length,
    upcomingEvents: events.filter(e => new Date(e.start_date) > new Date()).length,
  };
};

// Get user by ID
export const getUserById = async (userId) => {
  const users = getStoredData(USERS_KEY, mockData.users || []);
  return users.find(u => u.id === userId);
};

// Export the entire service as a named export
export const mockProfileService = {
  getProfileByUserId,
  getProfileById,
  updateProfile,
  createProfile,
  getAllJobs,
  getJobsByPostedBy,
  getJobApplicationsByUser,
  getApplicationsForJob,
  getAllMentorProfiles,
  getMentorProfileByUserId,
  getMentorshipRequestsByStudent,
  getMentorshipRequestsByMentor,
  getMentorshipSessions,
  getUpcomingEvents,
  getEventRSVPsByUser,
  getSystemStats,
  getUserById,
};

// Default export
export default mockProfileService;
