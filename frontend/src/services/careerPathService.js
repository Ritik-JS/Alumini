import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

import mockCareerPathServiceFunctions from './mockCareerPathService';

class CareerPathService {
  async getCareerPaths(filters = {}) {
    if (USE_MOCK_DATA) {
      return mockCareerPathServiceFunctions.getCareerPaths(filters);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/career-paths`, { params: filters });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getCareerPathById(pathId) {
    if (USE_MOCK_DATA) {
      return mockCareerPathServiceFunctions.getCareerPathById(pathId);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/career-paths/${pathId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getCareerTransitions() {
    if (USE_MOCK_DATA) {
      return mockCareerPathServiceFunctions.getCareerTransitions();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/career-paths/transitions`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getRecommendedPaths(userId) {
    if (USE_MOCK_DATA) {
      return mockCareerPathServiceFunctions.getRecommendedPaths(userId);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/career-paths/recommended/${userId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }
}

export default new CareerPathService();
