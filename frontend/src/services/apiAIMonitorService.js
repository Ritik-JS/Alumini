/**
 * Real API AI Monitor Service
 * Connects to backend API endpoints for AI system monitoring
 */

import axios from './axiosConfig';

export const apiAIMonitorService = {
  // Get all AI systems status overview
  async getAllSystemsStatus() {
    try {
      const response = await axios.get('/api/admin/ai-monitor/systems');
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching AI systems status:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: { systems: [], overallHealth: 0 },
      };
    }
  },

  // Get specific system details
  async getSystemDetails(systemId) {
    try {
      const response = await axios.get(`/api/admin/ai-monitor/systems/${systemId}`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching system details:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  },

  // Get model performance metrics
  async getModelPerformance(systemId, days = 30) {
    try {
      const response = await axios.get(`/api/admin/ai-monitor/systems/${systemId}/performance`, {
        params: { days },
      });
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching model performance:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  },

  // Get processing queue status
  async getProcessingQueue() {
    try {
      const response = await axios.get('/api/admin/ai-monitor/queue');
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching processing queue:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: { queue: [], totalItems: 0 },
      };
    }
  },

  // Get error logs
  async getErrorLogs(systemId = null, limit = 50) {
    try {
      const params = { limit };
      if (systemId) {
        params.system_id = systemId;
      }
      const response = await axios.get('/api/admin/ai-monitor/errors', { params });
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching error logs:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: { errors: [], total: 0 },
      };
    }
  },

  // Trigger manual AI update
  async triggerAIUpdate(systemId) {
    try {
      const response = await axios.post(`/api/admin/ai-monitor/systems/${systemId}/update`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error triggering AI update:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  },

  // Clear processing queue
  async clearQueue(systemId = null) {
    try {
      const url = systemId
        ? `/api/admin/ai-monitor/systems/${systemId}/clear-queue`
        : '/api/admin/ai-monitor/queue/clear';
      const response = await axios.post(url);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error clearing queue:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  },

  // Download metrics report
  async downloadMetricsReport(format = 'json') {
    try {
      const response = await axios.get('/api/admin/ai-monitor/report', {
        params: { format },
        responseType: format === 'json' ? 'json' : 'blob',
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error downloading metrics report:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  },

  // Get system alerts
  async getSystemAlerts() {
    try {
      const response = await axios.get('/api/admin/ai-monitor/alerts');
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: { alerts: [], unacknowledged: 0 },
      };
    }
  },

  // Acknowledge alert
  async acknowledgeAlert(alertId) {
    try {
      const response = await axios.post(`/api/admin/ai-monitor/alerts/${alertId}/acknowledge`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  },
};

export default apiAIMonitorService;
