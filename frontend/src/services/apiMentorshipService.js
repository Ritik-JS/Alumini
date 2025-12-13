// Mock Mentorship Service for AlumUnity
// This provides mock data and API calls for mentorship-related features

import mockData from '../mockdata.json';

// Storage keys for local state management
const STORAGE_KEYS = {
  MENTORSHIP_REQUESTS: 'mentorship_requests',
  MENTORSHIP_SESSIONS: 'mentorship_sessions',
  MENTOR_PROFILES: 'mentor_profiles',
};

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

// Get all mentor profiles with user and alumni profile data
export const getAllMentors = () => {
  const mentorProfiles = getStoredData(STORAGE_KEYS.MENTOR_PROFILES, mockData.mentor_profiles);
  const users = mockData.users;
  const alumniProfiles = mockData.alumni_profiles;

  return mentorProfiles.map(mentor => {
    const user = users.find(u => u.id === mentor.user_id);
    const profile = alumniProfiles.find(p => p.user_id === mentor.user_id);
    return {
      ...mentor,
      user,
      profile,
    };
  });
};

// Get available mentors (is_available = true)
export const getAvailableMentors = () => {
  return getAllMentors().filter(mentor => mentor.is_available);
};

// Search mentors by name or expertise
export const searchMentors = (query) => {
  if (!query || query.trim() === '') {
    return getAvailableMentors();
  }

  const mentors = getAvailableMentors();
  const searchTerm = query.toLowerCase();

  return mentors.filter(mentor => {
    const nameMatch = mentor.profile?.name?.toLowerCase().includes(searchTerm);
    const expertiseMatch = mentor.expertise_areas?.some(area =>
      area.toLowerCase().includes(searchTerm)
    );
    const roleMatch = mentor.profile?.current_role?.toLowerCase().includes(searchTerm);

    return nameMatch || expertiseMatch || roleMatch;
  });
};

// Filter mentors based on criteria
export const filterMentors = (filters) => {
  let mentors = getAvailableMentors();

  // Search query
  if (filters.search && filters.search.trim()) {
    mentors = searchMentors(filters.search);
  }

  // Expertise filter
  if (filters.expertise && filters.expertise.length > 0) {
    mentors = mentors.filter(m =>
      filters.expertise.some(exp => m.expertise_areas?.includes(exp))
    );
  }

  // Availability filter
  if (filters.availableOnly === true) {
    mentors = mentors.filter(m => m.is_available && m.current_mentees_count < m.max_mentees);
  }

  // Rating filter
  if (filters.minRating) {
    mentors = mentors.filter(m => m.rating >= filters.minRating);
  }

  // Experience level (based on total sessions)
  if (filters.experienceLevel) {
    if (filters.experienceLevel === 'beginner') {
      mentors = mentors.filter(m => m.total_sessions < 10);
    } else if (filters.experienceLevel === 'intermediate') {
      mentors = mentors.filter(m => m.total_sessions >= 10 && m.total_sessions < 30);
    } else if (filters.experienceLevel === 'expert') {
      mentors = mentors.filter(m => m.total_sessions >= 30);
    }
  }

  return mentors;
};

// Sort mentors
export const sortMentors = (mentors, sortBy) => {
  const sorted = [...mentors];

  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);

    case 'experience':
      return sorted.sort((a, b) => b.total_sessions - a.total_sessions);

    case 'availability':
      return sorted.sort((a, b) => {
        const aAvailable = a.max_mentees - a.current_mentees_count;
        const bAvailable = b.max_mentees - b.current_mentees_count;
        return bAvailable - aAvailable;
      });

    case 'name':
      return sorted.sort((a, b) =>
        (a.profile?.name || '').localeCompare(b.profile?.name || '')
      );

    default:
      return sorted;
  }
};

// Get mentor by user ID
export const getMentorByUserId = (userId) => {
  const mentors = getAllMentors();
  return mentors.find(m => m.user_id === userId);
};

// Get unique expertise areas
export const getUniqueExpertiseAreas = () => {
  const mentors = getAllMentors();
  const allExpertise = mentors.flatMap(m => m.expertise_areas || []);
  return [...new Set(allExpertise)].sort();
};

// ========== Mentorship Requests ==========

