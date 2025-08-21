import React, { useState } from 'react';
import notificationService from '../services/notificationService'; // eslint-disable-line no-unused-vars
import { useAuth } from '../context/AuthContext';

const NotificationTest = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createTestNotification = async (type, priority = 'medium') => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/notifications/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          title: getNotificationTitle(type),
          message: getNotificationMessage(type),
          priority,
          hasActions: type.includes('NEGOTIATION') || type.includes('BOOKING'),
          actions: getNotificationActions(type),
          data: getNotificationData(type)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create notification');
      }
      
      setMessage(`✅ ${type} notification created successfully!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating notification:', error);
      setMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTitle = (type) => {
    const titles = {
      'BOOKING_CREATED': '🎉 New Booking Request',
      'NEGOTIATION_STARTED': '💰 New Price Negotiation',
      'COUNTER_OFFER_RECEIVED': '💵 Counter Offer Received',
      'OFFER_ACCEPTED': '✅ Offer Accepted',
      'PAYMENT_RECEIVED': '💳 Payment Received',
      'REVIEW_RECEIVED': '⭐ New Review',
      'SYSTEM_ALERT': '🔔 System Alert'
    };
    return titles[type] || 'New Notification';
  };

  const getNotificationMessage = (type) => {
    const messages = {
      'BOOKING_CREATED': 'A new booking request has been submitted for your service.',
      'NEGOTIATION_STARTED': 'A customer wants to negotiate the price for your service.',
      'COUNTER_OFFER_RECEIVED': 'You received a counter offer of $75 for your service.',
      'OFFER_ACCEPTED': 'Your offer has been accepted! Payment is being processed.',
      'PAYMENT_RECEIVED': 'Payment of $100 has been successfully received.',
      'REVIEW_RECEIVED': 'You received a 5-star review from a satisfied customer.',
      'SYSTEM_ALERT': 'Important system notification regarding your account.'
    };
    return messages[type] || 'You have a new notification.';
  };

  const getNotificationActions = (type) => {
    const actions = {
      'BOOKING_CREATED': [
        { type: 'accept_booking', label: 'Accept', style: 'success' },
        { type: 'decline_booking', label: 'Decline', style: 'danger' }
      ],
      'NEGOTIATION_STARTED': [
        { type: 'view_negotiation', label: 'View Details', style: 'primary' },
        { type: 'respond_negotiation', label: 'Respond', style: 'warning' }
      ],
      'COUNTER_OFFER_RECEIVED': [
        { type: 'accept_offer', label: 'Accept $75', style: 'success' },
        { type: 'counter_offer', label: 'Counter', style: 'warning' },
        { type: 'decline_offer', label: 'Decline', style: 'danger' }
      ]
    };
    return actions[type] || [];
  };

  const getNotificationData = (type) => {
    const data = {
      'BOOKING_CREATED': { bookingId: 'test-booking-123', serviceTitle: 'Test Service' },
      'NEGOTIATION_STARTED': { negotiationId: 'test-neg-123', originalPrice: 100 },
      'COUNTER_OFFER_RECEIVED': { negotiationId: 'test-neg-123', offerAmount: 75 },
      'PAYMENT_RECEIVED': { paymentId: 'test-pay-123', amount: 100 },
      'REVIEW_RECEIVED': { reviewId: 'test-review-123', rating: 5 }
    };
    return data[type] || {};
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      paddingTop: '6rem'
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: '700', 
        color: '#2d3748',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        🧪 Notification System Test
      </h1>

      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '8px',
          background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2',
          color: message.startsWith('✅') ? '#166534' : '#dc2626',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {message}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => createTestNotification('BOOKING_CREATED', 'high')}
          disabled={loading}
          style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          📋 Create Booking Notification
        </button>

        <button
          onClick={() => createTestNotification('NEGOTIATION_STARTED', 'medium')}
          disabled={loading}
          style={{
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🤝 Create Negotiation Notification
        </button>

        <button
          onClick={() => createTestNotification('COUNTER_OFFER_RECEIVED', 'high')}
          disabled={loading}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          💰 Create Counter Offer Notification
        </button>

        <button
          onClick={() => createTestNotification('OFFER_ACCEPTED', 'low')}
          disabled={loading}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          ✅ Create Accepted Offer Notification
        </button>

        <button
          onClick={() => createTestNotification('PAYMENT_RECEIVED', 'medium')}
          disabled={loading}
          style={{
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          💳 Create Payment Notification
        </button>

        <button
          onClick={() => createTestNotification('REVIEW_RECEIVED', 'low')}
          disabled={loading}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          ⭐ Create Review Notification
        </button>

        <button
          onClick={() => createTestNotification('SYSTEM_ALERT', 'high')}
          disabled={loading}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🔔 Create System Alert
        </button>
      </div>

      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.5rem',
        marginTop: '2rem'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#374151' }}>📝 Instructions</h3>
        <ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
          <li>Click any button above to create a test notification</li>
          <li>Check the notification bell in the navbar for new notifications</li>
          <li>Visit the <strong>/notifications</strong> page to see all notifications</li>
          <li>Test the interactive action buttons on notifications</li>
          <li>Test mark as read, delete, and filter functionality</li>
        </ul>
      </div>

      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '1.5rem',
        marginTop: '1rem'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>🧑‍💼 Current User</h3>
        <p style={{ color: '#374151' }}>
          <strong>Name:</strong> {user?.name || 'Not logged in'}<br/>
          <strong>Role:</strong> {user?.role || 'N/A'}<br/>
          <strong>ID:</strong> {user?.id || 'N/A'}
        </p>
      </div>
    </div>
  );
};

export default NotificationTest;
