import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

import mockAlumniCardServiceFunctions from './mockAlumniCardService';

class AlumniCardService {
  async getCard(userId) {
    if (USE_MOCK_DATA) {
      return mockAlumniCardServiceFunctions.getCard(userId);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/alumni-card/${userId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getMyCard() {
    if (USE_MOCK_DATA) {
      return mockAlumniCardServiceFunctions.getMyCard();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/alumni-card/me`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async verifyCard(qrCodeData) {
    if (USE_MOCK_DATA) {
      return mockAlumniCardServiceFunctions.verifyCard(qrCodeData);
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/alumni-card/verify`, { qr_code_data: qrCodeData });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async generateCard(userId) {
    if (USE_MOCK_DATA) {
      return mockAlumniCardServiceFunctions.generateCard(userId);
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/alumni-card/${userId}/generate`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
}

export default new AlumniCardService();
