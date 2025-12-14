/**
 * Mentorship Service - Real API Integration
 * Connects to MySQL database through backend API endpoints
 */

import api from './axiosConfig';

const mentorshipService = {
  // ============================================================================
  // MENTOR MANAGEMENT
  // ============================================================================

  /**
   * Get all available mentors with filtering and pagination
   */
  filterMentors: async (params) => {
    try {
      const response = await api.post('/api/mentors/filter', params);
      return response.data;
    } catch (error) {
      console.error('Error filtering mentors:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to filter mentors',
        data: { mentors: [], total: 0, totalPages: 0 }
      };
    }
  },

  /**
   * Get mentor profile by user ID
   */
  getMentorByUserId: async (userId) => {
    try {
      const response = await api.get(`/api/mentors/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting mentor by user ID:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get mentor profile',
        data: null
      };
    }
  },

  /**
   * Get unique expertise areas for filtering
   */
  getUniqueExpertiseAreas: async () => {
    try {
      const response = await api.get('/api/mentors/expertise-areas');
      return response.data;
    } catch (error) {
      console.error('Error getting expertise areas:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get expertise areas',
        data: []
      };
    }
  },

  /**
   * Register as mentor
   */
  registerAsMentor: async (userId, profileData) => {
    try {
      const response = await api.post('/api/mentors/register', profileData);
      return response.data;
    } catch (error) {
      console.error('Error registering as mentor:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to register as mentor'
      };
    }
  },

  /**
   * Update mentor profile
   */
  updateMentorProfile: async (userId, profileData) => {
    try {
      const response = await api.put('/api/mentors/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating mentor profile:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update mentor profile'
      };
    }
  },

  // ============================================================================
  // MENTORSHIP REQUESTS
  // ============================================================================

  /**
   * Get mentorship requests sent by student
   */
  getStudentRequests: async (userId) => {
    try {
      const response = await api.get('/api/mentorship/requests/sent');
      return response.data;
    } catch (error) {
      console.error('Error getting student requests:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get student requests',
        data: []
      };
    }
  },

  /**
   * Get mentorship requests received by mentor
   */
  getMentorRequests: async (userId) => {
    try {
      const response = await api.get('/api/mentorship/received-requests');
      return response.data;
    } catch (error) {
      console.error('Error getting mentor requests:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get mentor requests',
        data: []
      };
    }
  },

  /**
   * Get all mentorship requests (both sent and received)
   */
  getAllMentorshipRequests: async () => {
    try {
      const response = await api.get('/api/mentorship/my-requests');
      return {
        success: true,
        data: [
          ...(response.data.data?.sent || []),
          ...(response.data.data?.received || [])
        ]
      };
    } catch (error) {
      console.error('Error getting all mentorship requests:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get mentorship requests',
        data: []
      };
    }
  },

  /**
   * Get active mentorships (accepted requests)
   */
  getActiveMentorships: async (userId) => {
    try {
      const response = await api.get('/api/mentorship/active');
      return response.data;
    } catch (error) {
      console.error('Error getting active mentorships:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get active mentorships',
        data: []
      };
    }
  },

  /**
   * Get active mentees for mentor
   */
  getActiveMentees: async (userId) => {
    try {
      const response = await api.get('/api/mentorship/my-mentees');
      return response.data;
    } catch (error) {
      console.error('Error getting active mentees:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get active mentees',
        data: []
      };
    }
  },

  /**
   * Get mentorship request by ID
   */
  getRequestById: async (requestId) => {
    try {
      const response = await api.get(`/api/mentorship/requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting request by ID:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get request',
        data: null
      };
    }
  },

  /**
   * Send mentorship request
   */
  sendMentorshipRequest: async (requestData) => {
    try {
      const response = await api.post('/api/mentorship/requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Error sending mentorship request:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to send mentorship request'
      };
    }
  },

  /**
   * Accept mentorship request (mentor only)
   */
  acceptMentorshipRequest: async (requestId) => {
    try {
      const response = await api.put(`/api/mentorship/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting mentorship request:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to accept mentorship request'
      };
    }
  },

  /**
   * Reject mentorship request (mentor only)
   */
  rejectMentorshipRequest: async (requestId, reason) => {
    try {
      const response = await api.put(`/api/mentorship/requests/${requestId}/reject`, {
        rejection_reason: reason || 'No reason provided'
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting mentorship request:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to reject mentorship request'
      };
    }
  },

  /**
   * Cancel mentorship request (student only)
   */
  cancelMentorshipRequest: async (requestId) => {
    try {
      const response = await api.put(`/api/mentorship/requests/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling mentorship request:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to cancel mentorship request'
      };
    }
  },

  // ============================================================================
  // MENTORSHIP SESSIONS
  // ============================================================================

  /**
   * Get all sessions for user
   */
  getSessions: async (userId, status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/api/mentorship/sessions', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting sessions:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get sessions',
        data: []
      };
    }
  },

  /**
   * Get upcoming sessions
   */
  getUpcomingSessions: async (userId) => {
    try {
      const response = await api.get('/api/mentorship/sessions/upcoming');
      return response.data;
    } catch (error) {
      console.error('Error getting upcoming sessions:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get upcoming sessions',
        data: []
      };
    }
  },

  /**
   * Get past sessions
   */
  getPastSessions: async (userId) => {
    try {
      const response = await api.get('/api/mentorship/sessions/past');
      return response.data;
    } catch (error) {
      console.error('Error getting past sessions:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get past sessions',
        data: []
      };
    }
  },

  /**
   * Get session by ID
   */
  getSessionById: async (sessionId) => {
    try {
      const response = await api.get(`/api/mentorship/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting session by ID:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get session',
        data: null
      };
    }
  },

  /**
   * Get sessions by request ID
   */
  getSessionsByRequestId: async (requestId) => {
    try {
      const response = await api.get(`/api/mentorship/requests/${requestId}/sessions`);
      return response.data;
    } catch (error) {
      console.error('Error getting sessions by request ID:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get sessions',
        data: []
      };
    }
  },

  /**
   * Schedule a new session
   */
  scheduleSession: async (sessionData) => {
    try {
      const response = await api.post('/api/mentorship/sessions', sessionData);
      return response.data;
    } catch (error) {
      console.error('Error scheduling session:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to schedule session'
      };
    }
  },

  /**
   * Update session
   */
  updateSession: async (sessionId, sessionData) => {
    try {
      const response = await api.put(`/api/mentorship/sessions/${sessionId}`, sessionData);
      return response.data;
    } catch (error) {
      console.error('Error updating session:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update session'
      };
    }
  },

  /**
   * Cancel session
   */
  cancelSession: async (sessionId) => {
    try {
      const response = await api.put(`/api/mentorship/sessions/${sessionId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling session:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to cancel session'
      };
    }
  },

  /**
   * Complete session
   */
  completeSession: async (sessionId) => {
    try {
      const response = await api.put(`/api/mentorship/sessions/${sessionId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error completing session:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to complete session'
      };
    }
  },

  /**
   * Submit session feedback
   */
  submitFeedback: async (sessionId, feedbackData) => {
    try {
      const response = await api.post(`/api/mentorship/sessions/${sessionId}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to submit feedback'
      };
    }
  },
};

export default mentorshipService;
