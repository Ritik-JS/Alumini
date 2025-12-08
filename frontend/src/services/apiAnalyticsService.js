import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Analytics Service API
class ApiAnalyticsService {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get user growth over time
  async getUserGrowth(period = 'monthly') {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/user-growth`, {
        params: { period },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get engagement metrics
  async getEngagementMetrics() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/engagement`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get top contributors
  async getTopContributors(limit = 10) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/top-contributors`, {
        params: { limit },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get platform activity breakdown
  async getPlatformActivity(days = 30) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/activity`, {
        params: { days },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get analytics by category
  async getAnalyticsByCategory(category) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/${category}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get alumni analytics
  async getAlumniAnalytics() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/alumni`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get job analytics
  async getJobAnalytics() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/jobs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get mentorship analytics
  async getMentorshipAnalytics() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/mentorship`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get event analytics
  async getEventAnalytics() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics/events`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }
}

export default new ApiAnalyticsService();
