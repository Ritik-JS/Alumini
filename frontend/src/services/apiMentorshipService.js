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

  // Get mentor profile
  async getMentorProfile(userId) {
    try {
      const response = await axios.get(`/api/mentors/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
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
        reason,
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
