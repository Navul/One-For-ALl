import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
// import ProviderNotifications from '../components/ProviderNotifications';

function AddServiceForm({ onServiceAdded, onClose }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('cleaning');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            console.log('Token:', token); // Debug token
            console.log('Sending data:', { title, description, price, category }); // Debug data
            
            const res = await fetch('http://localhost:5000/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, price, category })
            });
            
            const data = await res.json();
            console.log('Response:', data); // Debug response
            
            if (!res.ok) {
                throw new Error(data.message || `HTTP error! status: ${res.status}`);
            }
            
            setTitle(''); 
            setDescription(''); 
            setPrice('');
            setCategory('cleaning');
            onServiceAdded && onServiceAdded();
            onClose && onClose();
        } catch (err) {
            console.error('Error adding service:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-service-form">
            <h3>Add New Service</h3>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Service Name" 
                    className="form-input" 
                    required 
                />
                <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Description" 
                    className="form-textarea" 
                    required
                />
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                        Category
                    </label>
                    <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)} 
                        className="form-input"
                        required
                        style={{ 
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: 'white'
                        }}
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                <input 
                    type="number" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    placeholder="Price ($)" 
                    className="form-input" 
                    min="0" 
                    step="0.01"
                    required 
                />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Service'}
                    </button>
                    <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
}

