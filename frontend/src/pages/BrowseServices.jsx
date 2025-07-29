import React, { useEffect, useState } from 'react';

const BrowseServices = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/services');
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
  }, []);


  // Real-time filter logic
  useEffect(() => {
    let filtered = services;
    if (search.trim()) {
      const pattern = search.trim().toLowerCase();
      filtered = filtered.filter(s => s.title && s.title.toLowerCase().includes(pattern));
    }
    if (minPrice !== '') {
      filtered = filtered.filter(s => Number(s.price) >= Number(minPrice));
    }
    if (maxPrice !== '') {
      filtered = filtered.filter(s => Number(s.price) <= Number(maxPrice));
    }
    setFilteredServices(filtered);
  }, [search, minPrice, maxPrice, services]);

  return (
    <div className="browse-services-page" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Browse Services</h1>
      <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 2, padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
          min="0"
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
          min="0"
        />
        <button type="submit" style={{ padding: '0.5rem 1.5rem', borderRadius: 4, background: '#4299e1', color: 'white', border: 'none', fontWeight: 'bold' }}>
          Search
        </button>
      </form>
      {loading ? (
        <div>Loading services...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : filteredServices.length === 0 ? (
        <div>No services available at the moment.</div>
      ) : (
        <div className="services-list" style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredServices.map(service => (
            <div key={service._id} className="service-card" style={{ background: '#f7fafc', padding: '1rem', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: 0 }}>{service.title}</h3>
              <p style={{ margin: '0.5rem 0' }}>{service.description}</p>
              <p style={{ fontWeight: 'bold', color: '#48bb78' }}>${service.price}</p>
              {/* Optionally add a Book button here */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseServices;