// Get all mentorship requests
export const getAllMentorshipRequests = () => {
  return getStoredData(STORAGE_KEYS.MENTORSHIP_REQUESTS, mockData.mentorship_requests);
};

// Get requests for a student
export const getStudentRequests = (studentId) => {
  const requests = getAllMentorshipRequests();
  return requests.filter(r => r.student_id === studentId);
};

// Get requests for a mentor
export const getMentorRequests = (mentorId) => {
  const requests = getAllMentorshipRequests();
  return requests.filter(r => r.mentor_id === mentorId);
};

// Get request by ID
export const getRequestById = (requestId) => {
  const requests = getAllMentorshipRequests();
  return requests.find(r => r.id === requestId);
};

// Create mentorship request
export const createMentorshipRequest = async (requestData) => {
  try {
    const requests = getAllMentorshipRequests();
    const newRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      requested_at: new Date().toISOString(),
      accepted_at: null,
      rejected_at: null,
      rejection_reason: null,
      updated_at: new Date().toISOString(),
      ...requestData,
    };

    requests.push(newRequest);
    saveData(STORAGE_KEYS.MENTORSHIP_REQUESTS, requests);

    return { success: true, data: newRequest };
  } catch (error) {
    console.error('Error creating mentorship request:', error);
    return { success: false, error: error.message };
  }
};

// Accept mentorship request
export const acceptMentorshipRequest = async (requestId) => {
  try {
    const requests = getAllMentorshipRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) {
      throw new Error('Request not found');
    }

    requests[requestIndex] = {
      ...requests[requestIndex],
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveData(STORAGE_KEYS.MENTORSHIP_REQUESTS, requests);

    // Update mentor's current mentees count
    const mentorProfiles = getStoredData(STORAGE_KEYS.MENTOR_PROFILES, mockData.mentor_profiles);
    const mentorIndex = mentorProfiles.findIndex(m => m.user_id === requests[requestIndex].mentor_id);
    if (mentorIndex !== -1) {
      mentorProfiles[mentorIndex].current_mentees_count += 1;
      saveData(STORAGE_KEYS.MENTOR_PROFILES, mentorProfiles);
    }

    return { success: true, data: requests[requestIndex] };
  } catch (error) {
    console.error('Error accepting mentorship request:', error);
    return { success: false, error: error.message };
  }
};

// Reject mentorship request
export const rejectMentorshipRequest = async (requestId, reason = '') => {
  try {
    const requests = getAllMentorshipRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) {
      throw new Error('Request not found');
    }

    requests[requestIndex] = {
      ...requests[requestIndex],
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    };

    saveData(STORAGE_KEYS.MENTORSHIP_REQUESTS, requests);

    return { success: true, data: requests[requestIndex] };
  } catch (error) {
    console.error('Error rejecting mentorship request:', error);
    return { success: false, error: error.message };
  }
};

// Cancel mentorship request (by student)
export const cancelMentorshipRequest = async (requestId) => {
  try {
    const requests = getAllMentorshipRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) {
      throw new Error('Request not found');
    }

    requests[requestIndex] = {
      ...requests[requestIndex],
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    };

    saveData(STORAGE_KEYS.MENTORSHIP_REQUESTS, requests);

    return { success: true, data: requests[requestIndex] };
  } catch (error) {
    console.error('Error cancelling mentorship request:', error);
    return { success: false, error: error.message };
  }
};

// ========== Mentorship Sessions ==========

// Get all sessions
export const getAllSessions = () => {
  return getStoredData(STORAGE_KEYS.MENTORSHIP_SESSIONS, mockData.mentorship_sessions);
};

// Get sessions for a mentorship request
export const getSessionsByRequestId = (requestId) => {
  const sessions = getAllSessions();
  return sessions.filter(s => s.mentorship_request_id === requestId);
};

// Get session by ID
export const getSessionById = (sessionId) => {
  const sessions = getAllSessions();
  return sessions.find(s => s.id === sessionId);
};

// Get upcoming sessions for a user (as student or mentor)
export const getUpcomingSessions = (userId) => {
  const sessions = getAllSessions();
  const requests = getAllMentorshipRequests();
  const now = new Date();

  return sessions
    .filter(s => {
      const request = requests.find(r => r.id === s.mentorship_request_id);
      if (!request) return false;

      const isParticipant = request.student_id === userId || request.mentor_id === userId;
      const isFuture = new Date(s.scheduled_date) >= now;
      const isScheduled = s.status === 'scheduled';

      return isParticipant && isFuture && isScheduled;
    })
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
};

