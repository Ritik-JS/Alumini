import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

import mockHeatmapServiceFunctions from './mockHeatmapService';

class HeatmapService {
  async getGeographicData(filters = {}) {
    if (USE_MOCK_DATA) {
      return mockHeatmapServiceFunctions.getGeographicData(filters);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/heatmap/geographic`, { params: filters });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getAlumniDistribution() {
    if (USE_MOCK_DATA) {
      return mockHeatmapServiceFunctions.getAlumniDistribution();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/heatmap/alumni-distribution`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getJobDistribution() {
    if (USE_MOCK_DATA) {
      return mockHeatmapServiceFunctions.getJobDistribution();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/heatmap/job-distribution`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getLocationDetails(locationId) {
    if (USE_MOCK_DATA) {
      return mockHeatmapServiceFunctions.getLocationDetails(locationId);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/heatmap/location/${locationId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
}

export default new HeatmapService();
