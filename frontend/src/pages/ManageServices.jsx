import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ManageServices = () => {
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedService, setSelectedService] = useState(null);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const fetchServices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/services', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setServices(data.services || []);
            } else {
                showMessage('error', 'Failed to fetch services');
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            showMessage('error', 'Failed to fetch services');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleDeleteService = async (serviceId) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                showMessage('success', 'Service has been deleted successfully');
                await fetchServices(); // Refresh the list
                setShowDeleteModal(false);
                setSelectedService(null);
            } else {
                const errorData = await response.json();
                showMessage('error', errorData.message || 'Failed to delete service');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            showMessage('error', 'Failed to delete service');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleServiceStatus = async (serviceId, currentStatus) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/services/${serviceId}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            
            if (response.ok) {
                const statusText = !currentStatus ? 'activated' : 'deactivated';
                showMessage('success', `Service has been ${statusText} successfully`);
                await fetchServices(); // Refresh the list
            } else {
                const errorData = await response.json();
                showMessage('error', errorData.message || 'Failed to update service status');
            }
        } catch (error) {
            console.error('Error updating service status:', error);
            showMessage('error', 'Failed to update service status');
        } finally {
            setActionLoading(false);
        }
    };

    // Filter services based on search and filters
    const filteredServices = services.filter(service => {
        const matchesSearch = service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            service.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
        
        const matchesStatus = filterStatus === 'all' || 
                            (filterStatus === 'active' && service.isActive) ||
                            (filterStatus === 'inactive' && !service.isActive);

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Get unique categories for filter dropdown
    const categories = [...new Set(services.map(service => service.category).filter(Boolean))];

    if (loading) {
        return <div className="loading">Loading services...</div>;
    }

    return (
        <div className="manage-services page-container">
            <header className="page-header">
                <div className="header-content">
                    <div>
                        <h1>Manage Services</h1>
                        <p className="page-subtitle">Manage and moderate platform services</p>
                    </div>
                    <div className="header-stats">
                        <div className="stat-item">
                            <span className="stat-number">{services.length}</span>
                            <span className="stat-label">Total Services</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{services.filter(s => s.isActive).length}</span>
                            <span className="stat-label">Active</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{services.filter(s => !s.isActive).length}</span>
                            <span className="stat-label">Inactive</span>
                        </div>
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
                {/* Filters and Search */}
                <div className="filters-section">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-controls">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Services Table */}
                <div className="content-section">
                    <div className="section-header">
                        <h2>Services ({filteredServices.length})</h2>
                    </div>

                    {filteredServices.length > 0 ? (
                        <div className="services-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Provider</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredServices.map((service) => (
                                        <tr key={service._id} className={!service.isActive ? 'inactive-service' : ''}>
                                            <td>
                                                <div className="service-info">
                                                    <h4 className="service-title">{service.title}</h4>
                                                    <p className="service-description">
                                                        {service.description?.substring(0, 100)}
                                                        {service.description?.length > 100 && '...'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="provider-info">
                                                    <span className="provider-name">
                                                        {service.provider?.name || 'Unknown'}
                                                    </span>
                                                    <span className="provider-email">
                                                        {service.provider?.email || ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="category-badge">
                                                    {service.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="price">
                                                    ${service.price || '0'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                                                    {service.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedService(service);
                                                            setShowServiceModal(true);
                                                        }}
                                                        className="btn-info"
                                                    >
                                                        View
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleServiceStatus(service._id, service.isActive)}
                                                        className={`btn-${service.isActive ? 'warning' : 'success'}`}
                                                        disabled={actionLoading}
                                                    >
                                                        {service.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedService(service);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="btn-danger"
                                                        disabled={actionLoading}
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
                        <div className="no-services">
                            <div className="empty-state">
                                <span className="empty-icon">🔧</span>
                                <h3>No Services Found</h3>
                                <p>No services match your current filters.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Service Details Modal */}
            {showServiceModal && selectedService && (
                <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Service Details</h3>
                            <button 
                                onClick={() => setShowServiceModal(false)}
                                className="close-btn"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="service-details">
                                <h4>{selectedService.title}</h4>
                                <p><strong>Description:</strong> {selectedService.description || 'No description provided'}</p>
                                <p><strong>Category:</strong> {selectedService.category || 'Uncategorized'}</p>
                                <p><strong>Price:</strong> ${selectedService.price || '0'}</p>
                                <p><strong>Provider:</strong> {selectedService.provider?.name || 'Unknown'}</p>
                                <p><strong>Provider Email:</strong> {selectedService.provider?.email || 'Unknown'}</p>
                                <p><strong>Status:</strong> {selectedService.isActive ? 'Active' : 'Inactive'}</p>
                                <p><strong>Created:</strong> {new Date(selectedService.createdAt).toLocaleString()}</p>
                                {selectedService.updatedAt && (
                                    <p><strong>Last Updated:</strong> {new Date(selectedService.updatedAt).toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedService && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete Service</h3>
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="close-btn"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="delete-confirmation">
                                <p><strong>Are you sure you want to delete this service?</strong></p>
                                <div className="service-preview">
                                    <h4>{selectedService.title}</h4>
                                    <p>Provider: {selectedService.provider?.name}</p>
                                    <p>Category: {selectedService.category}</p>
                                </div>
                                <p className="warning-text">This action cannot be undone.</p>
                            </div>
                            <div className="modal-actions">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="btn-cancel"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleDeleteService(selectedService._id)}
                                    className="btn-danger"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Deleting...' : 'Delete Service'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .manage-services {
                    min-height: 100vh;
                    background-color: #f7fafc;
                    padding-top: 80px;
                }

                .page-header {
                    background: linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #0f766e 100%);
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

                .page-subtitle {
                    margin: 0.5rem 0 0 0;
                    opacity: 0.9;
                    font-size: 1.1rem;
                }

                .header-stats {
                    display: flex;
                    gap: 2rem;
                }

                .stat-item {
                    text-align: center;
                }

                .stat-number {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: bold;
                }

                .stat-label {
                    display: block;
                    font-size: 0.8rem;
                    opacity: 0.8;
                    margin-top: 0.25rem;
                }

                .page-main {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .filters-section {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    margin-bottom: 2rem;
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .search-box {
                    flex: 1;
                    min-width: 300px;
                }

                .search-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.95rem;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #0f766e;
                }

                .filter-controls {
                    display: flex;
                    gap: 1rem;
                }

                .filter-select {
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.95rem;
                    min-width: 150px;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #0f766e;
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
                    margin: 0;
                    color: #2d3748;
                    font-size: 1.5rem;
                }

                .services-table {
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                }

                th,
                td {
                    padding: 1rem 0.75rem;
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

                .service-info {
                    max-width: 300px;
                }

                .service-title {
                    margin: 0 0 0.5rem 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #2d3748;
                }

                .service-description {
                    margin: 0;
                    font-size: 0.875rem;
                    color: #666;
                    line-height: 1.4;
                }

                .provider-info {
                    display: flex;
                    flex-direction: column;
                }

                .provider-name {
                    font-weight: 500;
                    color: #2d3748;
                }

                .provider-email {
                    font-size: 0.875rem;
                    color: #666;
                    margin-top: 0.25rem;
                }

                .category-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: #e0f2fe;
                    color: #0369a1;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .price {
                    font-weight: 600;
                    color: #0f766e;
                    font-size: 1.1rem;
                }

                .status-badge {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .status-badge.active {
                    background: #c6f6d5;
                    color: #22543d;
                }

                .status-badge.inactive {
                    background: #fed7d7;
                    color: #c53030;
                }

                .inactive-service {
                    opacity: 0.7;
                    background: #fafafa;
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
                    padding: 0.25rem 0.75rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .btn-info {
                    background: #3182ce;
                    color: white;
                }

                .btn-warning {
                    background: #ed8936;
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

                .btn-info:hover {
                    background: #2c5282;
                }

                .btn-warning:hover {
                    background: #dd6b20;
                }

                .btn-success:hover {
                    background: #2f855a;
                }

                .btn-danger:hover {
                    background: #c53030;
                }

                .btn-cancel:hover {
                    background: #718096;
                }

                .btn-info:disabled,
                .btn-warning:disabled,
                .btn-success:disabled,
                .btn-danger:disabled,
                .btn-cancel:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .no-services {
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
                    max-width: 600px;
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
                    padding: 1.5rem;
                }

                .service-details h4 {
                    margin: 0 0 1rem 0;
                    color: #2d3748;
                    font-size: 1.25rem;
                }

                .service-details p {
                    margin: 0.75rem 0;
                    line-height: 1.5;
                }

                .service-details strong {
                    color: #2d3748;
                    font-weight: 600;
                }

                .delete-confirmation {
                    text-align: center;
                }

                .service-preview {
                    background: #f7fafc;
                    padding: 1rem;
                    border-radius: 6px;
                    margin: 1rem 0;
                    border-left: 4px solid #e53e3e;
                }

                .service-preview h4 {
                    margin: 0 0 0.5rem 0;
                    color: #2d3748;
                }

                .service-preview p {
                    margin: 0.25rem 0;
                    color: #666;
                    font-size: 0.9rem;
                }

                .warning-text {
                    color: #e53e3e;
                    font-weight: 500;
                    font-size: 0.9rem;
                    margin-top: 1rem;
                }

                .modal-actions {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: flex-end;
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e2e8f0;
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

                @media (max-width: 768px) {
                    .header-content {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }

                    .header-stats {
                        gap: 1rem;
                    }

                    .page-main {
                        padding: 1rem;
                    }

                    .filters-section {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .search-box {
                        min-width: auto;
                    }

                    .filter-controls {
                        justify-content: stretch;
                    }

                    .filter-select {
                        flex: 1;
                        min-width: auto;
                    }

                    .services-table {
                        font-size: 0.875rem;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }

                    .service-info {
                        max-width: 200px;
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

export default ManageServices;
