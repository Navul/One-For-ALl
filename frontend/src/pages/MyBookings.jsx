import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getUserBookings, updateBookingStatus } from '../services/bookingService';
import RatingModal from '../components/RatingModal'; // eslint-disable-line no-unused-vars

const MyBookings = () => {
  const { user } = useAuth(); // eslint-disable-line no-unused-vars
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, date
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRating, setShowRating] = useState(false); // eslint-disable-line no-unused-vars
  const [ratingBooking, setRatingBooking] = useState(null); // eslint-disable-line no-unused-vars
  const [showChat, setShowChat] = useState(false);
  const [chatProvider, setChatProvider] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching user bookings...');
      const userBookings = await getUserBookings();
      console.log('📚 Received bookings:', userBookings);
      console.log('📊 Number of bookings:', userBookings.length);
      
      // Log details of each booking
      userBookings.forEach((booking, index) => {
        console.log(`📋 Booking ${index + 1}:`, {
          id: booking._id,
          service: booking.service,
          serviceName: booking.service?.title,
          serviceProvider: booking.service?.provider,
          serviceProviderName: booking.service?.provider?.name,
          provider: booking.provider,
          date: booking.date,
          status: booking.status
        });
        
        // Deep dive into service structure
        if (booking.service) {
          console.log(`🔍 Service structure for booking ${index + 1}:`, {
            serviceKeys: Object.keys(booking.service),
            providerExists: !!booking.service.provider,
            providerKeys: booking.service.provider ? Object.keys(booking.service.provider) : null,
            providerName: booking.service.provider?.name,
            providerEmail: booking.service.provider?.email,
            fullProvider: booking.service.provider
          });
        }
      });
      
      setBookings(userBookings);
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      alert(`Failed to fetch bookings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to create a test booking for debugging
  const createTestBooking = async () => { // eslint-disable-line no-unused-vars
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bookings/debug/create-test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Test booking created successfully!');
        // Refresh bookings
        fetchBookings();
      } else {
        console.error('❌ Failed to create test booking:', result);
        alert('❌ Failed to create test booking: ' + result.message);
      }
    } catch (error) {
      console.error('❌ Error creating test booking:', error);
      alert('❌ Error creating test booking. Check console for details.');
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      // Refresh bookings after status update
      await fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status. Please try again.');
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const handleChatWithProvider = (booking) => {
    if (booking.service && booking.service.provider) {
      setChatProvider(booking.service.provider);
      setChatBooking(booking);
      setShowChat(true);
      setChatMessages([]);
      setChatInput('');
    }
  };

  // Setup socket connection for chat
  useEffect(() => {
    if (!showChat) return;
    if (!chatBooking) return;
    if (!socketRef.current) {
      socketRef.current = io(process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        reconnection: true,
      });
    }
    const socket = socketRef.current;
    // Join chat room for this booking
    socket.emit('chat:join', { bookingId: chatBooking._id });
    // Fetch chat history
    socket.emit('chat:history', { bookingId: chatBooking._id }, (msgs) => {
      setChatMessages(msgs || []);
    });
    // Listen for new messages
    socket.on('chat:message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.emit('chat:leave', { bookingId: chatBooking._id });
      socket.off('chat:message');
    };
  }, [showChat, chatBooking]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !chatBooking || !user) return;
    const msg = {
      bookingId: chatBooking._id,
      from: { id: user._id, name: user.name, role: user.role },
      to: { id: chatProvider._id, name: chatProvider.name, role: 'provider' },
      message: chatInput.trim(),
    };
    socketRef.current.emit('chat:message', msg);
    setChatInput('');
  };

  const handleRateService = (booking) => { // eslint-disable-line no-unused-vars
    setRatingBooking(booking);
    setShowRating(true);
  };

  const handleRatingSubmitted = () => { // eslint-disable-line no-unused-vars
    fetchBookings(); // Refresh bookings to show updated rating
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
    const dateA = new Date(a.preferredDate);
    const dateB = new Date(b.preferredDate);
    
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

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem',
        paddingTop: '6rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
        <h2>Loading your bookings...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '2rem',
      paddingTop: '6rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          📚 My Bookings
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
          Manage and track all your service bookings
        </p>
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
          { label: 'Completed', count: stats.completed, color: '#6366f1', icon: '🎯' }
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
              fontSize: '2rem', 
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#374151' }}>
            {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {filter === 'all' 
              ? 'Start by browsing our services and making your first booking!'
              : `You don't have any ${filter} bookings at the moment.`
            }
          </p>
          {filter === 'all' && (
            <button
              onClick={() => window.location.href = '/browse-services'}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Browse Services
            </button>
          )}
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
                      <strong>Provider:</strong> {booking.service?.provider?.name || 'N/A'}
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
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                      ${typeof booking.finalPrice === 'number' ? booking.finalPrice : (booking.service?.price || '0')}
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
                      <strong>Notes:</strong> {booking.notes}
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
                  {booking.service?.provider && (
                    <button
                      onClick={() => handleChatWithProvider(booking)}
                      style={{
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
                    </button>
                  )}
                  {booking.status === 'pending' && (
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
                      ❌ Cancel Booking
                    </button>
                  )}
                </div>
      {/* Chat Modal */}
      {showChat && chatProvider && chatBooking && (
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
          zIndex: 2000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            maxWidth: '420px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1f2937' }}>
                Chat with {chatProvider.name || 'Provider'}
              </h2>
              <button
                onClick={() => setShowChat(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '2rem',
                  height: '2rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >✕</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem', minHeight: '120px', color: '#6b7280', maxHeight: '220px', overflowY: 'auto' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888' }}>No messages yet.</div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} style={{
                    marginBottom: 8,
                    textAlign: msg.from?.id === user._id ? 'right' : 'left'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      background: msg.from?.id === user._id ? '#2563eb' : '#e5e7eb',
                      color: msg.from?.id === user._id ? 'white' : '#1f2937',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 13,
                      maxWidth: 220,
                      wordBreak: 'break-word'
                    }}>
                      {msg.message}
                    </span>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                      {msg.from?.name || 'User'} • {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
              />
              <button
                style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer' }}
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
              >Send</button>
            </div>
          </div>
        </div>
      )}
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
                    <strong>Provider:</strong>
                    <br />
                    {selectedBooking.service?.provider?.name || 'N/A'}
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
                    <strong>Preferred Date:</strong>
                    <br />
                    {formatDate(selectedBooking.date)}
                  </div>
                  <div>
                    <strong>Price:</strong>
                    <br />
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                      ${typeof selectedBooking.finalPrice === 'number' ? selectedBooking.finalPrice : (selectedBooking.service?.price || '0')}
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
                    <strong>Created:</strong>
                    <br />
                    {formatDate(selectedBooking.createdAt)}
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <strong>Notes:</strong>
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

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
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
  );
};

export default MyBookings;
