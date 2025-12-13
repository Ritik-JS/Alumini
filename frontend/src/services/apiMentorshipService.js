import axios from './axiosConfig';

// Real Mentorship Service API
class ApiMentorshipService {
  // Get all mentors
  async getMentors(filters = {}) {
    try {
      const response = await axios.get('/api/mentors', { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Filter mentors with complex criteria
  async filterMentors(filters = {}) {
    try {
      const params = {};
      
      // Handle expertise filter
      if (filters.expertise && filters.expertise.length > 0) {
        params.expertise = Array.isArray(filters.expertise) 
          ? filters.expertise.join(',') 
          : filters.expertise;
      }
      
      // Handle rating filter
      if (filters.minRating || filters.min_rating) {
        params.min_rating = filters.minRating || filters.min_rating;
      }
      
      // Handle availability filter
      if (filters.availableOnly !== undefined || filters.available_only !== undefined) {
        params.available_only = filters.availableOnly ?? filters.available_only ?? true;
      }
      
      // Handle location filter
      if (filters.location) {
        params.location = filters.location;
      }
      
      // Handle company filter
      if (filters.company) {
        params.company = filters.company;
      }
      
      // Handle pagination
      if (filters.page) {
        params.page = filters.page;
      }
      if (filters.limit) {
        params.limit = filters.limit;
      }
      
      const response = await axios.get('/api/mentors', { params });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: { mentors: [], total: 0 } };
    }
  }

  // Get unique expertise areas for filtering
  async getUniqueExpertiseAreas() {
    try {
      const response = await axios.get('/api/mentors/expertise-areas');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get mentor profile
  async getMentorProfile(userId) {
    try {
      const response = await axios.get(`/api/mentors/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Register as mentor
  async registerAsMentor(profileData) {
    try {
      const response = await axios.post('/api/mentors/register', profileData);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || error.message 
      };
    }
  }

  // Update mentor profile
  async updateMentorProfile(profileData) {
    try {
      const response = await axios.put('/api/mentors/profile', profileData);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || error.message 
      };
    }
  }

  // Create mentorship request
  async createMentorshipRequest(requestData) {
    try {
      const response = await axios.post('/api/mentorship/requests', requestData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get my mentorship requests (as student)
  async getMyRequests() {
    try {
      const response = await axios.get('/api/mentorship/my-requests');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get specific mentorship request by ID
  async getRequestById(requestId) {
    try {
      const response = await axios.get(`/api/mentorship/requests/${requestId}`);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || error.message 
      };
    }
  }

  // Get sessions for a specific mentorship request
  async getSessionsByRequestId(requestId) {
    try {
      const response = await axios.get(`/api/mentorship/requests/${requestId}/sessions`);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || error.message,
        data: []
      };
    }
  }

  // Get received mentorship requests (as mentor)
  async getReceivedRequests() {
    try {
      const response = await axios.get('/api/mentorship/received-requests');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Accept mentorship request
  async acceptRequest(requestId) {
    try {
      const response = await axios.put(`/api/mentorship/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Reject mentorship request
  async rejectRequest(requestId, reason = '') {
    try {
      const response = await axios.put(`/api/mentorship/requests/${requestId}/reject`, {
        rejection_reason: reason,
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get mentorship sessions
  async getMySessions() {
    try {
      const response = await axios.get('/api/mentorship/sessions');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get session details
  async getSessionById(sessionId) {
    try {
      const response = await axios.get(`/api/mentorship/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Schedule session
  async scheduleSession(sessionData) {
    try {
      const response = await axios.post('/api/mentorship/sessions', sessionData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update session
  async updateSession(sessionId, sessionData) {
    try {
      const response = await axios.put(
        `/api/mentorship/sessions/${sessionId}`,
        sessionData
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Complete session
  async completeSession(sessionId, feedback) {
    try {
      const response = await axios.put(
        `/api/mentorship/sessions/${sessionId}/complete`,
        feedback
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Cancel session
  async cancelSession(sessionId) {
    try {
      const response = await axios.put(
        `/api/mentorship/sessions/${sessionId}/cancel`
      );
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || error.message 
      };
    }
  }

  // ========== WRAPPER METHODS (For Dashboard Compatibility) ==========

  // Get mentor by user ID (wrapper for checking mentor status)
  async getMentorByUserId(userId) {
    try {
      const response = await axios.get(`/api/mentors/${userId}`);
      return { success: response.status === 200, data: response.data };
    } catch (error) {
      return { success: false, data: null };
    }
  }

  // Get student requests (wrapper for getMyRequests)
  async getStudentRequests(userId) {
    try {
      const response = await axios.get('/api/mentorship/my-requests');
      return {
        success: response.data.success,
        data: response.data.data?.sent || response.data.data || [],
      };
    } catch (error) {
      return { success: false, data: [], message: error.message };
    }
  }

  // Get active mentees (wrapper for mentor view)
  async getActiveMentees(userId) {
    try {
      const response = await axios.get('/api/mentorship/active');
      return {
        success: response.data.success,
        data: response.data.data || [],
      };
    } catch (error) {
      return { success: false, data: [], message: error.message };
    }
  }

  // Get mentor requests received (wrapper)
  async getMentorRequests(userId) {
    try {
      const response = await axios.get('/api/mentorship/received-requests');
      return {
        success: response.data.success,
        data: response.data.data || [],
      };
    } catch (error) {
      return { success: false, data: [], message: error.message };
    }
  }

  // Get active mentorships
  async getActiveMentorships(userId) {
    try {
      const response = await axios.get('/api/mentorship/active');
      return {
        success: response.data.success,
        data: response.data.data || [],
      };
    } catch (error) {
      return { success: false, data: [], message: error.message };
    }
  }

  // Get upcoming sessions
  async getUpcomingSessions(userId) {
    try {
      const response = await axios.get('/api/mentorship/sessions?status=scheduled');
      return {
        success: response.data.success,
        data: response.data.data || [],
      };
    } catch (error) {
      return { success: false, data: [], message: error.message };
    }
  }

  // Get past sessions
  async getPastSessions(userId) {
    try {
      const response = await axios.get('/api/mentorship/sessions?status=completed');
      return {
        success: response.data.success,
        data: response.data.data || [],
      };
    } catch (error) {
      return { success: false, data: [], message: error.message };
    }
  }

  // Cancel mentorship request
  async cancelMentorshipRequest(requestId) {
    try {
      // Currently backend doesn't have a cancel endpoint for requests
      // Users can only reject (for mentors) or wait for it to expire
      return { 
        success: false, 
        message: 'Mentorship request cancellation is not available. Please contact the mentor to decline.' 
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Acceptance mentorship request
  async acceptMentorshipRequest(requestId) {
    return this.acceptRequest(requestId);
  }

  // Reject mentorship request
  async rejectMentorshipRequest(requestId, reason) {
    return this.rejectRequest(requestId, reason);
  }

  // ========== ADMIN METHODS ==========

  // Get all mentorship requests (Admin only)
  async getAllMentorshipRequests(filters = {}) {
    try {
      const response = await axios.get('/api/admin/mentorship/requests', {
        params: filters
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get all sessions (Admin only)
  async getAllSessions(filters = {}) {
    try {
      const response = await axios.get('/api/admin/mentorship/sessions', {
        params: filters
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get all mentor profiles (Admin only)
  async getAllMentorProfiles(filters = {}) {
    try {
      const response = await axios.get('/api/admin/mentors', {
        params: filters
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }
}

export default new ApiMentorshipService();
