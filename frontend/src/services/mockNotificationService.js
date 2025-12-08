import mockData from '../mockdata.json';

// Simulate localStorage for notifications
const STORAGE_KEY = 'notifications_data';

const getStoredNotifications = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData.notifications));
  return mockData.notifications;
};

const saveNotifications = (notifications) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

export const notificationService = {
  // Get all notifications for current user
  getNotifications: async (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let notifications = getStoredNotifications();
        
        // Filter by user
        notifications = notifications.filter(n => n.user_id === user.id);
        
        // Filter by type
        if (filters.type && filters.type !== 'all') {
          notifications = notifications.filter(n => n.type === filters.type);
        }
        
        // Filter by read status
        if (filters.status === 'unread') {
          notifications = notifications.filter(n => !n.is_read);
        } else if (filters.status === 'read') {
          notifications = notifications.filter(n => n.is_read);
        }
        
        // Sort by created date (newest first)
        notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        resolve({
          success: true,
          data: notifications,
          total: notifications.length
        });
      }, 300);
    });
  },

  // Get unread count
  getUnreadCount: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const notifications = getStoredNotifications();
        
        const unreadCount = notifications.filter(
          n => n.user_id === user.id && !n.is_read
        ).length;
        
        resolve({
          success: true,
          count: unreadCount
        });
      }, 100);
    });
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notifications = getStoredNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification) {
          notification.is_read = true;
          notification.read_at = new Date().toISOString();
          saveNotifications(notifications);
          
          resolve({
            success: true,
            data: notification
          });
        } else {
          resolve({
            success: false,
            error: 'Notification not found'
          });
        }
      }, 200);
    });
  },

  // Mark notification as unread
  markAsUnread: async (notificationId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notifications = getStoredNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification) {
          notification.is_read = false;
          notification.read_at = null;
          saveNotifications(notifications);
          
          resolve({
            success: true,
            data: notification
          });
        } else {
          resolve({
            success: false,
            error: 'Notification not found'
          });
        }
      }, 200);
    });
  },

  // Mark all as read
  markAllAsRead: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const notifications = getStoredNotifications();
        const now = new Date().toISOString();
        
        notifications.forEach(n => {
          if (n.user_id === user.id && !n.is_read) {
            n.is_read = true;
            n.read_at = now;
          }
        });
        
        saveNotifications(notifications);
        
        resolve({
          success: true,
          message: 'All notifications marked as read'
        });
      }, 300);
    });
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let notifications = getStoredNotifications();
        notifications = notifications.filter(n => n.id !== notificationId);
        saveNotifications(notifications);
        
        resolve({
          success: true,
          message: 'Notification deleted'
        });
      }, 200);
    });
  },

  // Get recent notifications (for dropdown)
  getRecentNotifications: async (limit = 5) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let notifications = getStoredNotifications();
        
        notifications = notifications
          .filter(n => n.user_id === user.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, limit);
        
        resolve({
          success: true,
          data: notifications
        });
      }, 200);
    });
  },

  // Save notification preferences
  savePreferences: async (preferences) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const key = `notification_preferences_${user.id}`;
        localStorage.setItem(key, JSON.stringify(preferences));
        
        resolve({
          success: true,
          data: preferences
        });
      }, 300);
    });
  },

  // Get notification preferences
  getPreferences: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const key = `notification_preferences_${user.id}`;
        const stored = localStorage.getItem(key);
        
        const defaultPreferences = {
          email: true,
          push: false,
          categories: {
            profile: { email: true, push: false },
            mentorship: { email: true, push: true },
            jobs: { email: true, push: true },
            events: { email: true, push: false },
            forum: { email: false, push: false }
          },
          frequency: 'instant',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        };
        
        const preferences = stored ? JSON.parse(stored) : defaultPreferences;
        
        resolve({
          success: true,
          data: preferences
        });
      }, 200);
    });
  },

  // ========== ADMIN METHODS ==========

  // Get all notifications (admin)
  getAllNotifications: async (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let notifications = getStoredNotifications();
        const users = JSON.parse(localStorage.getItem('users_data') || '[]');
        
        // Enrich notifications with user data
        const enrichedNotifications = notifications.map(notif => {
          const user = users.find(u => u.id === notif.user_id);
          return {
            ...notif,
            user_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
            user_email: user?.email || ''
          };
        });
        
        // Apply filters
        let filtered = enrichedNotifications;
        if (filters.type && filters.type !== 'all') {
          filtered = filtered.filter(n => n.type === filters.type);
        }
        if (filters.status === 'read') {
          filtered = filtered.filter(n => n.is_read);
        } else if (filters.status === 'unread') {
          filtered = filtered.filter(n => !n.is_read);
        }
        
        resolve({
          success: true,
          data: filtered,
          total: filtered.length
        });
      }, 300);
    });
  },

  // Create notification (admin)
  createNotification: async (notificationData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notifications = getStoredNotifications();
        
        const newNotification = {
          id: `notif-${Date.now()}`,
          ...notificationData,
          is_read: false,
          read_at: null,
          created_at: new Date().toISOString()
        };
        
        notifications.push(newNotification);
        saveNotifications(notifications);
        
        resolve({
          success: true,
          data: newNotification,
          message: 'Notification created successfully'
        });
      }, 300);
    });
  },

  // Update notification (admin)
  updateNotification: async (notificationId, notificationData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notifications = getStoredNotifications();
        const index = notifications.findIndex(n => n.id === notificationId);
        
        if (index !== -1) {
          notifications[index] = {
            ...notifications[index],
            ...notificationData,
            updated_at: new Date().toISOString()
          };
          saveNotifications(notifications);
          
          resolve({
            success: true,
            data: notifications[index],
            message: 'Notification updated successfully'
          });
        } else {
          resolve({
            success: false,
            error: 'Notification not found'
          });
        }
      }, 300);
    });
  },

  // Resend notification (admin)
  resendNotification: async (notificationId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notifications = getStoredNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification) {
          // Mark as unread and update timestamp
          notification.is_read = false;
          notification.read_at = null;
          notification.created_at = new Date().toISOString();
          saveNotifications(notifications);
          
          resolve({
            success: true,
            data: notification,
            message: 'Notification resent successfully'
          });
        } else {
          resolve({
            success: false,
            error: 'Notification not found'
          });
        }
      }, 300);
    });
  }
};
