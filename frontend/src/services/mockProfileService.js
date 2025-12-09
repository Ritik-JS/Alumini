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
    verifiedAlumni: profiles.filter(p => p.is_verified).length,
    totalProfiles: profiles.length,
    verifiedProfiles: profiles.filter(p => p.is_verified).length,
    pendingVerifications: profiles.filter(p => !p.is_verified).length,
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'active').length,
    totalEvents: events.length,
    upcomingEvents: events.filter(e => new Date(e.start_date) > new Date()).length,
  };
};

// Get pending verification profiles (for admin verifications page)
export const getPendingVerifications = async () => {
  const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles || []);
  const users = getStoredData(USERS_KEY, mockData.users || []);
  
  const pendingProfiles = profiles.filter(p => !p.is_verified);
  
  // Enrich with user data
  return pendingProfiles.map(profile => {
    const user = users.find(u => u.id === profile.user_id);
    return {
      ...profile,
      user: user || { email: 'unknown@example.com' }
    };
  });
};

// Get user by ID
export const getUserById = async (userId) => {
  const users = getStoredData(USERS_KEY, mockData.users || []);
  return users.find(u => u.id === userId);
};

// Get current user's profile
export const getMyProfile = async () => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          resolve({ success: false, error: 'Not logged in' });
          return;
        }
        
        const user = JSON.parse(userStr);
        const profile = await getProfileByUserId(user.id);
        
        if (profile) {
          resolve({ success: true, data: profile });
        } else {
          // If no profile exists, return a default structure
          resolve({ 
            success: true, 
            data: {
              id: `profile-${user.id}`,
              user_id: user.id,
              name: user.email?.split('@')[0] || 'User',
              email: user.email,
              photo_url: '',
              bio: '',
              headline: '',
              current_company: '',
              current_role: '',
              location: '',
              batch_year: new Date().getFullYear(),
              experience_timeline: [],
              education_details: [],
              skills: [],
              achievements: [],
              social_links: {},
              industry: '',
              years_of_experience: 0,
              willing_to_mentor: false,
              willing_to_hire: false,
              profile_completion_percentage: 10,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        console.error('Error getting my profile:', error);
        resolve({ success: false, error: error.message });
      }
    }, 200);
  });
};

