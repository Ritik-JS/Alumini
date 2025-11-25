import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Leaderboard Service API
class ApiLeaderboardService {
  // Get leaderboard
  async getLeaderboard(filters = {}) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/leaderboard`, { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get user engagement score
  async getUserScore(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/leaderboard/user/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get all badges
  async getAllBadges() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/badges`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get user badges
  async getUserBadges(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/badges/user/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }
}

export default new ApiLeaderboardService();
