import React, { useState, useEffect } from 'react';
import { deleteNegotiation } from '../services/negotiationService';

const MyServices = () => {
    const [services, setServices] = useState([]);
    const [negotiations, setNegotiations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingService, setEditingService] = useState(null);

    useEffect(() => {
        fetchMyServices();
        fetchNegotiations();
    }, []);

    // Real-time polling for negotiations
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNegotiations(); // Background refresh without loading indicator
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchMyServices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/services/all-my-services', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setServices(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNegotiations = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Fetching negotiations...');
            // Get all negotiations for provider (active and completed/cancelled)
            const response = await fetch('http://localhost:5000/api/negotiations?type=provider', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Negotiations response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Negotiations data:', data);
                setNegotiations(data.negotiations || []);
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
            }
        } catch (error) {
            console.error('Error fetching negotiations:', error);
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
                setServices(prevServices => 
                    prevServices.map(service => 
                        service._id === serviceId 
                            ? { ...service, availability: data.data.availability }
                            : service
                    )
                );
                alert(data.message);
            } else {
                const errorData = await response.json();
                alert('Error toggling availability: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error toggling service availability:', error);
            alert('Error toggling service availability');
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!window.confirm('Are you sure you want to delete this service?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setServices(prevServices => prevServices.filter(service => service._id !== serviceId));
                alert('Service deleted successfully');
            } else {
                const errorData = await response.json();
                alert('Error deleting service: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('Error deleting service');
        }
    };

    const startEdit = (service) => {
        setEditingService({
            ...service,
            originalId: service._id
        });
    };

    const saveEdit = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/services/${editingService.originalId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: editingService.title,
                    description: editingService.description,
                    category: editingService.category,
                    startingPrice: editingService.startingPrice,
                    address: editingService.address
                })
            });

            if (response.ok) {
                const data = await response.json();
                setServices(prevServices => 
                    prevServices.map(service => 
                        service._id === editingService.originalId 
                            ? data.data
                            : service
                    )
                );
                setEditingService(null);
                alert('Service updated successfully');
            } else {
                const errorData = await response.json();
                alert('Error updating service: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error updating service:', error);
            alert('Error updating service');
        }
    };

    // Handle negotiation actions
    const handleAcceptOffer = async (negotiationId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/negotiations/${negotiationId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('Offer accepted successfully!');
                fetchNegotiations(); // Refresh negotiations
            } else {
                const data = await response.json();
                alert(data.message || 'Error accepting offer');
            }
        } catch (error) {
            console.error('Error accepting offer:', error);
            alert('Error accepting offer');
        }
    };

    const handleCounterOffer = async (negotiationId) => {
        const counterAmount = prompt('Enter your counter offer amount:');
        if (!counterAmount || isNaN(counterAmount)) {
            alert('Please enter a valid amount');
            return;
        }

        const message = prompt('Add a message (optional):') || '';

        try {
            const response = await fetch(`http://localhost:5000/api/negotiations/${negotiationId}/counter-offer`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    counterOffer: parseFloat(counterAmount),
                    message: message
                })
            });

            if (response.ok) {
                alert('Counter offer sent successfully!');
                fetchNegotiations(); // Refresh negotiations
            } else {
                const data = await response.json();
                alert(data.message || 'Error sending counter offer');
            }
        } catch (error) {
            console.error('Error sending counter offer:', error);
            alert('Error sending counter offer');
        }
    };

    const handleDeclineOffer = async (negotiationId) => {
        const reason = prompt('Reason for declining (optional):') || '';

        if (window.confirm('Are you sure you want to decline this offer?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/negotiations/${negotiationId}/decline`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        reason: reason
                    })
                });

                if (response.ok) {
                    alert('Offer declined');
                    fetchNegotiations(); // Refresh negotiations
                } else {
                    const data = await response.json();
                    alert(data.message || 'Error declining offer');
                }
            } catch (error) {
                console.error('Error declining offer:', error);
                alert('Error declining offer');
            }
        }
    };

    const handleDeleteNegotiation = async (negotiationId) => {
        if (!window.confirm('Are you sure you want to permanently delete this negotiation? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteNegotiation(negotiationId);
            alert('Negotiation deleted successfully');
            fetchNegotiations(); // Refresh negotiations
        } catch (error) {
            console.error('Error deleting negotiation:', error);
            alert('Error deleting negotiation: ' + error.message);
        }
    };

    if (loading) {
        return <div className="loading">Loading your services...</div>;
    }

    return (
        <div className="my-services page-container">
            <header className="page-header">
                <h1>My Services</h1>
                <p>Manage your services and view active negotiations</p>
            </header>

            <main className="page-content">
                {/* Services Management Section */}
                <section className="services-management">
                    <div className="section-header">
                        <h2>Your Services</h2>
                        <p>Total: {services.length} | Active: {services.filter(s => s.availability).length}</p>
                    </div>

                    <div className="services-grid">
                        {services.length > 0 ? (
                            services.map(service => (
                                <div 
                                    key={service._id} 
                                    className={`service-card ${service.availability ? 'active' : 'inactive'}`}
                                >
                                    {editingService && editingService.originalId === service._id ? (
                                        // Edit Mode
                                        <div className="edit-form">
                                            <input
                                                type="text"
                                                value={editingService.title}
                                                onChange={(e) => setEditingService({...editingService, title: e.target.value})}
                                                placeholder="Service Title"
                                            />
                                            <textarea
                                                value={editingService.description}
                                                onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                                                placeholder="Description"
                                                rows="3"
                                            />
                                            <select
                                                value={editingService.category}
                                                onChange={(e) => setEditingService({...editingService, category: e.target.value})}
                                            >
                                                <option value="cleaning">Cleaning</option>
                                                <option value="plumbing">Plumbing</option>
                                                <option value="electrical">Electrical</option>
                                                <option value="painting">Painting</option>
                                                <option value="gardening">Gardening</option>
                                                <option value="moving">Moving</option>
                                                <option value="handyman">Handyman</option>
                                                <option value="automotive">Automotive</option>
                                                <option value="tutoring">Tutoring</option>
                                                <option value="fitness">Fitness</option>
                                                <option value="beauty">Beauty & Wellness</option>
                                                <option value="pet-care">Pet Care</option>
                                                <option value="appliance-repair">Appliance Repair</option>
                                                <option value="carpentry">Carpentry</option>
                                                <option value="roofing">Roofing</option>
                                                <option value="others">Others</option>
                                            </select>
                                            <input
                                                type="number"
                                                value={editingService.startingPrice}
                                                onChange={(e) => setEditingService({...editingService, startingPrice: e.target.value})}
                                                placeholder="Starting Price"
                                            />
                                            <input
                                                type="text"
                                                value={editingService.address}
                                                onChange={(e) => setEditingService({...editingService, address: e.target.value})}
                                                placeholder="Service Location"
                                            />
                                            <div className="edit-actions">
                                                <button onClick={saveEdit} className="save-btn">Save</button>
                                                <button onClick={() => setEditingService(null)} className="cancel-btn">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <div className="service-content">
                                            <div className="service-header">
                                                <h3>{service.title}</h3>
                                                <div className={`status-badge ${service.availability ? 'active' : 'inactive'}`}>
                                                    {service.availability ? 'ACTIVE' : 'INACTIVE'}
                                                </div>
                                            </div>
                                            
                                            <p className="description">{service.description}</p>
                                            
                                            <div className="service-details">
                                                <p><strong>Category:</strong> {service.category}</p>
                                                <p><strong>Starting Price:</strong> ৳{service.startingPrice}</p>
                                                <p><strong>Price Range:</strong> ৳{service.minPrice} - ৳{service.maxPrice}</p>
                                                <p><strong>Location:</strong> {service.address}</p>
                                            </div>
                                            
                                            <div className="service-actions">
                                                <button 
                                                    onClick={() => startEdit(service)}
                                                    className="edit-btn"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleAvailability(service._id, service.availability)}
                                                    className={`toggle-btn ${service.availability ? 'deactivate' : 'activate'}`}
                                                >
                                                    {service.availability ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteService(service._id)}
                                                    className="delete-btn"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="no-services">
                                <p>You haven't created any services yet.</p>
                                <a href="/provider-dashboard" className="add-service-link">Add your first service</a>
                            </div>
                        )}
                    </div>
                </section>

                {/* Active Negotiations Section */}
                <section className="negotiations-section">
                    <div className="section-header">
                        <h2>Negotiations</h2>
                        <p>All bargaining requests from customers</p>
                    </div>

                    <div className="negotiations-list">
                        {negotiations.length > 0 ? (
                            negotiations.map(negotiation => (
                                <div key={negotiation._id} className="negotiation-card">
                                    <div className="negotiation-header">
                                        <h4>{negotiation.service?.title}</h4>
                                        <span className="negotiation-status">{negotiation.status}</span>
                                    </div>
                                    <div className="negotiation-details">
                                        <p><strong>Customer:</strong> {negotiation.client?.name}</p>
                                        <p><strong>Base Price:</strong> ৳{negotiation.basePrice}</p>
                                        <p><strong>Current Offer:</strong> ৳{negotiation.currentOffer}</p>
                                        <p><strong>Service:</strong> {negotiation.service?.title}</p>
                                        {negotiation.notes && <p><strong>Notes:</strong> {negotiation.notes}</p>}
                                        <p><strong>Created:</strong> {new Date(negotiation.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="negotiation-actions">
                                        {negotiation.status === 'active' || negotiation.status === 'pending' ? (
                                            <>
                                                <button 
                                                    className="accept-btn"
                                                    onClick={() => handleAcceptOffer(negotiation._id)}
                                                >
                                                    Accept Offer
                                                </button>
                                                <button 
                                                    className="counter-btn"
                                                    onClick={() => handleCounterOffer(negotiation._id)}
                                                >
                                                    Counter Offer
                                                </button>
                                                <button 
                                                    className="reject-btn"
                                                    onClick={() => handleDeclineOffer(negotiation._id)}
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        ) : (negotiation.status === 'completed' || 
                                              negotiation.status === 'cancelled' || 
                                              negotiation.status === 'rejected') && (
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteNegotiation(negotiation._id)}
                                                title="Delete this negotiation"
                                            >
                                                🗑️ Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-negotiations">
                                <p>No negotiations at the moment.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <style jsx>{`
                .my-services {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .page-header {
                    margin-bottom: 2rem;
                    text-align: center;
                }

                .page-header h1 {
                    color: #2d3748;
                    margin-bottom: 0.5rem;
                }

                .section-header {
                    margin-bottom: 1.5rem;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 1rem;
                }

                .section-header h2 {
                    color: #2d3748;
                    margin-bottom: 0.5rem;
                }

                .services-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }

                .service-card {
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 1.5rem;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                }

                .service-card.active {
                    border-color: #48bb78;
                    background: #f0fff4;
                }

                .service-card.inactive {
                    border-color: #f56565;
                    background: #fffafa;
                    opacity: 0.8;
                }

                .service-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .service-header h3 {
                    margin: 0;
                    color: #2d3748;
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: bold;
                }

                .status-badge.active {
                    background: #48bb78;
                    color: white;
                }

                .status-badge.inactive {
                    background: #f56565;
                    color: white;
                }

                .description {
                    color: #4a5568;
                    margin-bottom: 1rem;
                }

                .service-details p {
                    margin: 0.5rem 0;
                    color: #2d3748;
                }

                .service-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    flex-wrap: wrap;
                }

                .edit-btn {
                    background: #3182ce;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .toggle-btn {
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .toggle-btn.activate {
                    background: #48bb78;
                    color: white;
                }

                .toggle-btn.deactivate {
                    background: #f56565;
                    color: white;
                }

                .delete-btn {
                    background: #e53e3e;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .edit-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .edit-form input,
                .edit-form select,
                .edit-form textarea {
                    padding: 0.75rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 1rem;
                }

                .edit-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .save-btn {
                    background: #48bb78;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .cancel-btn {
                    background: #a0aec0;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .negotiations-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .negotiation-card {
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 1.5rem;
                    background: white;
                }

                .negotiation-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }

                .negotiation-details p {
                    margin: 0.5rem 0;
                }

                .negotiation-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                .accept-btn {
                    background: #48bb78;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .counter-btn {
                    background: #ed8936;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .reject-btn {
                    background: #e53e3e;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .delete-btn {
                    background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
                    color: white;
                    border: 1px solid #a0aec0;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .delete-btn:hover {
                    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
                    transform: translateY(-1px);
                }

                .no-services,
                .no-negotiations {
                    text-align: center;
                    padding: 2rem;
                    color: #4a5568;
                }

                .add-service-link {
                    color: #3182ce;
                    text-decoration: none;
                    font-weight: bold;
                }

                .loading {
                    text-align: center;
                    padding: 2rem;
                    font-size: 1.2rem;
                    color: #4a5568;
                }
            `}</style>
        </div>
    );
}

export default MyServices;
