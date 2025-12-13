/**
 * API Career Data Service
 * Handles career transition data submission and retrieval
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiCareerDataService = {
  /**
   * Add a career transition
   * @param {Object} transitionData - Career transition data
   * @returns {Promise<Object>}
   */
  async addCareerTransition(transitionData) {
    try {
      const response = await apiClient.post('/api/career-data', transitionData);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Get user's career transitions
   * @returns {Promise<Object>}
   */
  async getMyTransitions() {
    try {
      const response = await apiClient.get('/api/career-data/my-transitions');
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Admin: Bulk upload career data via CSV
   * @param {File} file - CSV file
   * @returns {Promise<Object>}
   */
  async bulkUploadCareerData(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/career-data/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Admin: Get career data statistics
   * @returns {Promise<Object>}
   */
  async getCareerDataStats() {
    try {
      const response = await apiClient.get('/api/career-data/admin/stats');
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Admin: Download CSV template
   * @returns {Promise<Object>}
   */
  async downloadCSVTemplate() {
    try {
      const response = await apiClient.get('/api/career-data/admin/csv-template');
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Handle API errors
   * @private
   */
  _handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  },
};

export default apiCareerDataService;
