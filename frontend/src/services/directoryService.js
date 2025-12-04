import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

import mockDirectoryServiceFunctions from './mockDirectoryService';

class DirectoryService {
  async getAlumni(filters = {}) {
    if (USE_MOCK_DATA) {
      const alumni = mockDirectoryServiceFunctions.filterAlumni(filters);
      return { success: true, data: alumni };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/directory/alumni`, { params: filters });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async searchAlumni(query) {
    if (USE_MOCK_DATA) {
      const alumni = mockDirectoryServiceFunctions.searchAlumni(query);
      return { success: true, data: alumni };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/directory/search`, { params: { q: query } });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getAlumniByBatch(batchYear) {
    if (USE_MOCK_DATA) {
      const alumni = mockDirectoryServiceFunctions.getAlumniByBatch(batchYear);
      return { success: true, data: alumni };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/directory/batch/${batchYear}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getAlumniByCompany(company) {
    if (USE_MOCK_DATA) {
      const alumni = mockDirectoryServiceFunctions.getAlumniByCompany(company);
      return { success: true, data: alumni };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/directory/company/${company}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getFilterOptions() {
    if (USE_MOCK_DATA) {
      const options = mockDirectoryServiceFunctions.getFilterOptions();
      return { success: true, data: options };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/directory/filters`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
}

export default new DirectoryService();
