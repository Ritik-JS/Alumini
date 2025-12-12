import axios from './axiosConfig';

// Real Heatmap Service API
class ApiHeatmapService {
  // Get geographic data for heatmap
  async getGeographicData(filters = {}) {
    try {
      const response = await axios.get('/api/heatmap/geographic', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get alumni distribution by location
  async getAlumniDistribution() {
    try {
      const response = await axios.get('/api/heatmap/alumni-distribution');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get job distribution by location
  async getJobDistribution() {
    try {
      const response = await axios.get('/api/heatmap/job-distribution');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get location details
  async getLocationDetails(locationId) {
    try {
      const response = await axios.get(`/api/heatmap/location/${locationId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get all unique skills
  async getSkills() {
    try {
      const response = await axios.get('/api/heatmap/skills');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get all unique industries
  async getIndustries() {
    try {
      const response = await axios.get('/api/heatmap/industries');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get talent clusters
  async getTalentClusters(filters = {}) {
    try {
      const response = await axios.get('/api/heatmap/clusters', {
        params: filters
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get cluster details
  async getClusterDetails(clusterId) {
    try {
      const response = await axios.get(`/api/heatmap/clusters/${clusterId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get emerging hubs (fastest growing locations)
  async getEmergingHubs() {
    try {
      const response = await axios.get('/api/heatmap/emerging-hubs');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Export cluster data
  async exportClusterData(clusterId) {
    try {
      const response = await axios.get(`/api/heatmap/clusters/${clusterId}/export`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data,
        format: 'json'
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiHeatmapService();
