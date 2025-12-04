import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Notification Service API
class ApiNotificationService {
  // Get all notifications for current user
  async getNotifications() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/notifications`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/notifications/unread-count`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, count: 0 };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/notifications/read-all`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get notification preferences
  async getPreferences() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/notifications/preferences`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/notifications/preferences`, preferences);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiNotificationService();
