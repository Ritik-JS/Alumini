import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

import mockKnowledgeServiceFunctions from './mockKnowledgeService';

class KnowledgeService {
  async getCapsules(filters = {}) {
    if (USE_MOCK_DATA) {
      return mockKnowledgeServiceFunctions.getCapsules(filters);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/knowledge/capsules`, { params: filters });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getCapsuleById(capsuleId) {
    if (USE_MOCK_DATA) {
      return mockKnowledgeServiceFunctions.getCapsuleById(capsuleId);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/knowledge/capsules/${capsuleId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async createCapsule(capsuleData) {
    if (USE_MOCK_DATA) {
      return mockKnowledgeServiceFunctions.createCapsule(capsuleData);
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/knowledge/capsules`, capsuleData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async updateCapsule(capsuleId, capsuleData) {
    if (USE_MOCK_DATA) {
      return mockKnowledgeServiceFunctions.updateCapsule(capsuleId, capsuleData);
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/knowledge/capsules/${capsuleId}`, capsuleData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async deleteCapsule(capsuleId) {
    if (USE_MOCK_DATA) {
      return mockKnowledgeServiceFunctions.deleteCapsule(capsuleId);
    } else {
      try {
        const response = await axios.delete(`${BACKEND_URL}/api/knowledge/capsules/${capsuleId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async likeCapsule(capsuleId) {
    if (USE_MOCK_DATA) {
      return mockKnowledgeServiceFunctions.likeCapsule(capsuleId);
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/knowledge/capsules/${capsuleId}/like`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async bookmarkCapsule(capsuleId) {
    if (USE_MOCK_DATA) {
      return mockKnowledgeServiceFunctions.bookmarkCapsule(capsuleId);
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/knowledge/capsules/${capsuleId}/bookmark`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getBookmarkedCapsules() {
    if (USE_MOCK_DATA) {
      return mockKnowledgeServiceFunctions.getBookmarkedCapsules();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/knowledge/bookmarks`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }
}

export default new KnowledgeService();
