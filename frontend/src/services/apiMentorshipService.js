import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Mentorship Service API
class ApiMentorshipService {
  // Get all mentors
  async getMentors(filters = {}) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/mentors`, { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get mentor profile
  async getMentorProfile(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/mentors/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Create mentorship request
  async createMentorshipRequest(requestData) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/mentorship/requests`, requestData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get my mentorship requests (as student)
  async getMyRequests() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/mentorship/my-requests`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get received mentorship requests (as mentor)
  async getReceivedRequests() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/mentorship/received-requests`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Accept mentorship request
  async acceptRequest(requestId) {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/mentorship/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Reject mentorship request
  async rejectRequest(requestId, reason = '') {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/mentorship/requests/${requestId}/reject`, {
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
      const response = await axios.get(`${BACKEND_URL}/api/mentorship/sessions`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get session details
  async getSessionById(sessionId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/mentorship/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Schedule session
  async scheduleSession(sessionData) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/mentorship/sessions`, sessionData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update session
  async updateSession(sessionId, sessionData) {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/mentorship/sessions/${sessionId}`,
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
        `${BACKEND_URL}/api/mentorship/sessions/${sessionId}/complete`,
        feedback
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiMentorshipService();
