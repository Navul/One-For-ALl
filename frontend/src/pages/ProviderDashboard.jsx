import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ProviderDashboard = () => {
    const { user, logout } = useAuth();
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
            
            // Fetch provider's services
            const servicesResponse = await fetch('/api/services/my-services', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json();
                setMyServices(servicesData.data || []);
            }

            // Fetch bookings for provider's services
            const bookingsResponse = await fetch('/api/bookings/provider-bookings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (bookingsResponse.ok) {
                const bookingsData = await bookingsResponse.json();
                setBookings(bookingsData.data || []);
            }
        } catch (error) {
            console.error('Error fetching provider data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    if (loading) {
        return <div className="loading">Loading your dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1>Welcome, {user?.name}!</h1>
                        <p className="user-role">Service Provider Dashboard</p>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
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
                                <p className="stat-number">{myServices.length}</p>
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
                            <div className="add-service-form">
                                <h3>Add New Service</h3>
                                <form>
                                    <input type="text" placeholder="Service Name" className="form-input" />
                                    <textarea placeholder="Description" className="form-textarea"></textarea>
                                    <input type="number" placeholder="Price" className="form-input" />
                                    <button type="submit" className="submit-btn">Add Service</button>
                                </form>
                            </div>
                        )}

                        {myServices.length > 0 ? (
                            <div className="services-grid">
                                {myServices.map((service, index) => (
                                    <div key={service._id || index} className="service-card">
                                        <h4>{service.name}</h4>
                                        <p>{service.description}</p>
                                        <p className="price">${service.price || '0'}</p>
                                        <div className="service-actions">
                                            <button className="edit-btn">Edit</button>
                                            <button className="delete-btn">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No services yet. Add your first service to get started!</p>
                        )}
                    </div>

                    {/* Recent Bookings */}
                    <div className="bookings-section">
                        <h2>Recent Bookings</h2>
                        {bookings.length > 0 ? (
                            <div className="bookings-list">
                                {bookings.slice(0, 5).map((booking, index) => (
                                    <div key={index} className="booking-item">
                                        <div className="booking-info">
                                            <h4>{booking.serviceName || 'Service'}</h4>
                                            <p>Client: {booking.clientName || 'Client'}</p>
                                            <p>Date: {booking.date || 'TBD'}</p>
                                        </div>
                                        <div className="booking-actions">
                                            <span className={`status ${booking.status || 'pending'}`}>
                                                {booking.status || 'Pending'}
                                            </span>
                                            {booking.status === 'pending' && (
                                                <div className="action-buttons">
                                                    <button className="accept-btn">Accept</button>
                                                    <button className="reject-btn">Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No bookings yet.</p>
                        )}
                    </div>
                </div>
            </main>

            <style jsx>{`
                .dashboard {
                    min-height: 100vh;
                    background-color: #f7fafc;
                }

                .dashboard-header {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: white;
                    padding: 2rem 0;
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
                .services-section,
                .bookings-section {
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

                .bookings-list {
                    display: grid;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .booking-item {
                    background: #f7fafc;
                    padding: 1rem;
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .booking-info h4 {
                    margin: 0;
                    color: #2d3748;
                }

                .booking-info p {
                    margin: 0.25rem 0 0 0;
                    color: #666;
                    font-size: 0.875rem;
                }

                .booking-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    align-items: flex-end;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .accept-btn,
                .reject-btn {
                    padding: 0.25rem 0.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75rem;
                }

                .accept-btn {
                    background: #48bb78;
                    color: white;
                }

                .reject-btn {
                    background: #e53e3e;
                    color: white;
                }

                .status {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .status.pending {
                    background: #fed7d7;
                    color: #c53030;
                }

                .status.confirmed {
                    background: #c6f6d5;
                    color: #22543d;
                }

                .status.rejected {
                    background: #fed7d7;
                    color: #c53030;
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

                    .booking-item {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProviderDashboard;