const ProviderDashboard = () => {
    const { user } = useAuth();
    const [myServices, setMyServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddService, setShowAddService] = useState(false);

    useEffect(() => {
        fetchProviderData();
    }, []);

    const fetchProviderData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Fetch provider's services (both active and inactive for management)
            const servicesResponse = await fetch('http://localhost:5000/api/services/all-my-services', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json();
                setMyServices(servicesData.data || []);
            }

            // Fetch bookings for provider's services
            const bookingsResponse = await fetch('http://localhost:5000/api/bookings/provider', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (bookingsResponse.ok) {
                const bookingsData = await bookingsResponse.json();
                setBookings(bookingsData.bookings || []);
            }
        } catch (error) {
            console.error('Error fetching provider data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAvailability = async (serviceId, currentAvailability) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/services/${serviceId}/toggle-availability`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Update the service in the local state
                setMyServices(prevServices => 
                    prevServices.map(service => 
                        service._id === serviceId 
                            ? { ...service, availability: data.data.availability }
                            : service
                    )
                );
                console.log(data.message);
            } else {
                const errorData = await response.json();
                console.error('Error toggling availability:', errorData.message);
            }
        } catch (error) {
            console.error('Error toggling service availability:', error);
        }
    };

    // Removed unused handleLogout function

    if (loading) {
        return <div className="loading">Loading your dashboard...</div>;
    }

    return (
        <div className="dashboard page-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1>Welcome, {user?.name}!</h1>
                        <p className="user-role">Service Provider Dashboard</p>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-grid">
                    {/* Quick Stats */}
                    <div className="stats-section">
                        <h2>Business Overview</h2>
                        <div className="stats-cards">
                            <div className="stat-card">
                                <h3>Active Services</h3>
                                <p className="stat-number">{myServices.filter(s => s.availability).length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Pending Bookings</h3>
                                <p className="stat-number">{bookings.filter(b => b.status === 'pending').length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Total Bookings</h3>
                                <p className="stat-number">{bookings.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* My Services */}
                    <div className="services-section">
                        <div className="section-header">
                            <h2>My Services</h2>
                            <button 
                                onClick={() => setShowAddService(!showAddService)}
                                className="add-btn"
                            >
                                Add Service
                            </button>
                        </div>
                        
                        {showAddService && (
                            <AddServiceForm onServiceAdded={fetchProviderData} onClose={() => setShowAddService(false)} />
                        )}

                        {myServices.length > 0 ? (
                            <div className="services-grid">
                                {myServices.map((service, index) => {
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
                                        <div key={service._id || index} className="service-card" style={{
                                            border: service.availability ? '2px solid #4CAF50' : '2px solid #f44336',
                                            borderRadius: '8px',
                                            backgroundColor: service.availability ? '#f8fff8' : '#fff8f8'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <h4 style={{ margin: 0, flex: 1 }}>{service.title}</h4>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        background: '#f3f4f6',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        color: '#6b7280',
                                                        fontWeight: '500'
                                                    }}>
                                                        <span style={{ fontSize: '0.9rem' }}>{categoryInfo.icon}</span>
                                                        {categoryInfo.name}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 'bold',
                                                        color: service.availability ? '#4CAF50' : '#f44336',
                                                        background: 'white',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '12px',
                                                        border: `1px solid ${service.availability ? '#4CAF50' : '#f44336'}`
                                                    }}>
                                                        {service.availability ? 'ACTIVE' : 'INACTIVE'}
                                                    </div>
                                                </div>
                                            </div>
                                            <p style={{ marginBottom: '0.5rem' }}>{service.description}</p>
                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                                <p><strong>Starting:</strong> ₹{service.startingPrice}</p>
                                                <p><strong>Min:</strong> ₹{service.minPrice}</p>
                                                <p><strong>Max:</strong> ₹{service.maxPrice}</p>
                                            </div>
                                            <div className="service-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="edit-btn">Edit</button>
                                                <button className="delete-btn">Delete</button>
                                                <button
                                                    onClick={() => handleToggleAvailability(service._id, service.availability)}
                                                    style={{
                                                        backgroundColor: service.availability ? '#f44336' : '#4CAF50',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    {service.availability ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="no-data">No services yet. Add your first service to get started!</p>
                        )}
                    </div>
                </div>

                {/* Provider Notifications Section - temporarily disabled until notifications API is ready */}
                {/* <ProviderNotifications /> */}
            </main>

            <style jsx>{`
                .dashboard {
                    min-height: 100vh;
                    background-color: #f7fafc;
                    padding-top: 80px;
                }

                .dashboard-header {
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1d4ed8 100%);
                    color: white;
                    padding: 2rem 0;
                    margin-top: -1px;
                    position: relative;
                    z-index: 10;
                }

                .header-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-content h1 {
                    margin: 0;
                    font-size: 2rem;
                }

                .user-role {
                    margin: 0.5rem 0 0 0;
                    opacity: 0.9;
                }

                .logout-btn {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .logout-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .dashboard-main {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .dashboard-grid {
                    display: grid;
                    gap: 2rem;
                }

                .stats-section,
                .services-section {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .stats-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .stat-card {
                    background: #f7fafc;
                    padding: 1rem;
                    border-radius: 6px;
                    text-align: center;
                }

                .stat-number {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #48bb78;
                    margin: 0;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .add-btn {
                    background: #48bb78;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .add-btn:hover {
                    background: #38a169;
                }

                .add-service-form {
                    background: #f7fafc;
                    padding: 1rem;
                    border-radius: 6px;
                    margin-bottom: 1rem;
                }

                .add-service-form h3 {
                    margin: 0 0 1rem 0;
                }

                .form-input,
                .form-textarea {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 0.5rem;
                    box-sizing: border-box;
                }

                .form-textarea {
                    min-height: 80px;
                    resize: vertical;
                }

                .submit-btn {
                    background: #4299e1;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .services-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .service-card {
                    background: #f7fafc;
                    padding: 1rem;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }

                .service-card h4 {
                    margin: 0 0 0.5rem 0;
                    color: #2d3748;
                }

                .service-card p {
                    margin: 0 0 0.5rem 0;
                    color: #666;
                    font-size: 0.875rem;
                }

                .price {
                    font-weight: bold;
                    color: #48bb78;
                    font-size: 1rem !important;
                }

                .service-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }

                .edit-btn,
                .delete-btn {
                    flex: 1;
                    padding: 0.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                }

                .edit-btn {
                    background: #4299e1;
                    color: white;
                }

                .delete-btn {
                    background: #e53e3e;
                    color: white;
                }

                .no-data {
                    text-align: center;
                    color: #666;
                    margin-top: 1rem;
                    padding: 2rem;
                    background: #f7fafc;
                    border-radius: 6px;
                }

                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    font-size: 1.2rem;
                    color: #666;
                }

                @media (max-width: 768px) {
                    .header-content {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }

                    .dashboard-main {
                        padding: 1rem;
                    }

                    .section-header {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: stretch;
                    }

                    .services-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProviderDashboard;
