
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import chatService from '../services/chatService';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL;

const BookedPrograms = () => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, date
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const socketRef = useRef(null);
  const [bookingNotification, setBookingNotification] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({}); // New state for unread message counts

  // Listen for real-time booking notifications
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        reconnection: true,
      });
    }
    const socket = socketRef.current;
    const handleBookingNotification = (notif) => {
      console.log('[SOCKET] notification:booking received', notif);
      setBookingNotification({
        ...notif,
        receivedAt: new Date()
      });
      // Optionally, refresh bookings list
      fetchProviderBookings();
    };
    socket.on('notification:booking', handleBookingNotification);
    return () => {
      socket.off('notification:booking', handleBookingNotification);
    };
    // eslint-disable-next-line
  }, []);

  // Notification UI
  const renderBookingNotification = () => {
    if (!bookingNotification) return null;
    return (
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        background: '#fff',
        border: '2px solid #6366f1',
        borderRadius: 12,
        boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
        padding: '1.5rem 2rem',
        minWidth: 320,
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8
      }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#6366f1', marginBottom: 4 }}>
          📢 New Booking!
        </div>
        <div style={{ fontSize: 16, color: '#222' }}>
          <b>{bookingNotification.clientName}</b> booked <b>{bookingNotification.serviceTitle}</b>
        </div>
        <div style={{ fontSize: 14, color: '#555' }}>
          Date: {bookingNotification.date ? new Date(bookingNotification.date).toLocaleString() : 'N/A'}
        </div>
        <button
          style={{
            marginTop: 8,
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '0.5rem 1.25rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 15
          }}
          onClick={() => setBookingNotification(null)}
        >
          Dismiss
        </button>
      </div>
    );
  };

  const handleChatWithClient = (booking) => {
    if (booking.user) {
      openModal('chat', {
        chatWith: booking.user,
        booking: booking
      });
    }
  };

  useEffect(() => {
    if (user?.role === 'provider') {
      fetchProviderBookings();
    }
    
    // Listen for messages being marked as read
    const handleMessagesMarkedAsRead = (event) => {
      const { bookingId } = event.detail;
      console.log('📖 Messages marked as read for booking:', bookingId);
      
      // Remove this booking from unread counts
      setUnreadCounts(prev => {
        const updated = { ...prev };
        delete updated[bookingId];
        return updated;
      });
    };
    
    window.addEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead);
    
    return () => {
      window.removeEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead);
    };
  }, [user]);

  const fetchProviderBookings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching provider bookings...');
      console.log('🔗 Using API URL:', `${process.env.REACT_APP_API_URL}/api/bookings/provider/my-bookings`);
      console.log('👤 Current user role:', user?.role);
      
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings/provider/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📚 Received provider bookings:', data);
      
      const providerBookings = data.bookings || data || [];
      console.log('📊 Number of bookings:', providerBookings.length);
      
      // Log details of each booking
      providerBookings.forEach((booking, index) => {
        console.log(`📋 Booking ${index + 1}:`, {
          id: booking._id,
          service: booking.service,
          serviceName: booking.service?.title,
          client: booking.user,
          clientName: booking.user?.name,
          date: booking.date,
          status: booking.status
        });
      });
      
      setBookings(providerBookings);
      
      // Fetch unread message counts
      try {
        console.log('🔄 Fetching unread counts for provider...');
        const unreadData = await chatService.getUnreadCounts();
        console.log('📨 Unread data response:', unreadData);
        if (unreadData.success) {
          setUnreadCounts(unreadData.unreadCounts);
          console.log('💬 Provider unread message counts:', unreadData.unreadCounts);
        } else {
          console.log('❌ Unread data not successful:', unreadData);
        }
      } catch (unreadError) {
        console.error('❌ Error fetching unread counts:', unreadError);
        // Don't show error to user, just log it
      }
    } catch (error) {
      console.error('❌ Error fetching provider bookings:', error);
      alert(`Failed to fetch bookings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      // Refresh bookings after status update
      await fetchProviderBookings();
      alert(`Booking ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status. Please try again.');
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#10b981';
      case 'completed': return '#6366f1';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'completed': return '🎯';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  // Filter and sort bookings
  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(a.date || a.preferredDate);
    const dateB = new Date(b.date || b.preferredDate);
    
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'date':
        return dateA - dateB;
      default:
        return 0;
    }
  });

  // Calculate stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  // Calculate revenue
  const revenue = {
    total: bookings.reduce((sum, b) => sum + (parseFloat(b.service?.price) || 0), 0),
    confirmed: bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (parseFloat(b.service?.price) || 0), 0),
    completed: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (parseFloat(b.service?.price) || 0), 0)
  };

  if (user?.role !== 'provider') {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem',
        paddingTop: '6rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
        <h2>Access Denied</h2>
        <p>This page is only accessible to service providers.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem',
        paddingTop: '6rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
        <h2>Loading your booked programs...</h2>
      </div>
    );
  }

  return (
    <div>
      {renderBookingNotification()}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem',
        paddingTop: '6rem',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📅 Booked Programs
            </h1>
            
            <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
              Manage and track all bookings for your services
            </p>
          </div>
          
          <button
            onClick={() => window.location.href = '/instant-service-history'}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            ⚡ View Instant Services
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: 'Total Bookings', count: stats.total, color: '#6366f1', icon: '📊' },
          { label: 'Pending', count: stats.pending, color: '#f59e0b', icon: '⏳' },
          { label: 'Confirmed', count: stats.confirmed, color: '#10b981', icon: '✅' },
          { label: 'Completed', count: stats.completed, color: '#6366f1', icon: '🎯' },
          { label: 'Total Revenue', count: `$${revenue.total.toFixed(2)}`, color: '#10b981', icon: '💰' },
          { label: 'Confirmed Revenue', count: `$${(revenue.confirmed + revenue.completed).toFixed(2)}`, color: '#059669', icon: '💵' }
        ].map((stat, index) => (
          <div key={index} style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div style={{ 
              fontSize: index >= 4 ? '1.5rem' : '2rem', 
              fontWeight: 'bold', 
              color: stat.color,
              marginBottom: '0.25rem'
            }}>
              {stat.count}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ 
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #f1f5f9',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>
              Filter:
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="date">By Service Date</option>
            </select>
          </div>
          
          <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6b7280' }}>
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {sortedBookings.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#374151' }}>
            {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {filter === 'all' 
              ? 'When clients book your services, they will appear here!'
              : `You don't have any ${filter} bookings at the moment.`
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sortedBookings.map((booking) => (
            <div
              key={booking._id}
              style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #f1f5f9',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold', 
                      marginBottom: '0.5rem',
                      color: '#1f2937'
                    }}>
                      {booking.service?.title || 'Service Name Not Available'}
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                      <strong>Client:</strong> {booking.user?.name || 'N/A'}
                    </p>
                    <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                      <strong>Email:</strong> {booking.user?.email || 'N/A'}
                    </p>
                    <p style={{ color: '#6b7280' }}>
                      <strong>Date:</strong> {formatDate(booking.date)}
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: getStatusColor(booking.status) + '20',
                      color: getStatusColor(booking.status),
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      marginBottom: '0.5rem'
                    }}>
                      {getStatusIcon(booking.status)}
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                      ${booking.service?.price || '0'}
                    </div>
                  </div>
                </div>
                
                {booking.notes && (
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                      <strong>Client Notes:</strong> {booking.notes}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleViewDetails(booking)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.9'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                  >
                    📋 View Details
                  </button>
                  {booking.user && (
                    <button
                      onClick={() => handleChatWithClient(booking)}
                      style={{
                        position: 'relative',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.opacity = '0.9'}
                      onMouseOut={(e) => e.target.style.opacity = '1'}
                    >
                      💬 Chat
                      {unreadCounts[booking._id] && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          border: '2px solid white'
                        }}>
                          {unreadCounts[booking._id] > 9 ? '9+' : unreadCounts[booking._id]}
                        </span>
                      )}
                    </button>
                  )}
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(booking._id, 'confirmed')}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.opacity = '0.9'}
                        onMouseOut={(e) => e.target.style.opacity = '1'}
                      >
                        ✅ Accept Booking
                      </button>
                      <button
                        onClick={() => handleStatusChange(booking._id, 'cancelled')}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.opacity = '0.9'}
                        onMouseOut={(e) => e.target.style.opacity = '1'}
                      >
                        ❌ Decline Booking
                      </button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(booking._id, 'completed')}
                      style={{
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.opacity = '0.9'}
                      onMouseOut={(e) => e.target.style.opacity = '1'}
                    >
                      🎯 Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  Booking Details
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  style={{
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '50%',
                    width: '2rem',
                    height: '2rem',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {selectedBooking.service?.title || 'Service Name Not Available'}
                  </h3>
                  <p style={{ color: '#6b7280' }}>
                    {selectedBooking.service?.description || 'No description available'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <strong>Client:</strong>
                    <br />
                    {selectedBooking.user?.name || 'N/A'}
                  </div>
                  <div>
                    <strong>Client Email:</strong>
                    <br />
                    {selectedBooking.user?.email || 'N/A'}
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <br />
                    <span style={{
                      color: getStatusColor(selectedBooking.status),
                      fontWeight: '500'
                    }}>
                      {getStatusIcon(selectedBooking.status)} {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <strong>Service Date:</strong>
                    <br />
                    {formatDate(selectedBooking.date)}
                  </div>
                  <div>
                    <strong>Price:</strong>
                    <br />
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                      ${selectedBooking.service?.price || '0'}
                    </span>
                  </div>
                  <div>
                    <strong>Booking ID:</strong>
                    <br />
                    <code style={{ fontSize: '0.875rem', background: '#f3f4f6', padding: '0.25rem', borderRadius: '4px' }}>
                      {selectedBooking._id.slice(-8)}
                    </code>
                  </div>
                  <div>
                    <strong>Booked On:</strong>
                    <br />
                    {formatDate(selectedBooking.createdAt)}
                  </div>
                  <div>
                    <strong>Client Phone:</strong>
                    <br />
                    {selectedBooking.user?.phone || 'Not provided'}
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <strong>Client Notes:</strong>
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      marginTop: '0.5rem'
                    }}>
                      {selectedBooking.notes}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedBooking._id, 'confirmed');
                        setShowDetails(false);
                      }}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      ✅ Accept
                    </button>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedBooking._id, 'cancelled');
                        setShowDetails(false);
                      }}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      ❌ Decline
                    </button>
                  </>
                )}
                
                {selectedBooking.status === 'confirmed' && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedBooking._id, 'completed');
                      setShowDetails(false);
                    }}
                    style={{
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    🎯 Mark Completed
                  </button>
                )}

                <button
                  onClick={() => setShowDetails(false)}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
export default BookedPrograms;
