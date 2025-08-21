import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, priority

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getUserNotifications();
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    if (window.confirm('Are you sure you want to delete all read notifications?')) {
      try {
        await notificationService.deleteAllRead();
        setNotifications(prev => prev.filter(n => !n.isRead));
      } catch (error) {
        console.error('Error deleting read notifications:', error);
      }
    }
  };

  const handleNotificationAction = async (notification, actionType, actionData = {}) => {
    try {
      await notificationService.handleAction(notification._id, actionType, actionData);
      // Refresh notifications after action
      await fetchNotifications();
    } catch (error) {
      console.error('Error handling notification action:', error);
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

  const getNotificationIcon = (type) => {
    const icons = {
      'BOOKING_CREATED': '📋',
      'BOOKING_CONFIRMED': '✅',
      'BOOKING_CANCELLED': '❌',
      'NEGOTIATION_STARTED': '🤝',
      'NEGOTIATION_UPDATED': '💰',
      'COUNTER_OFFER_RECEIVED': '💵',
      'OFFER_ACCEPTED': '✅',
      'OFFER_DECLINED': '❌',
      'PAYMENT_RECEIVED': '💳',
      'REVIEW_RECEIVED': '⭐',
      'SERVICE_APPROVED': '🎉',
      'SERVICE_REJECTED': '⚠️',
      'SYSTEM_ALERT': '🔔',
      'ACCOUNT_UPDATE': '👤'
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return '🔴 High';
      case 'medium': return '🟡 Medium';
      case 'low': return '🔵 Low';
      default: return '';
    }
  };

  // Filter and sort notifications
  const getFilteredAndSortedNotifications = () => {
    let filtered = notifications;

    // Apply filter
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }

    // Apply sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1, undefined: 0 };
      filtered.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    return filtered;
  };

  const filteredNotifications = getFilteredAndSortedNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const readCount = notifications.filter(n => n.isRead).length;

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem',
        paddingTop: '6rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📱</div>
        <h2>Loading notifications...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '2rem',
      paddingTop: '6rem'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: '#2d3748',
          marginBottom: '1rem'
        }}>
          📱 Notifications
        </h1>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: '#6b7280' }}>
              {unreadCount} unread, {readCount} read
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Mark All as Read
              </button>
            )}
            {readCount > 0 && (
              <button
                onClick={handleDeleteAllRead}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Delete All Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: '500', color: '#374151' }}>Filter:</span>
          {['all', 'unread', 'read'].map(filterOption => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              style={{
                background: filter === filterOption ? '#3b82f6' : 'white',
                color: filter === filterOption ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {filterOption}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: '500', color: '#374151' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem',
          color: '#6b7280',
          background: '#f9fafb',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ marginBottom: '0.5rem' }}>
            {filter === 'all' ? 'No notifications yet' : 
             filter === 'unread' ? 'No unread notifications' : 
             'No read notifications'}
          </h3>
          <p>
            {filter === 'all' ? 'Notifications will appear here when you receive them.' :
             filter === 'unread' ? 'All caught up! No unread notifications.' :
             'No read notifications to show.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              style={{
                background: notification.isRead ? 'white' : '#eff6ff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${getPriorityColor(notification.priority)}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <span style={{ fontSize: '2rem', flexShrink: 0 }}>
                  {getNotificationIcon(notification.type)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{
                      margin: 0,
                      color: '#111827',
                      fontSize: '1.1rem',
                      fontWeight: notification.isRead ? '500' : '600',
                      flex: 1
                    }}>
                      {notification.title}
                    </h3>
                    {notification.priority && (
                      <span style={{
                        fontSize: '0.875rem',
                        color: getPriorityColor(notification.priority),
                        fontWeight: '500'
                      }}>
                        {getPriorityLabel(notification.priority)}
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification._id)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                        title="Delete notification"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <p style={{
                    margin: '0 0 1rem 0',
                    color: '#6b7280',
                    lineHeight: '1.6'
                  }}>
                    {notification.message}
                  </p>

                  {/* Action Buttons */}
                  {notification.hasActions && notification.actions && notification.actions.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      {notification.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleNotificationAction(notification, action.type, action.data || {})}
                          style={{
                            background: action.style === 'success' ? '#059669' :
                                      action.style === 'warning' ? '#f59e0b' :
                                      action.style === 'danger' ? '#ef4444' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
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
                      fontSize: '0.875rem',
                      color: '#9ca3af'
                    }}>
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                    {notification.data?.offerAmount && (
                      <span style={{
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        Offer: ${notification.data.offerAmount}
                      </span>
                    )}
                    {notification.userRole && (
                      <span style={{
                        background: '#f3f4f6',
                        color: '#374151',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {notification.userRole}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
