import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Heatmap Service API
class ApiHeatmapService {
  // Get geographic data for heatmap
  async getGeographicData(filters = {}) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/heatmap/geographic`, {
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
      const response = await axios.get(`${BACKEND_URL}/api/heatmap/alumni-distribution`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get job distribution by location
  async getJobDistribution() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/heatmap/job-distribution`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get location details
  async getLocationDetails(locationId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/heatmap/location/${locationId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiHeatmapService();
