import axios from './axiosConfig';

// Real Analytics Service API
class ApiAnalyticsService {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await axios.get('/api/admin/analytics/dashboard');
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get user growth over time
  async getUserGrowth(period = 'monthly') {
    try {
      const response = await axios.get('/api/admin/analytics/user-growth', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get engagement metrics
  async getEngagementMetrics() {
    try {
      const response = await axios.get('/api/admin/analytics/engagement');
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get top contributors
  async getTopContributors(limit = 10) {
    try {
      const response = await axios.get('/api/admin/analytics/top-contributors', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get platform activity breakdown
  async getPlatformActivity(days = 30) {
    try {
      const response = await axios.get('/api/admin/analytics/activity', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get analytics by category
  async getAnalyticsByCategory(category) {
    try {
      const response = await axios.get(`/api/admin/analytics/${category}`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get alumni analytics
  async getAlumniAnalytics() {
    try {
      const response = await axios.get('/api/admin/analytics/alumni');
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get job analytics
  async getJobAnalytics() {
    try {
      const response = await axios.get('/api/admin/analytics/jobs');
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get mentorship analytics
  async getMentorshipAnalytics() {
    try {
      const response = await axios.get('/api/admin/analytics/mentorship');
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Get event analytics
  async getEventAnalytics() {
    try {
      const response = await axios.get('/api/admin/analytics/events');
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }
}

export default new ApiAnalyticsService();
