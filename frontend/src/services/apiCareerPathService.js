import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Career Path Service API
class ApiCareerPathService {
  // Get career paths
  async getCareerPaths(filters = {}) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/career-paths`, { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get career path by ID
  async getCareerPathById(pathId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/career-paths/${pathId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get career transitions
  async getCareerTransitions() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/career-paths/transitions`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get recommended paths for user
  async getRecommendedPaths(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/career-paths/recommended/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }
}

export default new ApiCareerPathService();
