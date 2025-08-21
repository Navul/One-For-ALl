import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import { getUserNegotiations, acceptOffer, makeCounterOffer, declineOffer } from '../services/negotiationService';

const ProviderNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [negotiations, setNegotiations] = useState([]);

  useEffect(() => {
    fetchNotifications();
    fetchNegotiations();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getUserNotifications();
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNegotiations = async () => {
    try {
      const response = await getUserNegotiations();
      // Filter to show only negotiations where user is the provider
      const providerNegotiations = response.negotiations.filter(
        neg => neg.provider._id === user?.id
      );
      setNegotiations(providerNegotiations);
    } catch (error) {
      console.error('Error fetching negotiations:', error);
    }
  };

  const handleAcceptOffer = async (negotiationId) => {
    try {
      await acceptOffer(negotiationId);
      fetchNotifications();
      fetchNegotiations();
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const handleCounterOffer = async (negotiationId, counterOffer, message) => {
    try {
      await makeCounterOffer(negotiationId, counterOffer, message);
      fetchNotifications();
      fetchNegotiations();
    } catch (error) {
      console.error('Error making counter offer:', error);
    }
  };

  const handleDeclineOffer = async (negotiationId) => {
    try {
      await declineOffer(negotiationId);
      fetchNotifications();
      fetchNegotiations();
    } catch (error) {
      console.error('Error declining offer:', error);
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
    switch (type) {
      case 'NEGOTIATION_STARTED': return '🤝';
      case 'COUNTER_OFFER_RECEIVED': return '💰';
      case 'OFFER_ACCEPTED': return '✅';
      case 'OFFER_DECLINED': return '❌';
      case 'NEGOTIATION_EXPIRED': return '⏰';
      default: return '🔔';
    }
  };

  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: '2rem',
      paddingTop: '6rem'
    }}>
      <h1 style={{ 
        marginBottom: '2rem', 
        fontSize: '2.5rem', 
        fontWeight: '700', 
        color: '#2d3748' 
      }}>
        Provider Notifications & Negotiations
      </h1>

      {/* Tabs */}
      <div style={{
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              padding: '1rem 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'notifications' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'notifications' ? '#3b82f6' : '#6b7280',
              fontWeight: '600',
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}
          >
            🔔 Notifications ({notifications.filter(n => !n.isRead).length})
          </button>
          <button
            onClick={() => setActiveTab('negotiations')}
            style={{
              padding: '1rem 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'negotiations' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'negotiations' ? '#3b82f6' : '#6b7280',
              fontWeight: '600',
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}
          >
            🤝 Active Negotiations ({negotiations.filter(n => n.status === 'active').length})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          Loading...
        </div>
      ) : activeTab === 'notifications' ? (
        <div>
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
              <h3>No notifications yet</h3>
              <p>You'll see notifications here when customers want to negotiate prices on your services.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    background: notification.isRead ? 'white' : '#eff6ff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        margin: '0 0 0.5rem 0',
                        color: '#111827',
                        fontSize: '1.1rem',
                        fontWeight: notification.isRead ? '500' : '600'
                      }}>
                        {notification.title}
                      </h4>
                      <p style={{
                        margin: '0 0 1rem 0',
                        color: '#6b7280',
                        lineHeight: '1.6'
                      }}>
                        {notification.message}
                      </p>
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
                            Offered: ${notification.data.offerAmount}
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
      ) : (
        <NegotiationsList 
          negotiations={negotiations}
          onAcceptOffer={handleAcceptOffer}
          onCounterOffer={handleCounterOffer}
          onDeclineOffer={handleDeclineOffer}
          formatTimeAgo={formatTimeAgo}
        />
      )}
    </div>
  );
};

// Separate component for negotiations list
const NegotiationsList = ({ negotiations, onAcceptOffer, onCounterOffer, onDeclineOffer, formatTimeAgo }) => {
  const [counterOffers, setCounterOffers] = useState({});
  const [counterMessages, setCounterMessages] = useState({});

  const handleCounterOfferSubmit = (negotiationId) => {
    const offer = counterOffers[negotiationId];
    const message = counterMessages[negotiationId];
    if (offer && parseFloat(offer) > 0) {
      onCounterOffer(negotiationId, parseFloat(offer), message);
      setCounterOffers(prev => ({ ...prev, [negotiationId]: '' }));
      setCounterMessages(prev => ({ ...prev, [negotiationId]: '' }));
    }
  };

  return (
    <div>
      {negotiations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280',
          background: '#f9fafb',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
          <h3>No active negotiations</h3>
          <p>When customers start bargaining on your services, they'll appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {negotiations.map((negotiation) => (
            <div
              key={negotiation._id}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>
                  {negotiation.service.title}
                </h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: '#6b7280' }}>Base Price: ${negotiation.basePrice}</span>
                  <span style={{ color: '#059669', fontWeight: '600' }}>
                    Current Offer: ${negotiation.currentOffer}
                  </span>
                  <span style={{
                    background: negotiation.status === 'active' ? '#dcfce7' : '#fef3c7',
                    color: negotiation.status === 'active' ? '#166534' : '#92400e',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    {negotiation.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Client: {negotiation.client.name} • Started {formatTimeAgo(negotiation.createdAt)}
                </p>
              </div>

              {negotiation.status === 'active' && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Counter Offer ($)
                    </label>
                    <input
                      type="number"
                      value={counterOffers[negotiation._id] || ''}
                      onChange={e => setCounterOffers(prev => ({ ...prev, [negotiation._id]: e.target.value }))}
                      placeholder="Enter your counter offer"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Message (Optional)
                    </label>
                    <input
                      type="text"
                      value={counterMessages[negotiation._id] || ''}
                      onChange={e => setCounterMessages(prev => ({ ...prev, [negotiation._id]: e.target.value }))}
                      placeholder="Add a message..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => onAcceptOffer(negotiation._id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Accept
                    </button>
                    <button
                      onClick={() => handleCounterOfferSubmit(negotiation._id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      💰 Counter
                    </button>
                    <button
                      onClick={() => onDeclineOffer(negotiation._id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderNotifications;
