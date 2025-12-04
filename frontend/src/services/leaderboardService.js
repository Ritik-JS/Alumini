import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

import mockLeaderboardServiceFunctions from './mockLeaderboardService';

class LeaderboardService {
  async getLeaderboard(filters = {}) {
    if (USE_MOCK_DATA) {
      return mockLeaderboardServiceFunctions.getLeaderboard(filters);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/leaderboard`, { params: filters });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getUserScore(userId) {
    if (USE_MOCK_DATA) {
      return mockLeaderboardServiceFunctions.getUserScore(userId);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/leaderboard/user/${userId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getAllBadges() {
    if (USE_MOCK_DATA) {
      return mockLeaderboardServiceFunctions.getAllBadges();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/badges`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getUserBadges(userId) {
    if (USE_MOCK_DATA) {
      return mockLeaderboardServiceFunctions.getUserBadges(userId);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/badges/user/${userId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }
}

export default new LeaderboardService();
