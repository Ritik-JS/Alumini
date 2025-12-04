import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Import all mock functions from the original mockMentorshipService
import mockMentorshipServiceFunctions from './mockMentorshipService';

class MentorshipService {
  async getMentors(filters = {}) {
    if (USE_MOCK_DATA) {
      const mentors = mockMentorshipServiceFunctions.filterMentors(filters);
      return { success: true, data: mentors };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/mentors`, { params: filters });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getMentorProfile(userId) {
    if (USE_MOCK_DATA) {
      const mentor = mockMentorshipServiceFunctions.getMentorByUserId(userId);
      return { success: true, data: mentor };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/mentors/${userId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async createMentorshipRequest(requestData) {
    if (USE_MOCK_DATA) {
      return mockMentorshipServiceFunctions.createMentorshipRequest(requestData);
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/mentorship/requests`, requestData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getMyRequests() {
    if (USE_MOCK_DATA) {
      const userData = localStorage.getItem('user') || localStorage.getItem('auth_user');
      if (!userData) return { success: false, message: 'Not authenticated', data: [] };
      const user = JSON.parse(userData);
      const requests = mockMentorshipServiceFunctions.getStudentRequests(user.id);
      return { success: true, data: requests };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/mentorship/my-requests`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getReceivedRequests() {
    if (USE_MOCK_DATA) {
      const userData = localStorage.getItem('user') || localStorage.getItem('auth_user');
      if (!userData) return { success: false, message: 'Not authenticated', data: [] };
      const user = JSON.parse(userData);
      const requests = mockMentorshipServiceFunctions.getMentorRequests(user.id);
      return { success: true, data: requests };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/mentorship/received-requests`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async acceptRequest(requestId) {
    if (USE_MOCK_DATA) {
      return mockMentorshipServiceFunctions.acceptMentorshipRequest(requestId);
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/mentorship/requests/${requestId}/accept`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async rejectRequest(requestId, reason = '') {
    if (USE_MOCK_DATA) {
      return mockMentorshipServiceFunctions.rejectMentorshipRequest(requestId, reason);
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/mentorship/requests/${requestId}/reject`, { reason });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getMySessions() {
    if (USE_MOCK_DATA) {
      const userData = localStorage.getItem('user') || localStorage.getItem('auth_user');
      if (!userData) return { success: false, message: 'Not authenticated', data: [] };
      const user = JSON.parse(userData);
      const sessions = mockMentorshipServiceFunctions.getUpcomingSessions(user.id);
      return { success: true, data: sessions };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/mentorship/sessions`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getSessionById(sessionId) {
    if (USE_MOCK_DATA) {
      const session = mockMentorshipServiceFunctions.getSessionById(sessionId);
      return { success: true, data: session };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/mentorship/sessions/${sessionId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async scheduleSession(sessionData) {
    if (USE_MOCK_DATA) {
      return mockMentorshipServiceFunctions.createSession(sessionData);
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/mentorship/sessions`, sessionData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async updateSession(sessionId, sessionData) {
    if (USE_MOCK_DATA) {
      return mockMentorshipServiceFunctions.updateSession(sessionId, sessionData);
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/mentorship/sessions/${sessionId}`, sessionData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async completeSession(sessionId, feedback) {
    if (USE_MOCK_DATA) {
      return mockMentorshipServiceFunctions.completeSession(sessionId, feedback.feedback, feedback.rating, feedback.notes);
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/mentorship/sessions/${sessionId}/complete`, feedback);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
}

export default new MentorshipService();