// Export the entire service as a named export
export const mockProfileService = {
  getProfileByUserId,
  getProfileById,
  getMyProfile,
  updateProfile: async (userId, updatedData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles || []);
        const index = profiles.findIndex(p => p.user_id === userId || p.id === userId);
        
        if (index !== -1) {
          profiles[index] = { ...profiles[index], ...updatedData, updated_at: new Date().toISOString() };
          saveData(PROFILES_KEY, profiles);
          resolve({ success: true, data: profiles[index] });
        } else {
          // Create new profile if doesn't exist
          const newProfile = {
            id: `profile-${Date.now()}`,
            user_id: userId,
            ...updatedData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          profiles.push(newProfile);
          saveData(PROFILES_KEY, profiles);
          resolve({ success: true, data: newProfile });
        }
      }, 300);
    });
  },
  createProfile,
  getAllJobs,
  getJobsByPostedBy,
  getJobsByPoster: getJobsByPostedBy, // Alias for compatibility
  getJobApplicationsByUser,
  getApplicationsForJob,
  getAllMentorProfiles,
  getMentorProfileByUserId,
  getMentorProfile: getMentorProfileByUserId, // Alias for compatibility
  getMentorshipRequestsByStudent,
  getMentorshipRequestsByMentor,
  getMentorshipSessions,
  getUpcomingEvents,
  getEventRSVPsByUser,
  getSystemStats,
  getPendingVerifications,
  getUserById,
  
  // ========== ADMIN VERIFICATION METHODS ==========
  
  getPendingVerifications: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles || []);
        const users = getStoredData(USERS_KEY, mockData.users || []);
        
        const pendingProfiles = profiles.filter(p => !p.is_verified);
        
        // Enrich with user data
        const enrichedProfiles = pendingProfiles.map(profile => {
          const user = users.find(u => u.id === profile.user_id);
          return {
            ...profile,
            user: user || { email: 'unknown@example.com' }
          };
        });
        
        resolve({
          success: true,
          data: enrichedProfiles
        });
      }, 300);
    });
  },
  
  approveVerification: async (profileId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles || []);
        const profile = profiles.find(p => p.id === profileId || p.user_id === profileId);
        
        if (profile) {
          profile.is_verified = true;
          profile.verified_at = new Date().toISOString();
          saveData(PROFILES_KEY, profiles);
          
          resolve({
            success: true,
            data: profile,
            message: 'Profile verified successfully'
          });
        } else {
          resolve({
            success: false,
            error: 'Profile not found'
          });
        }
      }, 300);
    });
  },
  
  rejectVerification: async (profileId, reason = '') => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles || []);
        const profile = profiles.find(p => p.id === profileId || p.user_id === profileId);
        
        if (profile) {
          profile.is_verified = false;
          profile.verification_rejected = true;
          profile.rejection_reason = reason;
          profile.rejected_at = new Date().toISOString();
          saveData(PROFILES_KEY, profiles);
          
          resolve({
            success: true,
            data: profile,
            message: 'Profile verification rejected'
          });
        } else {
          resolve({
            success: false,
            error: 'Profile not found'
          });
        }
      }, 300);
    });
  },

  // ========== ADMIN USER MANAGEMENT METHODS ==========

  getAllUsers: async (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStoredData(USERS_KEY, mockData.users || []);
        const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles || []);
        
        // Enrich users with profile data
        const enrichedUsers = users.map(user => {
          const profile = profiles.find(p => p.user_id === user.id);
          return {
            ...user,
            profile: profile || null,
            is_verified: profile?.is_verified || false
          };
        });
        
        // Apply filters
        let filtered = enrichedUsers;
        if (filters.role) {
          filtered = filtered.filter(u => u.role === filters.role);
        }
        if (filters.verified !== undefined) {
          filtered = filtered.filter(u => u.is_verified === filters.verified);
        }
        
        resolve({
          success: true,
          data: filtered,
          total: filtered.length
        });
      }, 300);
    });
  },

  getUserWithProfile: async (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStoredData(USERS_KEY, mockData.users || []);
        const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles || []);
        
        const user = users.find(u => u.id === userId);
        if (user) {
          const profile = profiles.find(p => p.user_id === userId);
          resolve({
            success: true,
            data: {
              ...user,
              profile: profile || null
            }
          });
        } else {
          resolve({
            success: false,
            error: 'User not found'
          });
        }
      }, 200);
    });
  },

  banUser: async (userId, reason = '') => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStoredData(USERS_KEY, mockData.users || []);
        const user = users.find(u => u.id === userId);
        
        if (user) {
          user.is_banned = true;
          user.ban_reason = reason;
          user.banned_at = new Date().toISOString();
          saveData(USERS_KEY, users);
          
          resolve({
            success: true,
            message: 'User banned successfully'
          });
        } else {
          resolve({
            success: false,
            error: 'User not found'
          });
        }
      }, 300);
    });
  },

  deleteUser: async (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let users = getStoredData(USERS_KEY, mockData.users || []);
        let profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles || []);
        
        const initialLength = users.length;
        users = users.filter(u => u.id !== userId);
        profiles = profiles.filter(p => p.user_id !== userId);
        
        if (users.length < initialLength) {
          saveData(USERS_KEY, users);
          saveData(PROFILES_KEY, profiles);
          
          resolve({
            success: true,
            message: 'User deleted successfully'
          });
        } else {
          resolve({
            success: false,
            error: 'User not found'
          });
        }
      }, 300);
    });
  },

  resetPassword: async (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStoredData(USERS_KEY, mockData.users || []);
        const user = users.find(u => u.id === userId);
        
        if (user) {
          // In mock, just mark that reset was requested
          resolve({
            success: true,
            message: `Password reset email sent to ${user.email}`
          });
        } else {
          resolve({
            success: false,
            error: 'User not found'
          });
        }
      }, 300);
    });
  },

  exportUsers: async (format = 'csv') => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStoredData(USERS_KEY, mockData.users || []);
        const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles || []);
        
        // Create CSV-like data
        const csvData = users.map(user => {
          const profile = profiles.find(p => p.user_id === user.id);
          return {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            role: user.role,
            verified: profile?.is_verified || false,
            created: user.created_at
          };
        });
        
        resolve({
          success: true,
          data: csvData,
          format: format
        });
      }, 500);
    });
  }
};

// Default export
export default mockProfileService;
