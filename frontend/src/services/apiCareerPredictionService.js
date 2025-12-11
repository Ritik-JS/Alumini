/**
 * Real API Career Prediction Service
 * Connects to backend API endpoints for AI-powered career predictions
 */

import axios from './axiosConfig';

export const apiCareerPredictionService = {
  // Get career prediction for a user
  async getUserPrediction(userId) {
    try {
      const response = await axios.get(`/api/career-predictions/user/${userId}`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching user prediction:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  },

  // Get all career predictions (admin)
  async getAllPredictions() {
    try {
      const response = await axios.get('/api/career-predictions');
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching all predictions:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: [],
      };
    }
  },

  // Get predictions by role
  async getPredictionsByRole(role) {
    try {
      const response = await axios.get('/api/career-predictions/by-role', {
        params: { role },
      });
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching predictions by role:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: [],
      };
    }
  },

  // Get specific predicted role details
  async getPredictedRoleDetails(userId, roleName) {
    try {
      const response = await axios.get(`/api/career-predictions/user/${userId}/role/${roleName}`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching predicted role details:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  },

  // Get alumni who made similar transitions
  async getSimilarAlumni(roleName) {
    try {
      const response = await axios.get('/api/career-predictions/similar-alumni', {
        params: { role: roleName },
      });
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching similar alumni:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: [],
      };
    }
  },

  // Get recommended learning resources
  async getLearningResources(skills) {
    try {
      const response = await axios.post('/api/career-predictions/learning-resources', {
        skills: Array.isArray(skills) ? skills : [skills],
      });
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching learning resources:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: [],
      };
    }
  },
};

export default apiCareerPredictionService;
