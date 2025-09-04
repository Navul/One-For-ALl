import { apiRequestJSON, ENDPOINTS } from '../utils/api';

const notificationService = {
  // Get all notifications for the current user
  getUserNotifications: async () => {
    try {
      return await apiRequestJSON(ENDPOINTS.NOTIFICATIONS);
    } catch (error) {
      throw new Error('Failed to fetch notifications');
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      return await apiRequestJSON(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`, {
        method: 'PUT'
      });
    } catch (error) {
      throw new Error('Failed to mark notification as read');
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      return await apiRequestJSON(`${ENDPOINTS.NOTIFICATIONS}/mark-all-read`, {
        method: 'PUT'
      });
    } catch (error) {
      throw new Error('Failed to mark all notifications as read');
    }
  },

  // Get unread notification count
  getUnreadCount: async () => {
    try {
      return await apiRequestJSON(`${ENDPOINTS.NOTIFICATIONS}/unread-count`);
    } catch (error) {
      throw new Error('Failed to fetch unread count');
    }
  },

  // Handle notification actions
  handleAction: async (notificationId, actionType, actionData = {}) => {
    try {
      return await apiRequestJSON(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}/action`, {
        method: 'POST',
        body: JSON.stringify({
          actionType,
          ...actionData
        })
      });
    } catch (error) {
      throw new Error('Failed to handle action');
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      return await apiRequestJSON(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      throw new Error('Failed to delete notification');
    }
  },

  // Delete all read notifications
  deleteAllRead: async () => {
    try {
      return await apiRequestJSON(`${ENDPOINTS.NOTIFICATIONS}/delete-read`, {
        method: 'DELETE'
      });
    } catch (error) {
      throw new Error('Failed to delete read notifications');
    }
  }
};

export default notificationService;
