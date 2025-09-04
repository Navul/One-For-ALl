import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { apiRequestJSON, ENDPOINTS } from '../utils/api';

const UserDashboard = () => {
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [negotiations, setNegotiations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            // Fetch available services
            const servicesData = await apiRequestJSON(ENDPOINTS.SERVICES);
            setServices(servicesData || []);

            // Fetch user bookings
            const bookingsData = await apiRequestJSON(ENDPOINTS.USER_BOOKINGS);
            setBookings(bookingsData.bookings || []);

            // Fetch user negotiations
            const negotiationsData = await apiRequestJSON(`${ENDPOINTS.NEGOTIATIONS}?type=client&status=active`);
            setNegotiations(negotiationsData.negotiations || []);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };



    if (loading) {
        return <div className="loading">Loading your dashboard...</div>;
    }

    return (
        <div className="dashboard page-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Welcome, {user?.name}!</h1>
                    <p className="user-role">Client Dashboard</p>

                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-grid">
                    {/* Quick Stats */}
                    <div className="stats-section">
                        <h2>Quick Stats</h2>
                        <div className="stats-cards">
                            <div className="stat-card">
                                <h3>Available Services</h3>
                                <p className="stat-number">{services.length}</p>
                            </div>
                            <div className="stat-card">
                                <Link to="/my-bookings" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3>My Bookings</h3>
                                    <p className="stat-number">{bookings.length}</p>
                                    <p className="stat-subtitle">View all bookings</p>
                                </Link>
                            </div>
                            <div className="stat-card">
                                <Link to="/negotiations" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3>Active Negotiations</h3>
                                    <p className="stat-number">{negotiations.length}</p>
                                    <p className="stat-subtitle">Click to view</p>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Recent Bookings */}
                    <div className="bookings-section">
                        <h2>Recent Bookings</h2>
                        {bookings.length > 0 ? (
                            <div className="bookings-list">
                                {bookings.slice(0, 5).map((booking, index) => (
                                    <div key={booking._id || index} className="booking-item">
                                        <h4>{booking.service?.title || 'Service'}</h4>
                                        <p>Date: {new Date(booking.date).toLocaleDateString() || 'TBD'}</p>
                                        <p>Price: ${booking.finalPrice || booking.totalAmount || booking.service?.price || 'N/A'}</p>
                                        <span className={`status ${booking.status || 'pending'}`}>
                                            {booking.status || 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No bookings yet. Start browsing services!</p>
                        )}
                    </div>


                </div>
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

                .stats-section {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .stats-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
                    color: #4299e1;
                    margin: 0;
                }

                .stat-subtitle {
                    font-size: 0.8rem;
                    color: #718096;
                    margin: 0.5rem 0 0 0;
                    font-style: italic;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
                    transition: transform 0.2s ease;
                    cursor: pointer;
                }

                .bookings-section,
                .services-section {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .bookings-list {
                    display: grid;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .booking-item {
                    background: white;
                    padding: 1rem;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 0.5rem;
                }

                .booking-item h4 {
                    margin: 0 0 0.5rem 0;
                    color: #2d3748;
                }

                .booking-item p {
                    margin: 0.25rem 0;
                    color: #666;
                    font-size: 0.875rem;
                }

                .status {
                    display: inline-block;
                    margin-top: 0.5rem;
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
                    color: #4299e1;
                    font-size: 1rem !important;
                }

                .book-btn {
                    background: #4299e1;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    width: 100%;
                    margin-top: 0.5rem;
                }

                .book-btn:hover {
                    background: #3182ce;
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

                    .services-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default UserDashboard;
