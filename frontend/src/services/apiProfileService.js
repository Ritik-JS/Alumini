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

  // Get profile by user ID
  async getProfileByUserId(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/profiles/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get job applications by user
  async getJobApplicationsByUser(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/applications/user/${userId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching job applications:', error);
      return [];
    }
  }

  // Get mentorship requests by student
  async getMentorshipRequestsByStudent(studentId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/mentorship/my-requests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
      return [];
    }
  }

  // Get jobs posted by user
  async getJobsByPoster(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/jobs/user/${userId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching posted jobs:', error);
      return [];
    }
  }

  // Alias for compatibility
  async getJobsByPostedBy(userId) {
    return this.getJobsByPoster(userId);
  }

  // Get system statistics (Admin only)
  async getSystemStats() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        totalUsers: 0,
        verifiedAlumni: 0,
        activeJobs: 0,
        upcomingEvents: 0,
        pendingVerifications: 0
      };
    }
  }

  // Get pending verifications (Admin only)
  async getPendingVerifications() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/profiles/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      return [];
    }
  }
}

export default new ApiProfileService();
