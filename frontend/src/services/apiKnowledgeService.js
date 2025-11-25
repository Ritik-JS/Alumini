import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Knowledge Service API
class ApiKnowledgeService {
  // Get all knowledge capsules
  async getCapsules(filters = {}) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/knowledge/capsules`, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get capsule by ID
  async getCapsuleById(capsuleId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/knowledge/capsules/${capsuleId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Create knowledge capsule
  async createCapsule(capsuleData) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/knowledge/capsules`, capsuleData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update capsule
  async updateCapsule(capsuleId, capsuleData) {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/knowledge/capsules/${capsuleId}`,
        capsuleData
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Delete capsule
  async deleteCapsule(capsuleId) {
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/knowledge/capsules/${capsuleId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Like capsule
  async likeCapsule(capsuleId) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/knowledge/capsules/${capsuleId}/like`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Bookmark capsule
  async bookmarkCapsule(capsuleId) {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/knowledge/capsules/${capsuleId}/bookmark`
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get bookmarked capsules
  async getBookmarkedCapsules() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/knowledge/bookmarks`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }
}

export default new ApiKnowledgeService();
