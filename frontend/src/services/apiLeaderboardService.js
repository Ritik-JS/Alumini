import axios from './axiosConfig';

// Real Leaderboard Service API
class ApiLeaderboardService {
  // Get leaderboard
  async getLeaderboard(filters = {}) {
    try {
      const response = await axios.get('/api/engagement/leaderboard', { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get user engagement score
  async getUserScore(userId) {
    try {
      const response = await axios.get(`/api/leaderboard/user/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get all badges
  async getAllBadges() {
    try {
      const response = await axios.get('/api/engagement/badges');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get user badges
  async getUserBadges(userId) {
    try {
      const response = await axios.get('/api/engagement/my-badges');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get my engagement score
  async getMyScore(userId) {
    try {
      const response = await axios.get('/api/engagement/my-score');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message, data: { total_score: 0 } };
    }
  }
}

export default new ApiLeaderboardService();
