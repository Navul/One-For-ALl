const API_URL = process.env.REACT_APP_API_URL;

const chatService = {
  // Get unread message counts for user's bookings
  getUnreadCounts: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/chat/unread-counts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching unread counts:', error);
      throw error;
    }
  },

  // Mark messages as read for a specific booking
  markAsRead: async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/chat/mark-read/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
};

export default chatService;
