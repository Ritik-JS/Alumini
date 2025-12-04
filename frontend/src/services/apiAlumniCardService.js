import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Alumni Card Service API
class ApiAlumniCardService {
  // Get alumni card for user
  async getCard(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/alumni-card/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get my alumni card
  async getMyCard() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/alumni-card/me`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Verify card with QR code
  async verifyCard(qrCodeData) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/alumni-card/verify`, {
        qr_code_data: qrCodeData,
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Generate new card
  async generateCard(userId) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/alumni-card/${userId}/generate`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiAlumniCardService();
