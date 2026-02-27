import axios from './axiosConfig';

// Real Leaderboard Service API
class ApiLeaderboardService {
  // Get leaderboard
  async getLeaderboard(filters = {}) {
    try {
      const response = await axios.get('/api/engagement/leaderboard', { params: filters });
      // Backend returns: { entries: [...], total_users: X, user_rank: Y }
      // Standardize to: { success: true, data: { ... } }
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return { 
        success: false, 
        message: error.message, 
        data: { entries: [], total_users: 0, user_rank: null } 
      };
    }
  }

  // Get user engagement score
  async getUserScore(userId) {
    try {
      const response = await axios.get(`/api/leaderboard/user/${userId}`);
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Error fetching user score:', error);
      return { 
        success: false, 
        message: error.message,
        data: null
      };
    }
  }

  // Get all badges
  async getAllBadges() {
    try {
      const response = await axios.get('/api/engagement/badges');
      // Backend returns array of badges directly
      // Standardize to: { success: true, data: [...] }
      return { 
        success: true, 
        data: Array.isArray(response.data) ? response.data : [] 
      };
    } catch (error) {
      console.error('Error fetching badges:', error);
      return { 
        success: false, 
        message: error.message, 
        data: [] 
      };
    }
  }

  // Get user badges
  async getUserBadges(userId) {
    try {
      const response = await axios.get('/api/engagement/my-badges');
      // Backend returns array of user badges directly
      // Standardize to: { success: true, data: [...] }
      return { 
        success: true, 
        data: Array.isArray(response.data) ? response.data : [] 
      };
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return { 
        success: false, 
        message: error.message, 
        data: [] 
      };
    }
  }

  // Get my engagement score
  async getMyScore(userId) {
    try {
      const response = await axios.get('/api/engagement/my-score');
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Error fetching my score:', error);
      return { 
        success: false, 
        message: error.message, 
        data: { total_score: 0, rank_position: null } 
      };
    }
  }
}

export default new ApiLeaderboardService();
