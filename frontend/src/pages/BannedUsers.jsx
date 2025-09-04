import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const BannedUsers = () => {
    const { user } = useAuth();
    const [bannedUsers, setBannedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const fetchBannedUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users?banned=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const banned = data.data.filter(user => user.isBanned);
                setBannedUsers(banned);
            } else {
                showMessage('error', 'Failed to fetch banned users');
            }
        } catch (error) {
            console.error('Error fetching banned users:', error);
            showMessage('error', 'Failed to fetch banned users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBannedUsers();
    }, []);

    const handleUnbanUser = async (userId) => {
        if (!window.confirm('Are you sure you want to unban this user?')) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users/${userId}/unban`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                showMessage('success', 'User has been unbanned successfully');
                await fetchBannedUsers(); // Refresh the list
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

    const handleDeleteUser = async (userId) => {
        const confirmText = 'Are you sure you want to PERMANENTLY delete this banned user? This cannot be undone!';
        
        if (!window.confirm(confirmText)) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permanent: true })
            });
            
            if (response.ok) {
                showMessage('success', 'User has been permanently deleted');
                await fetchBannedUsers(); // Refresh the list
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
        return <div className="loading">Loading banned users...</div>;
    }

    return (
        <div className="banned-users page-container">
            <header className="page-header">
                <div className="header-content">
                    <div>
                        <h1>Banned Users Management</h1>
                        <p className="page-subtitle">Manage and review banned user accounts</p>
                    </div>
                </div>
            </header>

            {/* Message Display */}
            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <main className="page-main">
                <div className="content-section">
                    <div className="section-header">
                        <h2>Banned Users ({bannedUsers.length})</h2>
                        <p className="section-description">
                            Users who have been banned from the platform. You can unban them or permanently delete their accounts.
                        </p>
                    </div>

                    {bannedUsers.length > 0 ? (
                        <div className="banned-users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Ban Reason</th>
                                        <th>Banned Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bannedUsers.map((bannedUser) => (
                                        <tr key={bannedUser._id} className="banned-user-row">
                                            <td>{bannedUser.name}</td>
                                            <td>{bannedUser.email}</td>
                                            <td>
                                                <span className={`role-badge ${bannedUser.role}`}>
                                                    {bannedUser.role}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="ban-reason-cell">
                                                    {bannedUser.banReason || 'No reason provided'}
                                                </div>
                                            </td>
                                            <td>{new Date(bannedUser.bannedAt).toLocaleDateString()}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        onClick={() => handleUnbanUser(bannedUser._id)}
                                                        className="btn-success"
                                                        disabled={actionLoading}
                                                    >
                                                        Unban
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteUser(bannedUser._id)}
                                                        className="btn-danger"
                                                        disabled={actionLoading}
                                                    >
                                                        Delete Permanently
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-banned-users">
                            <div className="empty-state">
                                <span className="empty-icon">✅</span>
                                <h3>No Banned Users</h3>
                                <p>Great! There are currently no banned users on the platform.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style jsx>{`
                .banned-users {
                    min-height: 100vh;
                    background-color: #f7fafc;
                    padding-top: 80px;
                }

                .page-header {
                    background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
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
                }

                .header-content h1 {
                    margin: 0;
                    font-size: 2rem;
                }

                .page-subtitle {
                    margin: 0.5rem 0 0 0;
                    opacity: 0.9;
                    font-size: 1.1rem;
                }

                .page-main {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .content-section {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .section-header {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e2e8f0;
                }

                .section-header h2 {
                    margin: 0 0 0.5rem 0;
                    color: #2d3748;
                    font-size: 1.5rem;
                }

                .section-description {
                    margin: 0;
                    color: #666;
                    font-size: 0.95rem;
                }

                .banned-users-table {
                    overflow-x: auto;
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
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                .banned-user-row {
                    background: #fef5e7;
                    border-left: 4px solid #dc2626;
                }

                .banned-user-row:hover {
                    background: #fef3e7;
                }

                .role-badge {
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

                .ban-reason-cell {
                    max-width: 200px;
                    word-wrap: break-word;
                    font-size: 0.875rem;
                    color: #666;
                    font-style: italic;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .btn-success,
                .btn-danger {
                    padding: 0.25rem 0.75rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .btn-success {
                    background: #38a169;
                    color: white;
                }

                .btn-success:hover {
                    background: #2f855a;
                }

                .btn-danger {
                    background: #e53e3e;
                    color: white;
                }

                .btn-danger:hover {
                    background: #c53030;
                }

                .btn-success:disabled,
                .btn-danger:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .no-banned-users {
                    margin-top: 2rem;
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem 2rem;
                    background: #f7fafc;
                    border-radius: 8px;
                    border: 2px dashed #e2e8f0;
                }

                .empty-icon {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    margin: 0 0 0.5rem 0;
                    color: #2d3748;
                    font-size: 1.25rem;
                }

                .empty-state p {
                    margin: 0;
                    color: #666;
                    font-size: 0.95rem;
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

                @media (max-width: 768px) {
                    .page-main {
                        padding: 1rem;
                    }

                    .banned-users-table {
                        font-size: 0.875rem;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }

                    .ban-reason-cell {
                        max-width: 150px;
                    }
                }
            `}</style>
        </div>
    );
};

export default BannedUsers;
