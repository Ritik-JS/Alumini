import axios from './axiosConfig';

// Real Alumni Card Service API
class ApiAlumniCardService {
  // Get alumni card for user
  async getCard(userId) {
    try {
      const response = await axios.get(`/api/alumni-card/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get my alumni card
  async getMyCard() {
    try {
      const response = await axios.get('/api/alumni-card/');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Verify card with QR code
  async verifyCard(qrCodeData) {
    try {
      const response = await axios.post('/api/alumni-card/verify', {
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
      const response = await axios.post(`/api/alumni-card/${userId}/generate`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Download card as image
  async downloadCard(cardId) {
    try {
      const response = await axios.get(`/api/alumni-card/${cardId}/download`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data,
        message: 'Card download started'
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get verification history (admin)
  async getVerificationHistory(filters = {}) {
    try {
      const response = await axios.get('/api/admin/alumni-card/verifications', {
        params: filters
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get verification history for specific card
  async getCardVerificationHistory(cardId) {
    try {
      const response = await axios.get(`/api/alumni-card/${cardId}/verifications`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }
}

export default new ApiAlumniCardService();