// Get past sessions for a user
export const getPastSessions = (userId) => {
  const sessions = getAllSessions();
  const requests = getAllMentorshipRequests();
  const now = new Date();

  return sessions
    .filter(s => {
      const request = requests.find(r => r.id === s.mentorship_request_id);
      if (!request) return false;

      const isParticipant = request.student_id === userId || request.mentor_id === userId;
      const isPast = new Date(s.scheduled_date) < now || s.status === 'completed';

      return isParticipant && isPast;
    })
    .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
};

// Create session
export const createSession = async (sessionData) => {
  try {
    const sessions = getAllSessions();
    const newSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'scheduled',
      notes: null,
      feedback: null,
      rating: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...sessionData,
    };

    sessions.push(newSession);
    saveData(STORAGE_KEYS.MENTORSHIP_SESSIONS, sessions);

    return { success: true, data: newSession };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
};

// Update session
export const updateSession = async (sessionId, updateData) => {
  try {
    const sessions = getAllSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    saveData(STORAGE_KEYS.MENTORSHIP_SESSIONS, sessions);

    return { success: true, data: sessions[sessionIndex] };
  } catch (error) {
    console.error('Error updating session:', error);
    return { success: false, error: error.message };
  }
};

// Complete session with feedback
export const completeSession = async (sessionId, feedback, rating, notes) => {
  try {
    const sessions = getAllSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      status: 'completed',
      feedback,
      rating,
      notes: notes || sessions[sessionIndex].notes,
      updated_at: new Date().toISOString(),
    };

    saveData(STORAGE_KEYS.MENTORSHIP_SESSIONS, sessions);

    // Update mentor's total sessions and recalculate rating
    const session = sessions[sessionIndex];
    const requests = getAllMentorshipRequests();
    const request = requests.find(r => r.id === session.mentorship_request_id);

    if (request) {
      const mentorProfiles = getStoredData(STORAGE_KEYS.MENTOR_PROFILES, mockData.mentor_profiles);
      const mentorIndex = mentorProfiles.findIndex(m => m.user_id === request.mentor_id);

      if (mentorIndex !== -1 && rating) {
        const mentor = mentorProfiles[mentorIndex];
        const totalRating = mentor.rating * mentor.total_reviews + rating;
        const newTotalReviews = mentor.total_reviews + 1;

        mentorProfiles[mentorIndex] = {
          ...mentor,
          total_sessions: mentor.total_sessions + 1,
          total_reviews: newTotalReviews,
          rating: totalRating / newTotalReviews,
        };

        saveData(STORAGE_KEYS.MENTOR_PROFILES, mentorProfiles);
      }
    }

    return { success: true, data: sessions[sessionIndex] };
  } catch (error) {
    console.error('Error completing session:', error);
    return { success: false, error: error.message };
  }
};

// Cancel session
export const cancelSession = async (sessionId) => {
  try {
    const sessions = getAllSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    };

    saveData(STORAGE_KEYS.MENTORSHIP_SESSIONS, sessions);

    return { success: true, data: sessions[sessionIndex] };
  } catch (error) {
    console.error('Error cancelling session:', error);
    return { success: false, error: error.message };
  }
};

// Get active mentorships for a student
export const getActiveMentorships = (studentId) => {
  const requests = getAllMentorshipRequests();
  const mentors = getAllMentors();

  return requests
    .filter(r => r.student_id === studentId && r.status === 'accepted')
    .map(request => {
      const mentor = mentors.find(m => m.user_id === request.mentor_id);
      const sessions = getSessionsByRequestId(request.id);
      return {
        ...request,
        mentor,
        sessions,
      };
    });
};

// Get active mentees for a mentor
export const getActiveMentees = (mentorId) => {
  const requests = getAllMentorshipRequests();
  const users = mockData.users;
  const alumniProfiles = mockData.alumni_profiles;

  return requests
    .filter(r => r.mentor_id === mentorId && r.status === 'accepted')
    .map(request => {
      const user = users.find(u => u.id === request.student_id);
      const profile = alumniProfiles.find(p => p.user_id === request.student_id);
      const sessions = getSessionsByRequestId(request.id);
      return {
        ...request,
        student: { ...user, profile },
        sessions,
      };
    });
};

