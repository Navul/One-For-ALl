import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [realtimeNotifications, setRealtimeNotifications] = useState([]);
  const socketRef = useRef(null);

  // Define notification functions before they are used
  const removeRealtimeNotification = useCallback((notificationId) => {
    setRealtimeNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  }, []);

  const addRealtimeNotification = useCallback((notification) => {
    setRealtimeNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    
    // Show browser notification if permission is granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }

    // Auto-remove realtime notification after 5 seconds
    setTimeout(() => {
      removeRealtimeNotification(notification.id);
    }, 5000);
  }, [removeRealtimeNotification]);

  // Initialize socket connection for real-time notifications
  useEffect(() => {
    if (!user) return;

  const socket = io(process.env.REACT_APP_SOCKET_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    socketRef.current = socket;

    // Join user's notification room
    socket.emit('notification:join', { userId: user._id });

    // Listen for new chat messages
    socket.on('chat:message', (message) => {
      // Only show notification if the message is not from the current user
      if (message.from?.id !== user._id) {
        addRealtimeNotification({
          id: `chat_${Date.now()}`,
          type: 'chat',
          title: 'New Message',
          message: `${message.from?.name || 'Someone'} sent you a message: "${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}"`,
          data: {
            bookingId: message.bookingId,
            fromUser: message.from,
            messageContent: message.message
          },
          timestamp: new Date().toISOString(),
          isRead: false
        });

        // Update unread count
        setUnreadCount(prev => prev + 1);
      }
    });

    // Listen for dedicated chat notifications from socket
    socket.on('notification:chat', (notification) => {
      // Only show notification if it's not from the current user
      if (notification.from?.id !== user._id) {
        addRealtimeNotification({
          id: `chat_notification_${Date.now()}`,
          type: 'chat',
          title: notification.title || 'New Message',
          message: notification.message || `${notification.from?.name || 'Someone'} sent you a message`,
          data: {
            bookingId: notification.bookingId,
            fromUser: notification.from,
            messageContent: notification.message
          },
          timestamp: notification.timestamp || new Date().toISOString(),
          isRead: false
        });

        // Update unread count
        setUnreadCount(prev => prev + 1);
      }
    });

    // Listen for booking notifications
    socket.on('notification:booking', (notification) => {
      addRealtimeNotification({
        id: `booking_${Date.now()}`,
        type: 'booking',
        title: 'New Booking',
        message: notification.message || 'You have a new booking',
        data: notification,
        timestamp: new Date().toISOString(),
        isRead: false
      });

      setUnreadCount(prev => prev + 1);
    });

    // Listen for general notifications
    socket.on('notification:new', (notification) => {
      addRealtimeNotification(notification);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.emit('notification:leave', { userId: user._id });
      socket.off('chat:message');
      socket.off('notification:chat');
      socket.off('notification:booking');
      socket.off('notification:new');
      socket.disconnect();
    };
  }, [user, addRealtimeNotification]);

  // Fetch initial unread count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getUserNotifications();
      setNotifications(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update local notifications
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  const value = {
    unreadCount,
    notifications,
    realtimeNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    removeRealtimeNotification,
    requestNotificationPermission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;