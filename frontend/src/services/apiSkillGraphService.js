import axios from './axiosConfig';

// Real Skill Graph Service API
class ApiSkillGraphService {
  // Get skill graph data (skill network)
  async getSkillGraph(filters = {}) {
    try {
      const response = await axios.get('/api/skill-graph/network', {
        params: filters
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get skill details
  async getSkillDetails(skillName) {
    try {
      const response = await axios.get(`/api/skill-graph/skill/${encodeURIComponent(skillName)}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get related skills (AI-powered)
  async getRelatedSkills(skillName, limit = 10) {
    try {
      const response = await axios.get(
        `/api/skill-graph/related/${encodeURIComponent(skillName)}`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get trending skills
  async getTrendingSkills(limit = 20) {
    try {
      const response = await axios.get('/api/skill-graph/trending', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get skill clusters
  async getSkillClusters(minPopularity = 0.0) {
    try {
      const response = await axios.get('/api/skill-graph/clusters', {
        params: { min_popularity: minPopularity }
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Find career paths by skill
  async getCareerPathsBySkill(skillName, limit = 10) {
    try {
      const response = await axios.get('/api/skill-graph/paths', {
        params: { skill: skillName, limit }
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get all unique industries (from heatmap)
  async getIndustries() {
    try {
      const response = await axios.get('/api/heatmap/industries');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }
}

export default new ApiSkillGraphService();