// Get mentorship statistics for a mentor
export const getMentorStats = (mentorId) => {
  const mentor = getMentorByUserId(mentorId);
  const requests = getMentorRequests(mentorId);
  const acceptedRequests = requests.filter(r => r.status === 'accepted');
  const pendingRequests = requests.filter(r => r.status === 'pending');

  return {
    rating: mentor?.rating || 0,
    totalSessions: mentor?.total_sessions || 0,
    totalReviews: mentor?.total_reviews || 0,
    currentMentees: mentor?.current_mentees_count || 0,
    maxMentees: mentor?.max_mentees || 0,
    totalMentees: acceptedRequests.length,
    pendingRequests: pendingRequests.length,
  };
};

// Register as mentor
export const registerAsMentor = async (userId, mentorData) => {
  try {
    const mentorProfiles = getStoredData(STORAGE_KEYS.MENTOR_PROFILES, mockData.mentor_profiles);
    
    // Check if already registered
    const existingMentor = mentorProfiles.find(m => m.user_id === userId);
    if (existingMentor) {
      throw new Error('User is already registered as a mentor');
    }

    const newMentor = {
      id: `mentor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      is_available: mentorData.is_available !== undefined ? mentorData.is_available : true,
      expertise_areas: mentorData.expertise_areas || [],
      max_mentees: mentorData.max_mentees || 5,
      current_mentees_count: 0,
      rating: 0.0,
      total_sessions: 0,
      total_reviews: 0,
      mentorship_approach: mentorData.mentorship_approach || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mentorProfiles.push(newMentor);
    saveData(STORAGE_KEYS.MENTOR_PROFILES, mentorProfiles);

    return { success: true, data: newMentor };
  } catch (error) {
    console.error('Error registering as mentor:', error);
    return { success: false, error: error.message };
  }
};

// Update mentor profile
export const updateMentorProfile = async (userId, updateData) => {
  try {
    const mentorProfiles = getStoredData(STORAGE_KEYS.MENTOR_PROFILES, mockData.mentor_profiles);
    const mentorIndex = mentorProfiles.findIndex(m => m.user_id === userId);

    if (mentorIndex === -1) {
      throw new Error('Mentor profile not found');
    }

    mentorProfiles[mentorIndex] = {
      ...mentorProfiles[mentorIndex],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    saveData(STORAGE_KEYS.MENTOR_PROFILES, mentorProfiles);

    return { success: true, data: mentorProfiles[mentorIndex] };
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    return { success: false, error: error.message };
  }
};

// Paginate results
export const paginateResults = (items, page = 1, pageSize = 12) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    data: items.slice(startIndex, endIndex),
    totalPages: Math.ceil(items.length / pageSize),
    totalResults: items.length,
    currentPage: page,
    hasMore: endIndex < items.length,
  };
};

export default {
  // Mentors
  getAllMentors,
  getAvailableMentors,
  searchMentors,
  filterMentors: async (filters = {}) => {
    // Wrap the synchronous filterMentors with async and proper response format
    try {
      let mentors = filterMentors(filters);
      
      // Apply sorting
      if (filters.sortBy) {
        mentors = sortMentors(mentors, filters.sortBy);
      }
      
      // Apply pagination
      const pageSize = filters.pageSize || 12;
      const page = filters.page || 1;
      const totalPages = Math.ceil(mentors.length / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedMentors = mentors.slice(startIndex, startIndex + pageSize);
      
      return {
        success: true,
        data: {
          mentors: paginatedMentors,
          totalPages,
          currentPage: page,
          total: mentors.length
        }
      };
    } catch (error) {
      console.error('Error filtering mentors:', error);
      return {
        success: false,
        error: error.message,
        data: { mentors: [], totalPages: 0 }
      };
    }
  },
  sortMentors,
  getMentorByUserId,
  getUniqueExpertiseAreas: async () => {
    // Wrap the synchronous getUniqueExpertiseAreas with async and proper response format
    try {
      const areas = getUniqueExpertiseAreas();
      return {
        success: true,
        data: areas
      };
    } catch (error) {
      console.error('Error getting expertise areas:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },
  getMentorStats,
  registerAsMentor,
  updateMentorProfile,

  // Requests
  getStudentRequests,
  getMentorRequests,
  getRequestById,
  createMentorshipRequest,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  cancelMentorshipRequest,
  getActiveMentorships,
  getActiveMentees,

  // Sessions
  getSessionsByRequestId,
  getSessionById,
  getUpcomingSessions,
  getPastSessions,
  createSession,
  updateSession,
  completeSession,
  cancelSession,

  // Utilities
  paginateResults,

  // ========== ADMIN METHODS (Override duplicates above) ==========

  getAllMentorshipRequests: async (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const requests = getStoredData(STORAGE_KEYS.MENTORSHIP_REQUESTS, mockData.mentorship_requests || []);
        const users = mockData.users || [];
        const profiles = mockData.alumni_profiles || [];
        
        // Enrich with user data
        const enrichedRequests = requests.map(req => {
          const student = users.find(u => u.id === req.student_id);
          const mentor = users.find(u => u.id === req.mentor_id);
          const studentProfile = profiles.find(p => p.user_id === req.student_id);
          const mentorProfile = profiles.find(p => p.user_id === req.mentor_id);
          
          // Get sessions for this mentorship (need to use the full array access)
          const allSessions = getStoredData(STORAGE_KEYS.MENTORSHIP_SESSIONS, mockData.mentorship_sessions || []);
          const sessions = allSessions.filter(s => s.mentorship_request_id === req.id);
          
          return {
            ...req,
            student: {
              id: student?.id,
              email: student?.email,
              first_name: student?.first_name,
              last_name: student?.last_name
            },
            mentor: {
              id: mentor?.id,
              email: mentor?.email,
              first_name: mentor?.first_name,
              last_name: mentor?.last_name
            },
            studentProfile: studentProfile || null,
            mentorProfile: mentorProfile || null,
            sessions: sessions
          };
        });
        
        // Apply filters
        let filtered = enrichedRequests;
        if (filters.status) {
          filtered = filtered.filter(r => r.status === filters.status);
        }
        
        resolve({
          success: true,
          data: filtered,
          total: filtered.length
        });
      }, 300);
    });
  },

  getAllSessions: async (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sessions = getStoredData(STORAGE_KEYS.MENTORSHIP_SESSIONS, mockData.mentorship_sessions || []);
        const requests = getStoredData(STORAGE_KEYS.MENTORSHIP_REQUESTS, mockData.mentorship_requests || []);
        const users = mockData.users || [];
        
        // Enrich with request and user data
        const enrichedSessions = sessions.map(session => {
          const request = requests.find(r => r.id === session.mentorship_request_id);
          const mentor = users.find(u => u.id === request?.mentor_id);
          const student = users.find(u => u.id === request?.student_id);
          
          return {
            ...session,
            mentor_name: mentor ? `${mentor.first_name} ${mentor.last_name}` : 'Unknown',
            student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown',
            agenda: session.agenda || 'No agenda set'
          };
        });
        
        // Apply filters
        let filtered = enrichedSessions;
        if (filters.status) {
          filtered = filtered.filter(s => s.status === filters.status);
        }
        
        resolve({
          success: true,
          data: filtered,
          total: filtered.length
        });
      }, 300);
    });
  },

  getMentors: async (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mentorProfiles = getStoredData(STORAGE_KEYS.MENTOR_PROFILES, mockData.mentor_profiles || []);
        const users = mockData.users || [];
        const profiles = mockData.alumni_profiles || [];
        
        // Enrich with user and profile data
        const enrichedMentors = mentorProfiles.map(mentor => {
          const user = users.find(u => u.id === mentor.user_id);
          const profile = profiles.find(p => p.user_id === mentor.user_id);
          
          return {
            ...mentor,
            id: mentor.user_id,
            name: profile?.name || (user ? `${user.first_name} ${user.last_name}` : 'Unknown'),
            email: user?.email,
            current_role: profile?.current_role || 'Mentor',
            photo_url: profile?.photo_url,
            expertise_areas: mentor.expertise_areas || []
          };
        });
        
        // Apply filters
        let filtered = enrichedMentors;
        if (filters.is_available !== undefined) {
          filtered = filtered.filter(m => m.is_available === filters.is_available);
        }
        
        resolve({
          success: true,
          data: filtered,
          total: filtered.length
        });
      }, 300);
    });
  }
};
