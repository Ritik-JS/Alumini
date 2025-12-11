/**
 * Real API Dataset Service
 * Connects to backend API endpoints for dataset upload operations
 */

import axios from './axiosConfig';

export const apiDatasetService = {
  /**
   * Upload dataset file
   * @param {File} file - The file to upload
   * @param {string} datasetType - Type: 'alumni', 'job_market', 'educational'
   * @param {string} description - Optional description
   * @returns {Promise<Object>} Upload response with upload_id
   */
  async uploadDataset(file, datasetType, description = '') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataset_type', datasetType);
      if (description) {
        formData.append('description', description);
      }

      const response = await axios.post('/api/admin/datasets/upload', formData, {
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
   * Get upload progress
   * @param {string} uploadId - Upload ID
   * @returns {Promise<Object>} Progress information
   */
  async getUploadProgress(uploadId) {
    try {
      const response = await axios.get(`/api/admin/datasets/upload/${uploadId}/progress`);
      return response.data.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Get upload details
   * @param {string} uploadId - Upload ID
   * @returns {Promise<Object>} Upload details
   */
  async getUploadDetails(uploadId) {
    try {
      const response = await axios.get(`/api/admin/datasets/upload/${uploadId}`);
      return response.data.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Get upload report
   * @param {string} uploadId - Upload ID
   * @returns {Promise<Object>} Detailed report
   */
  async getUploadReport(uploadId) {
    try {
      const response = await axios.get(`/api/admin/datasets/upload/${uploadId}/report`);
      return response.data.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Get upload history with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} List of uploads
   */
  async getUploadHistory(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.file_type) params.append('file_type', filters.file_type);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await axios.get(`/api/admin/datasets/uploads?${params.toString()}`);
      
      return {
        uploads: response.data.data,
        totalCount: response.data.pagination.total,
        pagination: response.data.pagination,
      };
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Get upload statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    try {
      const response = await axios.get('/api/admin/datasets/statistics');
      return response.data.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Download error report
   * @param {string} uploadId - Upload ID
   * @returns {Promise<void>}
   */
  async downloadErrorReport(uploadId) {
    try {
      const response = await axios.get(
        `/api/admin/datasets/upload/${uploadId}/errors/download`,
        {
          responseType: 'blob',
        }
      );

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `error_report_${uploadId}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Error report downloaded',
      };
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Delete upload
   * @param {string} uploadId - Upload ID
   * @returns {Promise<Object>}
   */
  async deleteUpload(uploadId) {
    try {
      const response = await axios.delete(`/api/admin/datasets/upload/${uploadId}`);
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

export default apiDatasetService;
