import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Badge Service API
class ApiBadgeService {
  // Get all badges with earned counts
  async getAllBadges() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/aes/badges`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get badge by ID
  async getBadgeById(badgeId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/aes/badges/${badgeId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create new badge (admin)
  async createBadge(badgeData) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/badges`, badgeData);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update badge (admin)
  async updateBadge(badgeId, badgeData) {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/admin/badges/${badgeId}`, badgeData);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete badge (admin)
  async deleteBadge(badgeId) {
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/admin/badges/${badgeId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get user badges
  async getUserBadges(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/aes/user/${userId}/badges`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Award badge to user (admin)
  async awardBadge(userId, badgeId) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/badges/award`, {
        user_id: userId,
        badge_id: badgeId
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get my badges (current user)
  async getMyBadges() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/aes/my-badges`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Check and award badges based on criteria
  async checkAndAwardBadges(userId) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/aes/badges/check-and-award`, {
        user_id: userId
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new ApiBadgeService();
