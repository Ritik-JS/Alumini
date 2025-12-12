import axios from './axiosConfig';

// Real Profile Service API
class ApiProfileService {
  // Get user profile by ID
  async getProfile(userId) {
    try {
      const response = await axios.get(`/api/profiles/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get current user profile
  async getMyProfile() {
    try {
      const response = await axios.get('/api/profiles/me');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update profile
  async updateProfile(userId, profileData) {
    try {
      const response = await axios.put(`/api/profiles/${userId}`, profileData);
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
        `/api/profiles/${userId}/photo`,
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
      const response = await axios.post(`/api/profiles/${userId}/cv`, formData, {
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
      const response = await axios.get(`/api/profiles/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Search profiles with filters
  async searchProfiles(params) {
    try {
      const response = await axios.get('/api/profiles/search', {
        params: {
          name: params.name || undefined,
          company: params.company || undefined,
          skills: params.skills || undefined,
          batch_year: params.batch_year || undefined,
          job_role: params.job_role || undefined,
          location: params.location || undefined,
          verified_only: params.verified_only || false,
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: null };
    }
  }

  // Get job applications by user
  async getJobApplicationsByUser(userId) {
    try {
      const response = await axios.get(`/api/applications/user/${userId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching job applications:', error);
      return [];
    }
  }

  // Get mentorship requests by student
  async getMentorshipRequestsByStudent(studentId) {
    try {
      const response = await axios.get('/api/mentorship/my-requests');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
      return [];
    }
  }

  // Get jobs posted by user
  async getJobsByPoster(userId) {
    try {
      const response = await axios.get(`/api/jobs/user/${userId}`);
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
      const response = await axios.get('/api/admin/stats');
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
      const response = await axios.get('/api/admin/profiles/pending');
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // ========== ADMIN VERIFICATION METHODS ==========

  // Approve verification (Admin only)
  async approveVerification(profileId) {
    try {
      const response = await axios.post(`/api/admin/profiles/verify/${profileId}`, {});
      return { success: true, ...response.data };
    } catch (error) {
      console.error('Error approving verification:', error);
      return { success: false, error: error.message };
    }
  }

  // Reject verification (Admin only)
  async rejectVerification(profileId, reason = '') {
    try {
      const response = await axios.post(`/api/admin/profiles/reject/${profileId}`, { reason });
      return { success: true, ...response.data };
    } catch (error) {
      console.error('Error rejecting verification:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== ADMIN USER MANAGEMENT METHODS ==========

  // Get all users (Admin only)
  async getAllUsers(filters = {}) {
    try {
      const response = await axios.get('/api/admin/users', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get user with profile (Admin only)
  async getUserWithProfile(userId) {
    try {
      const response = await axios.get(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return { success: false, error: error.message };
    }
  }

  // Ban user (Admin only)
  async banUser(userId, reason = '') {
    try {
      const response = await axios.post(`/api/admin/users/${userId}/ban`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error banning user:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete user (Admin only)
  async deleteUser(userId) {
    try {
      const response = await axios.delete(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset (Admin only)
  async resetPassword(userId) {
    try {
      const response = await axios.post(`/api/admin/users/${userId}/reset-password`, {});
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, error: error.message };
    }
  }

  // Export users (Admin only)
  async exportUsers(format = 'csv') {
    try {
      const response = await axios.get('/api/admin/users/export', {
        params: { format },
        responseType: 'blob'
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error exporting users:', error);
      return { success: false, error: error.message };
    }
  }

  // Get privacy settings
  async getPrivacySettings() {
    try {
      const response = await axios.get('/api/privacy/settings');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to load privacy settings' 
      };
    }
  }

  // Update privacy settings
  async updatePrivacySettings(privacyData) {
    try {
      const response = await axios.put('/api/privacy/settings', privacyData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to update privacy settings' 
      };
    }
  }
}

export default new ApiProfileService();
