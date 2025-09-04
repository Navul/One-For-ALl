import React, { useEffect, useState } from 'react';
import locationService from '../services/locationService';
import GoogleMap from '../components/GoogleMap';
import LocationPermission from '../components/LocationPermission';
import ServiceCardWithBargain from '../components/ServiceCardWithBargain';

const BrowseServices = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [sortBy, setSortBy] = useState('relevance'); // relevance, distance, price, rating
  const [showInstantOnly, setShowInstantOnly] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/services/categories');
        const data = await res.json();
        if (res.ok) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError('');
      try {
        let services;
        
        if (userLocation && (showInstantOnly || sortBy === 'distance')) {
          // Use location-based API for nearby/instant services
          const options = {
            radius: 25,
            instantOnly: showInstantOnly
          };
          
          if (selectedCategory !== 'all') {
            options.category = selectedCategory;
          }
          
          const response = await locationService.getNearbyServices(
            userLocation.lat,
            userLocation.lng,
            options
          );
          services = response.services || [];
        } else {
          // Use regular API
          let url = '/api/services';
          const params = new URLSearchParams();
          
          if (selectedCategory !== 'all') {
            params.append('category', selectedCategory);
          }
          
          if (search.trim()) {
            params.append('search', search.trim());
          }
          
          if (params.toString()) {
            url += '?' + params.toString();
          }
          
          const res = await fetch(url);
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to fetch services');
          }
          
          services = await res.json();
        }
        
        setServices(services);
        setFilteredServices(services);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err.message || 'Something went wrong while fetching services');
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [selectedCategory, search, userLocation, showInstantOnly, sortBy]);


  // Real-time price filter logic
  useEffect(() => {
    let filtered = services;
    if (minPrice !== '') {
      filtered = filtered.filter(s => Number(s.price) >= Number(minPrice));
    }
    if (maxPrice !== '') {
      filtered = filtered.filter(s => Number(s.price) <= Number(maxPrice));
    }
    
    // Sort services
    if (sortBy === 'distance' && userLocation) {
      filtered = [...filtered].sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else if (sortBy === 'price') {
      filtered = [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => (b.rating?.averageRating || 0) - (a.rating?.averageRating || 0));
    }
    
    setFilteredServices(filtered);
  }, [services, minPrice, maxPrice, sortBy, userLocation]);

  const handleLocationGranted = (location) => {
    setUserLocation({
      lat: location.latitude,
      lng: location.longitude
    });
  };

  const formatDistance = (distance) => {
    if (!distance) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance}km away`;
  };

  // Booking logic
  const [bookingStatus, setBookingStatus] = useState({});
  const [bookingDates, setBookingDates] = useState({});
  const handleBook = async (serviceId) => {
    let date = bookingDates[serviceId];
    
    if (!date || date.trim() === '') {
      setBookingStatus(prev => ({ ...prev, [serviceId]: 'Please select a start date.' }));
      return;
    }
    
    setBookingStatus(prev => ({ ...prev, [serviceId]: 'loading' }));
    try {
      const token = localStorage.getItem('token');
      const requestBody = { 
        serviceId, 
        date: date.trim(),
        location: '', // Optional for regular bookings
        notes: ''     // Optional
      };
      
      // Use unified booking system
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to book service');
      setBookingStatus(prev => ({ ...prev, [serviceId]: 'success' }));
    } catch (err) {
      setBookingStatus(prev => ({ ...prev, [serviceId]: err.message }));
    }
  };

  return (
    <div className="browse-services-page page-container" style={{ 
      maxWidth: 900, 
      margin: '0 auto', 
      padding: '2rem',
      paddingTop: '6rem' // Extra space for fixed navbar
    }}>
      <h1 style={{ 
        marginBottom: '2rem',
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#2d3748',
        textAlign: 'center'
      }}>Browse Services</h1>

      {/* Category Filter */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#4a5568', fontSize: '1.1rem' }}>Categories</h3>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '25px',
                border: selectedCategory === category.id ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                background: selectedCategory === category.id ? '#3b82f6' : 'white',
                color: selectedCategory === category.id ? 'white' : '#4a5568',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: selectedCategory === category.id ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Price Filters */}
      <form onSubmit={e => e.preventDefault()} style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        alignItems: 'center',
        padding: '1.5rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search services..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ 
            flex: '2 1 200px', 
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
        <input
          type="number"
          placeholder="Min Price ($)"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          style={{ 
            flex: '1 1 120px', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            border: '2px solid #e2e8f0',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          min="0"
        />
        <input
          type="number"
          placeholder="Max Price ($)"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          style={{ 
            flex: '1 1 120px', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            border: '2px solid #e2e8f0',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          min="0"
        />
      </form>

      {/* Location Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        alignItems: 'center',
        padding: '1rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              padding: '0.5rem 1rem',
              background: showMap ? '#3b82f6' : '#f8f9fa',
              color: showMap ? 'white' : '#495057',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            {showMap ? '📍 Hide Map' : '🗺️ Show Map'}
          </button>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="price">Sort by Price</option>
            <option value="rating">Sort by Rating</option>
            {userLocation && <option value="distance">Sort by Distance</option>}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={showInstantOnly}
              onChange={(e) => setShowInstantOnly(e.target.checked)}
            />
            ⚡ Instant Services Only
          </label>
        </div>

        {!userLocation && (
          <div style={{ marginLeft: 'auto' }}>
            <LocationPermission 
              onLocationGranted={handleLocationGranted}
              showToggle={false}
              autoRequest={false}
            />
          </div>
        )}

        {userLocation && (
          <div style={{ 
            marginLeft: 'auto', 
            fontSize: '0.9rem', 
            color: '#28a745',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ✅ Location enabled - showing nearby services
          </div>
        )}
      </div>

      {/* Map Section */}
      {showMap && userLocation && (
        <div style={{ marginBottom: '2rem' }}>
          <GoogleMap
            center={userLocation}
            services={filteredServices}
            height="400px"
            showUserLocation={true}
          />
        </div>
      )}

      {loading ? (
        <div>Loading services...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : filteredServices.length === 0 ? (
        <div>No services available at the moment.</div>
      ) : (
        <div className="services-list" style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredServices.map(service => (
            <ServiceCardWithBargain
              key={service._id}
              service={service}
              bookingDates={bookingDates}
              setBookingDates={setBookingDates}
              bookingStatus={bookingStatus}
              handleBook={handleBook}
              formatDistance={formatDistance}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseServices;
