import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

import mockNotificationServiceFunctions from './mockNotificationService';

class NotificationService {
  async getNotifications() {
    if (USE_MOCK_DATA) {
      return mockNotificationServiceFunctions.getNotifications();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/notifications`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getUnreadCount() {
    if (USE_MOCK_DATA) {
      return mockNotificationServiceFunctions.getUnreadCount();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/notifications/unread-count`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, count: 0 };
      }
    }
  }

  async markAsRead(notificationId) {
    if (USE_MOCK_DATA) {
      return mockNotificationServiceFunctions.markAsRead(notificationId);
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/notifications/${notificationId}/read`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async markAllAsRead() {
    if (USE_MOCK_DATA) {
      return mockNotificationServiceFunctions.markAllAsRead();
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/notifications/read-all`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async deleteNotification(notificationId) {
    if (USE_MOCK_DATA) {
      return mockNotificationServiceFunctions.deleteNotification(notificationId);
    } else {
      try {
        const response = await axios.delete(`${BACKEND_URL}/api/notifications/${notificationId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getPreferences() {
    if (USE_MOCK_DATA) {
      return mockNotificationServiceFunctions.getPreferences();
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/notifications/preferences`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async updatePreferences(preferences) {
    if (USE_MOCK_DATA) {
      return mockNotificationServiceFunctions.updatePreferences(preferences);
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/notifications/preferences`, preferences);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
}

export default new NotificationService();
