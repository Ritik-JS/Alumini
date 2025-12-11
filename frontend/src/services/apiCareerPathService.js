import axios from './axiosConfig';

// Real Career Path Service API
class ApiCareerPathService {
  // Get career paths
  async getCareerPaths(filters = {}) {
    try {
      const response = await axios.get('/api/career-paths', { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get career path by ID
  async getCareerPathById(pathId) {
    try {
      const response = await axios.get(`/api/career-paths/${pathId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get career transitions
  async getCareerTransitions() {
    try {
      const response = await axios.get('/api/career-paths/transitions');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get recommended paths for user
  async getRecommendedPaths(userId) {
    try {
      const response = await axios.get(`/api/career-paths/recommended/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get all unique roles
  async getRoles() {
    try {
      const response = await axios.get('/api/career-paths/roles');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get alumni profile for success story
  async getAlumniProfile(alumniId) {
    try {
      const response = await axios.get(`/api/profiles/${alumniId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiCareerPathService();
