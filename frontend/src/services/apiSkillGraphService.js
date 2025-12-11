import axios from './axiosConfig';

// Real Skill Graph Service API
class ApiSkillGraphService {
  // Get skill graph data
  async getSkillGraph() {
    try {
      const response = await axios.get('/api/skills/graph');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get skill details
  async getSkillDetails(skillName) {
    try {
      const response = await axios.get(`/api/skills/${encodeURIComponent(skillName)}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get related skills
  async getRelatedSkills(skillName) {
    try {
      const response = await axios.get(
        `/api/skills/${encodeURIComponent(skillName)}/related`
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get trending skills
  async getTrendingSkills() {
    try {
      const response = await axios.get('/api/skills/trending');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Search skills
  async searchSkills(query) {
    try {
      const response = await axios.get('/api/skills/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get alumni by skill
  async getAlumniBySkill(skillName) {
    try {
      const response = await axios.get(`/api/skills/${encodeURIComponent(skillName)}/alumni`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get all unique industries
  async getIndustries() {
    try {
      const response = await axios.get('/api/skills/industries');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }
}

export default new ApiSkillGraphService();
