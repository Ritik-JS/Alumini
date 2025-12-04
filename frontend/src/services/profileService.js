import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

const PROFILES_KEY = 'alumni_profiles';

const getStoredData = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
};

const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

class ProfileService {
  async getProfile(userId) {
    if (USE_MOCK_DATA) {
      const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles);
      const profile = profiles.find(p => p.user_id === userId);
      return { success: true, data: profile || null };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/profiles/${userId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getMyProfile() {
    if (USE_MOCK_DATA) {
      const userData = localStorage.getItem('user') || localStorage.getItem('auth_user');
      if (!userData) {
        return { success: false, message: 'Not authenticated' };
      }
      const user = JSON.parse(userData);
      return this.getProfile(user.id);
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/profiles/me`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async updateProfile(userId, profileData) {
    if (USE_MOCK_DATA) {
      const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles);
      const index = profiles.findIndex(p => p.user_id === userId);
      
      if (index !== -1) {
        profiles[index] = { ...profiles[index], ...profileData, updated_at: new Date().toISOString() };
        saveData(PROFILES_KEY, profiles);
        return { success: true, data: profiles[index] };
      }
      
      return { success: false, message: 'Profile not found' };
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/profiles/${userId}`, profileData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async uploadPhoto(userId, photoFile) {
    if (USE_MOCK_DATA) {
      const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles);
      const index = profiles.findIndex(p => p.user_id === userId);
      
      if (index !== -1) {
        profiles[index].photo_url = `https://via.placeholder.com/150?text=${encodeURIComponent(profiles[index].name)}`;
        profiles[index].updated_at = new Date().toISOString();
        saveData(PROFILES_KEY, profiles);
        return { success: true, data: profiles[index] };
      }
      
      return { success: false, message: 'Profile not found' };
    } else {
      try {
        const formData = new FormData();
        formData.append('photo', photoFile);
        const response = await axios.post(
          `${BACKEND_URL}/api/profiles/${userId}/photo`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async uploadCV(userId, cvFile) {
    if (USE_MOCK_DATA) {
      const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles);
      const index = profiles.findIndex(p => p.user_id === userId);
      
      if (index !== -1) {
        profiles[index].cv_url = `https://example.com/cv/${userId}.pdf`;
        profiles[index].updated_at = new Date().toISOString();
        saveData(PROFILES_KEY, profiles);
        return { success: true, data: profiles[index] };
      }
      
      return { success: false, message: 'Profile not found' };
    } else {
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
}

export default new ProfileService();
