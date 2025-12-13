import axios from './axiosConfig';

// Real Skill Graph Service API
class ApiSkillGraphService {
  // Get skill graph data (flat skills list for visualization)
  async getSkillGraph(filters = {}) {
    try {
      const response = await axios.get('/api/skills/list', {
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

  // Get alumni profiles by skill (using profiles search endpoint)
  async getAlumniBySkill(skillName, limit = 20) {
    try {
      const response = await axios.get('/api/profiles/search', {
        params: {
          skills: skillName,
          limit: limit,
          page: 1
        }
      });
      return {
        success: true,
        data: response.data?.data?.profiles || [],
        count: response.data?.data?.total || 0,
        message: `Found ${response.data?.data?.total || 0} alumni with ${skillName}`
      };
    } catch (error) {
      console.error('Error fetching alumni by skill:', error);
      return { 
        success: false, 
        message: error.message, 
        data: [],
        count: 0
      };
    }
  }

  // Get skill network data for visualization
  async getSkillNetwork(minPopularity = 0.0, limit = 100) {
    try {
      const response = await axios.get('/api/skill-graph/network', {
        params: { min_popularity: minPopularity, limit }
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: {} };
    }
  }

  // Get focused network for a specific skill (for visualization)
  async getFocusedNetwork(skillName, limit = 10) {
    try {
      const response = await axios.get(
        `/api/skill-graph/network/${encodeURIComponent(skillName)}`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching focused network:', error);
      return { success: false, message: error.message, data: { nodes: [], edges: [] } };
    }
  }
}

export default new ApiSkillGraphService();
