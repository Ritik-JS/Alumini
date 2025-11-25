import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Directory Service API
class ApiDirectoryService {
  // Get all alumni with filters
  async getAlumni(filters = {}) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/directory/alumni`, { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Search alumni
  async searchAlumni(query) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/directory/search`, {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get alumni by batch year
  async getAlumniByBatch(batchYear) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/directory/batch/${batchYear}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get alumni by company
  async getAlumniByCompany(company) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/directory/company/${company}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get filter options
  async getFilterOptions() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/directory/filters`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiDirectoryService();
