const API_BASE_URL = process.env.REACT_APP_API_URL + '/api';

const notificationService = {
  // Get all notifications for the current user
  getUserNotifications: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    
    return await response.json();
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
    
    return await response.json();
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
    
    return await response.json();
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }
    
    return await response.json();
  },

  // Handle notification actions
  handleAction: async (notificationId, actionType, actionData = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actionType,
        ...actionData
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to handle action');
    }
    
    return await response.json();
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
    
    return await response.json();
  },

  // Delete all read notifications
  deleteAllRead: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/delete-read`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete read notifications');
    }
    
    return await response.json();
  }
};

export default notificationService;
