import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

import mockSkillGraphServiceFunctions from './mockSkillGraphService';

class SkillGraphService {
  async getSkillGraph() {
    if (USE_MOCK_DATA) {
      return mockSkillGraphServiceFunctions.getSkillGraph();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/skills/graph`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getSkillDetails(skillName) {
    if (USE_MOCK_DATA) {
      return mockSkillGraphServiceFunctions.getSkillDetails(skillName);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/skills/${encodeURIComponent(skillName)}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getRelatedSkills(skillName) {
    if (USE_MOCK_DATA) {
      return mockSkillGraphServiceFunctions.getRelatedSkills(skillName);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/skills/${encodeURIComponent(skillName)}/related`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getTrendingSkills() {
    if (USE_MOCK_DATA) {
      return mockSkillGraphServiceFunctions.getTrendingSkills();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/skills/trending`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async searchSkills(query) {
    if (USE_MOCK_DATA) {
      return mockSkillGraphServiceFunctions.searchSkills(query);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/skills/search`, { params: { q: query } });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }
}

export default new SkillGraphService();
