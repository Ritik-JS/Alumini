import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Profile Service API
class ApiProfileService {
  // Get user profile by ID
  async getProfile(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/profiles/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get current user profile
  async getMyProfile() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/profiles/me`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update profile
  async updateProfile(userId, profileData) {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/profiles/${userId}`, profileData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Upload profile photo
  async uploadPhoto(userId, photoFile) {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      const response = await axios.post(
        `${BACKEND_URL}/api/profiles/${userId}/photo`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Upload CV
  async uploadCV(userId, cvFile) {
    try {
      const formData = new FormData();
      formData.append('cv', cvFile);
      const response = await axios.post(`${BACKEND_URL}/api/profiles/${userId}/cv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiProfileService();
