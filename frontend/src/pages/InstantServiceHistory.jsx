import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';

const InstantServiceHistory = () => {
  const { user } = useAuth();
  const [instantServices, setInstantServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled
  const [sortBy, setSortBy] = useState('newest');

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewService, setReviewService] = useState(null);

  useEffect(() => {
    fetchInstantServices();
  }, []);

  const fetchInstantServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view your instant service history');
        setLoading(false);
        return;
      }

      // For now, let's test with the debug endpoint to see all requests
      console.log('🧪 Testing with debug endpoint first...');
      
      try {
        const debugResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/instant-services/debug/all-requests`);
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('🔍 Debug API - All requests in database:', debugData);
          
          if (debugData.data && Array.isArray(debugData.data)) {
            const formattedServices = debugData.data.map(service => ({
              ...service,
              service: { 
                title: `${service.type.charAt(0).toUpperCase() + service.type.slice(1)} Service`, 
                description: service.details 
              },
              date: service.createdAt,
              totalAmount: service.negotiation?.finalPrice || 0,
              notes: service.details,
              status: service.status,
              _id: service._id,
              isInstantService: true
            }));
            
            console.log('✅ Showing all instant service requests (debug mode)');
            setInstantServices(formattedServices);
            setLoading(false);
            return;
          }
        }
      } catch (debugError) {
        console.log('Debug endpoint failed, continuing with normal flow:', debugError);
      }

      // Original logic as fallback
      const bookingsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        console.log('📚 Bookings API response:', bookingsData);
        
        // Handle different response formats
        const allBookings = Array.isArray(bookingsData) 
          ? bookingsData 
          : (bookingsData.bookings || []);
          
        console.log('📋 All bookings:', allBookings);
        const instantBookings = allBookings.filter(booking => booking.isInstantService);
        
        // Also try to get from the new instant service requests API
        try {
          const instantResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/instant-services/my/requests`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (instantResponse.ok) {
            const instantData = await instantResponse.json();
            console.log('⚡ Instant services API response:', instantData);
            
            // Merge both types of data
            const allInstantServices = [...instantBookings];
            
            // Add instant service requests that aren't already in bookings
            // The API returns data in 'data' field, not 'services'
            const instantServiceRequests = instantData.data || instantData.services || [];
            
            if (Array.isArray(instantServiceRequests)) {
              instantServiceRequests.forEach(service => {
                if (!allInstantServices.find(booking => booking._id === service._id)) {
                  allInstantServices.push({
                    ...service,
                    service: { 
                      title: `${service.type.charAt(0).toUpperCase() + service.type.slice(1)} Service`, 
                      description: service.details 
                    },
                    date: service.createdAt,
                    totalAmount: service.negotiation?.finalPrice || 0,
                    notes: service.details,
                    // Map database fields to expected frontend format
                    status: service.status,
                    _id: service._id,
                    isInstantService: true
                  });
                }
              });
            }
            
            console.log('✅ Final merged instant services:', allInstantServices);
            setInstantServices(allInstantServices);
          } else {
            console.log('⚠️ Instant services API failed, using bookings only');
            setInstantServices(instantBookings);
          }
        } catch (instantError) {
          console.log('💡 Instant services API not available, showing bookings only:', instantError.message);
          setInstantServices(instantBookings);
        }
      } else {
        const errorText = await bookingsResponse.text();
        console.error('❌ Bookings API failed:', bookingsResponse.status, errorText);
        throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
      }
    } catch (err) {
      console.error('Error fetching instant services:', err);
      setError('Failed to load instant service history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'completed': return '#059669';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Handle opening review modal
  const handleWriteReview = (service) => {
    setReviewService(service);
    setShowReviewModal(true);
  };

  // Handle review submission
  const handleReviewSubmitted = () => {
    fetchInstantServices(); // Refresh services after review submission
    setReviewService(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'in-progress': return '🔄';
      case 'completed': return '✨';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (estimatedArrival, actualArrival, completionTime) => {
    if (completionTime && estimatedArrival) {
      const start = new Date(estimatedArrival);
      const end = new Date(completionTime);
      const duration = Math.round((end - start) / (1000 * 60)); // minutes
      return `${duration} minutes`;
    }
    return 'N/A';
  };

  // Filter services
  const filteredServices = instantServices.filter(service => {
    if (filter === 'all') return true;
    return service.status === filter;
  });

  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt);
    const dateB = new Date(b.date || b.createdAt);
    
    switch (sortBy) {
      case 'newest':
        return dateB - dateA;
      case 'oldest':
        return dateA - dateB;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem',
        paddingTop: '6rem' 
      }}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>
            Loading your instant service history...
          </div>
        </div>
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              ⚡ Instant Service History
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>
              {user?.role === 'provider' 
                ? 'View all instant service requests you\'ve handled' 
                : 'View all your instant service requests and bookings'
              }
            </p>
          </div>
          
          <button
            onClick={() => {
              // Navigate based on user role
              if (user?.role === 'provider') {
                window.location.href = '/booked-programs';
              } else {
                window.location.href = '/my-bookings';
              }
            }}
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
            {user?.role === 'provider' ? '📋 View Booked Programs' : '📚 View Regular Bookings'}
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
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => {
          const count = status === 'all' 
            ? instantServices.length 
            : instantServices.filter(s => s.status === status).length;
          
          return (
            <div key={status} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: status === 'all' ? '#3b82f6' : getStatusColor(status) 
              }}>
                {count}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'capitalize' }}>
                {status === 'all' ? 'Total' : status}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>
            Status:
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
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
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
          </select>
        </div>
        
        <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6b7280' }}>
          {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <p style={{ color: '#dc2626', margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {/* Services List */}
      {sortedServices.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
          <h3 style={{ fontSize: '1.125rem', color: '#1f2937', marginBottom: '0.5rem' }}>
            No Instant Services Found
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {filter === 'all' 
              ? (user?.role === 'provider' 
                ? "You haven't handled any instant services yet." 
                : "You haven't used any instant services yet.")
              : (user?.role === 'provider'
                ? `You don't have any ${filter} instant services.`
                : `You don't have any ${filter} instant services.`)
            }
          </p>
          {filter === 'all' && (
            <button
              onClick={() => window.location.href = user?.role === 'provider' ? '/instant-services-provider' : '/instant-services'}
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
              {user?.role === 'provider' ? 'Accept Instant Requests' : 'Request Instant Service'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sortedServices.map((service) => (
            <div
              key={service._id}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0, marginBottom: '0.5rem' }}>
                    ⚡ {service.service?.title || `${service.type} Service` || 'Instant Service'}
                  </h3>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
                    {service.service?.description || service.details || service.notes || 'No description available'}
                  </p>
                </div>
                <span style={{
                  background: `${getStatusColor(service.status)}20`,
                  color: getStatusColor(service.status),
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {getStatusIcon(service.status)} {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </span>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                <div>
                  <strong style={{ color: '#1f2937' }}>Requested:</strong><br />
                  {formatDate(service.date || service.createdAt)}
                </div>
                
                {service.estimatedArrival && (
                  <div>
                    <strong style={{ color: '#1f2937' }}>Estimated Arrival:</strong><br />
                    {formatDate(service.estimatedArrival)}
                  </div>
                )}
                
                {service.actualArrival && (
                  <div>
                    <strong style={{ color: '#1f2937' }}>Actual Arrival:</strong><br />
                    {formatDate(service.actualArrival)}
                  </div>
                )}
                
                {service.completionTime && (
                  <div>
                    <strong style={{ color: '#1f2937' }}>Completed:</strong><br />
                    {formatDate(service.completionTime)}
                  </div>
                )}

                {service.totalAmount > 0 && (
                  <div>
                    <strong style={{ color: '#1f2937' }}>Amount:</strong><br />
                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#10b981' }}>
                      ${service.totalAmount}
                    </span>
                  </div>
                )}

                {service.distance > 0 && (
                  <div>
                    <strong style={{ color: '#1f2937' }}>Distance:</strong><br />
                    {service.distance < 1 
                      ? `${Math.round(service.distance * 1000)}m`
                      : `${service.distance.toFixed(1)}km`
                    }
                  </div>
                )}
              </div>

              {service.customerLocation?.address && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '6px' }}>
                  <strong style={{ fontSize: '0.875rem', color: '#1f2937' }}>Service Address:</strong><br />
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    📍 {service.customerLocation.address}
                  </span>
                </div>
              )}

              {/* Review Button for completed services */}
              {service.status === 'completed' && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    onClick={() => handleWriteReview(service)}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.opacity = '0.9';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.opacity = '1';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    ⭐ Write Review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewService && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewService(null);
          }}
          serviceId={reviewService._id || reviewService.service?._id || 'instant-service'}
          serviceName={reviewService.service?.title || `${reviewService.type} Service` || 'Instant Service'}
          booking={reviewService}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default InstantServiceHistory;
