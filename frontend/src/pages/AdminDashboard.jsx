import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProviders: 0,
        totalServices: 0,
        totalBookings: 0,
        activeUsers: 0,
        bannedUsers: 0
    });
    const [users, setUsers] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

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
            showMessage('error', 'Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const handleLogout = () => {
        logout();
    };

    const handleBanUser = async () => {
        if (!selectedUser || !banReason.trim()) {
            showMessage('error', 'Please provide a ban reason');
            return;
        }

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/users/${selectedUser._id}/ban`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: banReason })
            });
            
            if (response.ok) {
                showMessage('success', `User ${selectedUser.name} has been banned`);
                await fetchAdminData();
                setShowBanModal(false);
                setBanReason('');
                setSelectedUser(null);
            } else {
                const errorData = await response.json();
                showMessage('error', errorData.message || 'Failed to ban user');
            }
        } catch (error) {
            console.error('Error banning user:', error);
            showMessage('error', 'Failed to ban user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnbanUser = async (userId) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/users/${userId}/unban`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                showMessage('success', 'User has been unbanned');
                await fetchAdminData();
            } else {
                const errorData = await response.json();
                showMessage('error', errorData.message || 'Failed to unban user');
            }
        } catch (error) {
            console.error('Error unbanning user:', error);
            showMessage('error', 'Failed to unban user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (userId, permanent = true) => {
        const confirmText = permanent ? 
            'Are you sure you want to PERMANENTLY delete this user? This action cannot be undone and will remove all their data!' :
            'Are you sure you want to soft delete this user?';
        
        if (!window.confirm(confirmText)) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permanent })
            });
            
            if (response.ok) {
                const message = permanent ? 'User permanently deleted' : 'User soft deleted';
                showMessage('success', message);
                
                // Immediately remove user from local state
                setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
                
                // Also refresh data from server
                await fetchAdminData();
            } else {
                const errorData = await response.json();
                showMessage('error', errorData.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showMessage('error', 'Failed to delete user');
        } finally {
            setActionLoading(false);
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

            {/* Message Display */}
            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

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
                                <h3>Active Users</h3>
                                <p className="stat-number">{stats.activeUsers}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Banned Users</h3>
                                <p className="stat-number">{stats.bannedUsers}</p>
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
                                        {users.map((currentUser) => (
                                            <tr key={currentUser._id} className={currentUser.isBanned ? 'banned-user' : ''}>
                                                <td>{currentUser.name}</td>
                                                <td>{currentUser.email}</td>
                                                <td>
                                                    <span className={`role-badge ${currentUser.role}`}>
                                                        {currentUser.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${currentUser.isBanned ? 'banned' : 'active'}`}>
                                                        {currentUser.isBanned ? 'Banned' : 'Active'}
                                                    </span>
                                                    {currentUser.isBanned && currentUser.banReason && (
                                                        <div className="ban-reason">
                                                            Reason: {currentUser.banReason}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{new Date(currentUser.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedUser(currentUser);
                                                                setShowUserModal(true);
                                                            }}
                                                            className="btn-info"
                                                        >
                                                            View
                                                        </button>
                                                        
                                                        {!currentUser.isBanned ? (
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedUser(currentUser);
                                                                    setShowBanModal(true);
                                                                }}
                                                                className="btn-warning"
                                                                disabled={actionLoading || currentUser._id === user?._id}
                                                            >
                                                                Ban
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleUnbanUser(currentUser._id)}
                                                                className="btn-success"
                                                                disabled={actionLoading}
                                                            >
                                                                Unban
                                                            </button>
                                                        )}

                                                        <button 
                                                            onClick={() => handleDeleteUser(currentUser._id, true)}
                                                            className="btn-danger"
                                                            disabled={actionLoading || currentUser._id === user?._id}
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
                            <div className="services-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Provider</th>
                                            <th>Price</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {services.map((service) => (
                                            <tr key={service._id}>
                                                <td>{service.title}</td>
                                                <td>{service.category}</td>
                                                <td>{service.provider?.name || 'N/A'}</td>
                                                <td>${service.price}</td>
                                                <td>
                                                    <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                                                        {service.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="btn-info">View</button>
                                                        <button className="btn-danger">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="no-data">No services found.</p>
                        )}
                    </div>
                </div>
            </main>

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>User Details</h3>
                            <button 
                                onClick={() => setShowUserModal(false)}
                                className="close-btn"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Name:</strong> {selectedUser.name}</p>
                            <p><strong>Email:</strong> {selectedUser.email}</p>
                            <p><strong>Role:</strong> {selectedUser.role}</p>
                            <p><strong>Phone:</strong> {selectedUser.phone || 'Not provided'}</p>
                            <p><strong>Status:</strong> {selectedUser.isBanned ? 'Banned' : 'Active'}</p>
                            <p><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
                            {selectedUser.isBanned && (
                                <>
                                    <p><strong>Banned At:</strong> {new Date(selectedUser.bannedAt).toLocaleString()}</p>
                                    <p><strong>Ban Reason:</strong> {selectedUser.banReason}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Ban User Modal */}
            {showBanModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Ban User: {selectedUser.name}</h3>
                            <button 
                                onClick={() => setShowBanModal(false)}
                                className="close-btn"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Reason for ban:</label>
                                <textarea
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="Please provide a reason for banning this user..."
                                    rows="4"
                                />
                            </div>
                            <div className="modal-actions">
                                <button 
                                    onClick={() => setShowBanModal(false)}
                                    className="btn-cancel"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleBanUser}
                                    className="btn-danger"
                                    disabled={actionLoading || !banReason.trim()}
                                >
                                    {actionLoading ? 'Banning...' : 'Ban User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                    color: #3b82f6;
                    margin: 0;
                }

                .users-table,
                .services-table {
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
                    display: inline-block;
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

                .status-badge.banned {
                    background: #e53e3e;
                    color: white;
                }

                .ban-reason {
                    font-size: 0.7rem;
                    color: #666;
                    margin-top: 0.25rem;
                }

                .banned-user {
                    background: #fef5e7;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .btn-info,
                .btn-warning,
                .btn-success,
                .btn-danger,
                .btn-cancel {
                    padding: 0.25rem 0.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75rem;
                    transition: opacity 0.2s;
                }

                .btn-info {
                    background: #3182ce;
                    color: white;
                }

                .btn-warning {
                    background: #e53e3e;
                    color: white;
                }

                .btn-success {
                    background: #38a169;
                    color: white;
                }

                .btn-danger {
                    background: #e53e3e;
                    color: white;
                }

                .btn-cancel {
                    background: #a0aec0;
                    color: white;
                }

                .btn-info:hover,
                .btn-warning:hover,
                .btn-success:hover,
                .btn-danger:hover,
                .btn-cancel:hover {
                    opacity: 0.8;
                }

                .btn-info:disabled,
                .btn-warning:disabled,
                .btn-success:disabled,
                .btn-danger:disabled,
                .btn-cancel:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .modal {
                    background: white;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border-bottom: 1px solid #e2e8f0;
                }

                .modal-header h3 {
                    margin: 0;
                    color: #2d3748;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .close-btn:hover {
                    color: #333;
                    background: #f0f0f0;
                    border-radius: 50%;
                }

                .modal-body {
                    padding: 1rem;
                }

                .modal-body p {
                    margin: 0.5rem 0;
                    line-height: 1.5;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #2d3748;
                }

                .form-group textarea {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    font-family: inherit;
                    font-size: 0.875rem;
                    resize: vertical;
                    box-sizing: border-box;
                }

                .form-group textarea:focus {
                    outline: none;
                    border-color: #3182ce;
                }

                .modal-actions {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: flex-end;
                    margin-top: 1rem;
                }

                .modal-actions .btn-cancel,
                .modal-actions .btn-danger {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                }

                .message {
                    max-width: 1200px;
                    margin: 1rem auto;
                    padding: 1rem;
                    border-radius: 4px;
                    font-weight: 500;
                }

                .message.success {
                    background: #c6f6d5;
                    color: #22543d;
                    border-left: 4px solid #38a169;
                }

                .message.error {
                    background: #fed7d7;
                    color: #c53030;
                    border-left: 4px solid #e53e3e;
                }

                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 50vh;
                    font-size: 1.2rem;
                    color: #666;
                }

                .no-data {
                    text-align: center;
                    color: #666;
                    margin-top: 1rem;
                    padding: 2rem;
                    background: #f7fafc;
                    border-radius: 6px;
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

                    .stats-cards {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .users-table,
                    .services-table {
                        font-size: 0.875rem;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }

                    .modal {
                        margin: 1rem;
                        width: calc(100% - 2rem);
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
