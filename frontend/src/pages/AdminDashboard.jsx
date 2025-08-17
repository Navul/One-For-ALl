import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProviders: 0,
        totalServices: 0,
        totalBookings: 0
    });
    const [users, setUsers] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAdminData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Fetch admin stats
            const statsResponse = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData.data || stats);
            }

            // Fetch all users
            const usersResponse = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                setUsers(usersData.data || []);
            }

            // Fetch all services
            const servicesResponse = await fetch('/api/services', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json();
                setServices(servicesData.data || []);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    }, [stats]);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const handleLogout = () => {
        logout();
    };

    const handleUserAction = async (userId, action) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/users/${userId}/${action}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                fetchAdminData(); // Refresh data
            }
        } catch (error) {
            console.error(`Error ${action} user:`, error);
        }
    };

    if (loading) {
        return <div className="loading">Loading admin dashboard...</div>;
    }

    return (
        <div className="dashboard page-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p className="user-role">Welcome, {user?.name}</p>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-grid">
                    {/* System Stats */}
                    <div className="stats-section">
                        <h2>System Overview</h2>
                        <div className="stats-cards">
                            <div className="stat-card">
                                <h3>Total Users</h3>
                                <p className="stat-number">{stats.totalUsers}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Service Providers</h3>
                                <p className="stat-number">{stats.totalProviders}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Total Services</h3>
                                <p className="stat-number">{stats.totalServices}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Total Bookings</h3>
                                <p className="stat-number">{stats.totalBookings}</p>
                            </div>
                        </div>
                    </div>

                    {/* User Management */}
                    <div className="users-section">
                        <h2>User Management</h2>
                        {users.length > 0 ? (
                            <div className="users-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Joined</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user._id}>
                                                <td>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`role-badge ${user.role}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {user.isActive ? (
                                                            <button 
                                                                onClick={() => handleUserAction(user._id, 'deactivate')}
                                                                className="deactivate-btn"
                                                            >
                                                                Deactivate
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleUserAction(user._id, 'activate')}
                                                                className="activate-btn"
                                                            >
                                                                Activate
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleUserAction(user._id, 'delete')}
                                                            className="delete-btn"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="no-data">No users found.</p>
                        )}
                    </div>

                    {/* Service Management */}
                    <div className="services-section">
                        <h2>Service Management</h2>
                        {services.length > 0 ? (
                            <div className="services-grid">
                                {services.map((service) => (
                                    <div key={service._id} className="service-card">
                                        <h4>{service.name}</h4>
                                        <p>{service.description}</p>
                                        <p className="price">${service.price || '0'}</p>
                                        <p className="provider">Provider: {service.providerName || 'Unknown'}</p>
                                        <div className="service-actions">
                                            <button className="edit-btn">Edit</button>
                                            <button className="delete-btn">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No services found.</p>
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

                .stats-section,
                .users-section,
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
                    color: #e53e3e;
                    margin: 0;
                }

                .users-table {
                    overflow-x: auto;
                    margin-top: 1rem;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                }

                th,
                td {
                    padding: 0.75rem;
                    text-align: left;
                    border-bottom: 1px solid #e2e8f0;
                }

                th {
                    background: #f7fafc;
                    font-weight: 600;
                    color: #2d3748;
                }

                .role-badge,
                .status-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .role-badge.user {
                    background: #bee3f8;
                    color: #2b6cb0;
                }

                .role-badge.provider {
                    background: #c6f6d5;
                    color: #22543d;
                }

                .role-badge.admin {
                    background: #fed7d7;
                    color: #c53030;
                }

                .status-badge.active {
                    background: #c6f6d5;
                    color: #22543d;
                }

                .status-badge.inactive {
                    background: #fed7d7;
                    color: #c53030;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .activate-btn,
                .deactivate-btn,
                .delete-btn,
                .edit-btn {
                    padding: 0.25rem 0.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75rem;
                }

                .activate-btn {
                    background: #48bb78;
                    color: white;
                }

                .deactivate-btn {
                    background: #ed8936;
                    color: white;
                }

                .delete-btn {
                    background: #e53e3e;
                    color: white;
                }

                .edit-btn {
                    background: #4299e1;
                    color: white;
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
                    color: #e53e3e;
                    font-size: 1rem !important;
                }

                .provider {
                    font-style: italic;
                    color: #4a5568 !important;
                }

                .service-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }

                .service-actions .edit-btn,
                .service-actions .delete-btn {
                    flex: 1;
                    padding: 0.5rem;
                    font-size: 0.875rem;
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

                    .users-table {
                        font-size: 0.875rem;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }

                    .services-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
