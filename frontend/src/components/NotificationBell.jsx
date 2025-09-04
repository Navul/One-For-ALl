import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import notificationService from '../services/notificationService';

const NotificationBell = ({ onUnreadCountChange }) => {
  const navigate = useNavigate();
  const { unreadCount: contextUnreadCount, realtimeNotifications } = useNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Update local unread count when context changes
  useEffect(() => {
    setUnreadCount(contextUnreadCount);
  }, [contextUnreadCount]);

  // Update notifications when realtime notifications change
  useEffect(() => {
    if (realtimeNotifications.length > 0) {
      // Merge realtime notifications with existing ones, avoiding duplicates
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n._id || n.id));
        const newNotifications = realtimeNotifications.filter(n => !existingIds.has(n.id));
        return [...newNotifications, ...prev];
      });
    }
  }, [realtimeNotifications]);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getUserNotifications();
      const notificationsArray = Array.isArray(response) ? response : [];
      setNotifications(notificationsArray);
      // Count unread notifications from the response
      const unreadCount = notificationsArray.filter(n => n && !n.isRead).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]); // Set empty array on error
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification._id);
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Handle different notification types
    if (notification.type === 'chat') {
      // Navigate to chats page and close the dropdown
      setShowNotifications(false);
      navigate('/chats');
    } else if (notification.relatedModel === 'Booking' && notification.relatedId) {
      // For booking-related notifications, you could navigate to booking details
      // This is optional - you can customize based on your needs
      setShowNotifications(false);
    }
  };

  const handleNotificationAction = async (notification, actionType, actionData = {}) => {
    try {
      await notificationService.handleAction(notification._id, actionType, actionData);
      
      // Remove notification after action or refresh the list
      await fetchNotifications();
      
      // Close dropdown after action
      setShowNotifications(false);
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  const handleDeleteNotification = async (notification, e) => {
    e.stopPropagation(); // Prevent notification click
    try {
      await notificationService.deleteNotification(notification._id);
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      if (!notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getPriorityColor = (priority) => { // eslint-disable-line no-unused-vars
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '';
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'OFFER_ACCEPTED': return '✅';
      case 'OFFER_DECLINED': return '❌';
      case 'NEGOTIATION_EXPIRED': return '⏰';
      case 'BOOKING_CREATED': return '📅';
      case 'SERVICE_BOOKED': return '🎯';
      case 'chat': return '💬';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Notification Bell */}
      <button
        onClick={handleBellClick}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          position: 'relative',
          color: '#374151'
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            width: '400px',
            maxHeight: '500px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f9fafb'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                Loading notifications...
              </div>
            ) : (!notifications || notifications.length === 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: notification.isRead ? 'white' : '#eff6ff',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (notification.isRead) {
                      e.target.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = notification.isRead ? 'white' : '#eff6ff';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <p style={{
                          margin: 0,
                          fontWeight: notification.isRead ? '500' : '600',
                          fontSize: '0.95rem',
                          color: '#111827',
                          flex: 1
                        }}>
                          {notification.title}
                        </p>
                        {notification.priority && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {getPriorityLabel(notification.priority)}
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(notification, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#9ca3af',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '4px'
                          }}
                          title="Delete notification"
                        >
                          ❌
                        </button>
                      </div>
                      <p style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>
                      
                      {/* Action Buttons */}
                      {notification.hasActions && notification.actions && notification.actions.length > 0 && (
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          flexWrap: 'wrap'
                        }}>
                          {notification.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationAction(notification, action.type, action.data || {});
                              }}
                              style={{
                                background: action.style === 'success' ? '#059669' :
                                          action.style === 'warning' ? '#f59e0b' :
                                          action.style === 'danger' ? '#ef4444' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#9ca3af'
                        }}>
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {notification.data?.offerAmount && (
                          <span style={{
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            ${notification.data.offerAmount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
