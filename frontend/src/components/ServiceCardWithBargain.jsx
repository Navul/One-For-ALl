import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import BargainSystem from './BargainSystem';

const ServiceCardWithBargain = ({ 
  service, 
  bookingDates, 
  setBookingDates, 
  bookingStatus, 
  handleBook, 
  formatDistance 
}) => {
  const { user } = useContext(AuthContext);
  const [showBargain, setShowBargain] = useState(false);

  const categories = [
    { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
    { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
    { id: 'electrical', name: 'Electrical', icon: '⚡' },
    { id: 'painting', name: 'Painting', icon: '🎨' },
    { id: 'gardening', name: 'Gardening', icon: '🌱' },
    { id: 'moving', name: 'Moving', icon: '📦' },
    { id: 'handyman', name: 'Handyman', icon: '🔨' },
    { id: 'automotive', name: 'Automotive', icon: '🚗' },
    { id: 'tutoring', name: 'Tutoring', icon: '📚' },
    { id: 'fitness', name: 'Fitness', icon: '💪' },
    { id: 'beauty', name: 'Beauty & Wellness', icon: '💄' },
    { id: 'pet-care', name: 'Pet Care', icon: '🐕' },
    { id: 'appliance-repair', name: 'Appliance Repair', icon: '🔧' },
    { id: 'carpentry', name: 'Carpentry', icon: '🪚' },
    { id: 'roofing', name: 'Roofing', icon: '🏠' },
    { id: 'others', name: 'Others', icon: '⭐' }
  ];

  // Handle missing or undefined category by defaulting to 'others'
  const serviceCategory = service.category || 'others';
  const categoryInfo = categories.find(cat => cat.id === serviceCategory) || { name: 'Others', icon: '⚡' };

  // Calculate price limits for display
  const priceLimit = 0.3;
  const minPrice = Math.max(service.price * (1 - priceLimit), service.price * 0.5);
  const maxPrice = service.price * (1 + priceLimit);

  return (
    <div 
      key={service._id} 
      className="service-card" 
      style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        transition: 'transform 0.2s ease, shadow 0.2s ease'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.25rem', fontWeight: '600' }}>{service.title}</h3>
          {service.instantService && (
            <span style={{
              background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)',
              color: 'white',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              ⚡ INSTANT
            </span>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: '#f7fafc',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.8rem',
          color: '#4a5568',
          fontWeight: '500'
        }}>
          <span style={{ fontSize: '1rem' }}>{categoryInfo.icon}</span>
          {categoryInfo.name}
        </div>
      </div>

      <p style={{ margin: '0.75rem 0', color: '#4a5568', lineHeight: '1.5' }}>{service.description}</p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <p style={{ 
            fontWeight: '700', 
            color: '#059669', 
            fontSize: '1.1rem',
            margin: 0
          }}>${service.price}</p>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Range: ${minPrice.toFixed(0)} - ${maxPrice.toFixed(0)}
          </div>
        </div>
        
        {service.distance && (
          <span style={{
            background: '#e3f2fd',
            color: '#1565c0',
            padding: '0.25rem 0.5rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}>
            📍 {formatDistance(service.distance)}
          </span>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        {service.provider && (
          <p style={{ 
            fontSize: '0.9rem', 
            color: '#6b7280', 
            margin: '0 0 0.5rem 0',
            fontStyle: 'italic'
          }}>
            Provider: {service.provider.name}
          </p>
        )}
        
        {service.rating && service.rating.averageRating > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: '#ffc107'
          }}>
            <span>⭐ {service.rating.averageRating.toFixed(1)}</span>
            <span style={{ color: '#6b7280' }}>({service.rating.totalReviews} reviews)</span>
          </div>
        )}

        {service.instantService && service.responseTime && (
          <p style={{
            fontSize: '0.85rem',
            color: '#e67e22',
            margin: '0.5rem 0 0 0',
            fontWeight: '600'
          }}>
            🕐 Response time: {service.responseTime}
          </p>
        )}
      </div>
      
      {/* Bargaining System Integration */}
      {showBargain ? (
        <div style={{ 
          background: '#fff8dc', 
          padding: '1rem', 
          borderRadius: '8px', 
          border: '1px solid #f59e0b',
          marginBottom: '1rem'
        }}>
          <BargainSystem 
            service={service}
            currentUser={user}
            onNegotiationUpdate={() => {
              setShowBargain(false);
              // Could add callback to refresh negotiations
            }}
          />
          <button
            onClick={() => setShowBargain(false)}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Close Bargain
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {user && (
            <button
              onClick={() => setShowBargain(true)}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={e => e.target.style.background = '#d97706'}
              onMouseLeave={e => e.target.style.background = '#f59e0b'}
            >
              🤝 Bargain Price
            </button>
          )}
          <button
            style={{
              flex: user ? 1 : 2,
              padding: '0.75rem',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
            onClick={() => setShowBargain(false)} // For now, just toggle for demo
          >
            💳 Book at ${service.price}
          </button>
        </div>
      )}

      {/* Original booking form */}
      <input
        type="date"
        value={bookingDates[service._id] || ''}
        onChange={e => setBookingDates(prev => ({ ...prev, [service._id]: e.target.value }))}
        style={{ 
          width: '100%',
          marginBottom: '0.75rem', 
          padding: '0.75rem', 
          borderRadius: '8px', 
          border: '2px solid #e2e8f0',
          fontSize: '0.95rem',
          outline: 'none',
          transition: 'border-color 0.3s ease'
        }}
        onFocus={e => e.target.style.borderColor = '#3b82f6'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
      
      <button
        style={{ 
          width: '100%',
          padding: '0.75rem 1rem', 
          borderRadius: '8px', 
          background: bookingStatus[service._id] === 'loading' ? '#9ca3af' : '#059669', 
          color: 'white', 
          border: 'none', 
          fontWeight: '600', 
          cursor: bookingStatus[service._id] === 'loading' ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s ease',
          fontSize: '0.95rem'
        }}
        disabled={bookingStatus[service._id] === 'loading'}
        onClick={() => handleBook(service._id)}
        onMouseEnter={e => {
          if (bookingStatus[service._id] !== 'loading') {
            e.target.style.background = '#047857';
          }
        }}
        onMouseLeave={e => {
          if (bookingStatus[service._id] !== 'loading') {
            e.target.style.background = '#059669';
          }
        }}
      >
        {bookingStatus[service._id] === 'loading' ? 'Booking...' : 'Book Service'}
      </button>
      
      {bookingStatus[service._id] === 'success' && (
        <p style={{ color: '#059669', marginTop: '0.75rem', fontWeight: '500', textAlign: 'center' }}>
          ✅ Booking successful!
        </p>
      )}
      
      {bookingStatus[service._id] && bookingStatus[service._id] !== 'success' && bookingStatus[service._id] !== 'loading' && (
        <p style={{ color: '#ef4444', marginTop: '0.75rem', fontWeight: '500', textAlign: 'center' }}>
          ❌ {bookingStatus[service._id]}
        </p>
      )}
    </div>
  );
};

export default ServiceCardWithBargain;
