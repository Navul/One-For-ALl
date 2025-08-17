import React, { useEffect, useState } from 'react';

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
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch services');
        setServices(data);
        setFilteredServices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [selectedCategory, search]);


  // Real-time price filter logic
  useEffect(() => {
    let filtered = services;
    if (minPrice !== '') {
      filtered = filtered.filter(s => Number(s.price) >= Number(minPrice));
    }
    if (maxPrice !== '') {
      filtered = filtered.filter(s => Number(s.price) <= Number(maxPrice));
    }
    setFilteredServices(filtered);
  }, [minPrice, maxPrice, services]);

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
      const requestBody = { serviceId, date: date.trim() };
      
      const res = await fetch(`http://localhost:5000/api/bookings/book`, {
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
      {loading ? (
        <div>Loading services...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : filteredServices.length === 0 ? (
        <div>No services available at the moment.</div>
      ) : (
        <div className="services-list" style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredServices.map(service => {
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
            
            return (
              <div key={service._id} className="service-card" style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                transition: 'transform 0.2s ease, shadow 0.2s ease'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.25rem', fontWeight: '600' }}>{service.title}</h3>
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
                <p style={{ 
                  fontWeight: '700', 
                  color: '#059669', 
                  fontSize: '1.1rem',
                  marginBottom: '1rem'
                }}>${service.price}</p>
                
                {service.provider && (
                  <p style={{ 
                    fontSize: '0.9rem', 
                    color: '#6b7280', 
                    marginBottom: '1rem',
                    fontStyle: 'italic'
                  }}>
                    Provider: {service.provider.name}
                  </p>
                )}
                
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
                  <p style={{ color: '#059669', marginTop: '0.75rem', fontWeight: '500', textAlign: 'center' }}>✅ Booking successful!</p>
                )}
                {bookingStatus[service._id] && bookingStatus[service._id] !== 'success' && bookingStatus[service._id] !== 'loading' && (
                  <p style={{ color: '#ef4444', marginTop: '0.75rem', fontWeight: '500', textAlign: 'center' }}>❌ {bookingStatus[service._id]}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseServices;
