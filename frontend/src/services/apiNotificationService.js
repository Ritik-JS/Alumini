import axios from './axiosConfig';

// Real Notification Service API
class ApiNotificationService {
  // Get all notifications for current user
  async getNotifications() {
    try {
      const response = await axios.get('/api/notifications');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await axios.get('/api/notifications/unread-count');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, count: 0 };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await axios.put(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await axios.put('/api/notifications/read-all');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`/api/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get notification preferences
  async getPreferences() {
    try {
      const response = await axios.get('/api/notifications/preferences');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      const response = await axios.put('/api/notifications/preferences', preferences);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ========== ADMIN METHODS ==========

  // Get all notifications (admin)
  async getAllNotifications(filters = {}) {
    try {
      const response = await axios.get('/api/admin/notifications', { 
        params: filters 
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Create notification (admin)
  async createNotification(notificationData) {
    try {
      const response = await axios.post('/api/admin/notifications', notificationData);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update notification (admin)
  async updateNotification(notificationId, notificationData) {
    try {
      const response = await axios.put(
        `/api/admin/notifications/${notificationId}`, 
        notificationData
      );
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Resend notification (admin)
  async resendNotification(notificationId) {
    try {
      const response = await axios.post(
        `/api/admin/notifications/${notificationId}/resend`
      );
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new ApiNotificationService();
