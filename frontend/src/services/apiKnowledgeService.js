import axios from './axiosConfig';

// Real Knowledge Service API
class ApiKnowledgeService {
  // Get all knowledge capsules
  async getCapsules(filters = {}) {
    try {
      const response = await axios.get('/api/capsules', {
        params: filters,
      });
      // Backend returns { items: [], total: number, page: number, limit: number }
      // Wrap it to match expected format { success: true, data: [...] }
      if (response.data && response.data.items) {
        return { success: true, data: response.data.items };
      }
      return { success: true, data: response.data || [] };
    } catch (error) {
      console.error('Error fetching capsules:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get capsule by ID
  async getCapsuleById(capsuleId) {
    try {
      const response = await axios.get(`/api/capsules/${capsuleId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Create knowledge capsule
  async createCapsule(capsuleData) {
    try {
      const response = await axios.post('/api/capsules/create', capsuleData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update capsule
  async updateCapsule(capsuleId, capsuleData) {
    try {
      const response = await axios.put(
        `/api/capsules/${capsuleId}`,
        capsuleData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating capsule:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete capsule
  async deleteCapsule(capsuleId) {
    try {
      const response = await axios.delete(`/api/capsules/${capsuleId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting capsule:', error);
      return { success: false, error: error.message };
    }
  }

  // Like capsule
  async likeCapsule(capsuleId) {
    try {
      const response = await axios.post(`/api/capsules/${capsuleId}/like`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Bookmark capsule
  async bookmarkCapsule(capsuleId) {
    try {
      const response = await axios.post(
        `/api/capsules/${capsuleId}/bookmark`
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get bookmarked capsules
  async getBookmarkedCapsules() {
    try {
      const response = await axios.get('/api/capsules/my-bookmarks');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // ========== ADMIN METHODS ==========

  // Toggle featured status (Admin only)
  async toggleFeatured(capsuleId) {
    try {
      const response = await axios.put(
        `/api/admin/knowledge/capsules/${capsuleId}/toggle-featured`,
        {}
      );
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all capsules with admin data (Admin only)
  async getAllCapsulesAdmin(filters = {}) {
    try {
      const response = await axios.get('/api/admin/knowledge/capsules', {
        params: filters
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get all categories
  async getCategories() {
    try {
      const response = await axios.get('/api/capsules/categories');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get all tags
  async getTags() {
    try {
      const response = await axios.get('/api/knowledge/tags');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get personalized capsules (AI-ranked)
  async getPersonalizedCapsules(userId) {
    try {
      const response = await axios.get(`/api/capsule-ranking/personalized/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get AI insights for a specific capsule
  async getCapsuleAIInsights(capsuleId, userId) {
    try {
      const response = await axios.get(`/api/knowledge/capsules/${capsuleId}/ai-insights`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get all learning paths
  async getLearningPaths() {
    try {
      const response = await axios.get('/api/knowledge/learning-paths');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get single learning path
  async getLearningPath(pathId) {
    try {
      const response = await axios.get(`/api/knowledge/learning-paths/${pathId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Generate learning path based on career goal
  async generateLearningPath(targetRole, currentSkills = []) {
    try {
      const response = await axios.post('/api/knowledge/learning-paths/generate', {
        target_role: targetRole,
        current_skills: currentSkills
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Track learning path progress
  async updatePathProgress(userId, pathId, capsuleId, completed) {
    try {
      const response = await axios.put(`/api/knowledge/learning-paths/${pathId}/progress`, {
        user_id: userId,
        capsule_id: capsuleId,
        completed
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get learning path progress
  async getPathProgress(userId, pathId) {
    try {
      const response = await axios.get(`/api/knowledge/learning-paths/${pathId}/progress`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: { completed_capsules: [] } };
    }
  }

  // Unlike capsule
  async unlikeCapsule(capsuleId) {
    try {
      const response = await axios.delete(`/api/capsules/${capsuleId}/like`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiKnowledgeService();
