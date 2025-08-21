import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    makeCounterOffer, 
    acceptOffer, 
    declineOffer, 
    cancelNegotiation,
    deleteNegotiation 
} from '../services/negotiationService';
import { createBookingFromNegotiation, createBooking } from '../services/bookingService'; // eslint-disable-line no-unused-vars
import useRealtimeNegotiations from '../hooks/useRealtimeNegotiations';

const NegotiationsDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedNegotiation, setSelectedNegotiation] = useState(null);
    const [counterOffer, setCounterOffer] = useState('');
    const [counterMessage, setCounterMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    
    // Booking modal state
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedBookingNegotiation, setSelectedBookingNegotiation] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingLocation, setBookingLocation] = useState('');
    const [bookingNotes, setBookingNotes] = useState('');

    // Use real-time negotiations hook
    const {
        negotiations,
        loading,
        error,
        lastUpdated,
        refreshNegotiations,
        setError
    } = useRealtimeNegotiations(activeTab, typeFilter, 5000); // Poll every 5 seconds

    const handleCounterOffer = async (negotiationId) => {
        if (!counterOffer || parseFloat(counterOffer) <= 0) {
            setError('Please enter a valid counter offer amount');
            return;
        }

        try {
            setActionLoading(true);
            await makeCounterOffer(
                negotiationId, 
                parseFloat(counterOffer), 
                counterMessage || `Counter offer of ৳${counterOffer}`
            );
            
            setCounterOffer('');
            setCounterMessage('');
            setSelectedNegotiation(null);
            refreshNegotiations(); // Use the real-time refresh function
        } catch (error) {
            setError(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptOffer = async (negotiationId) => {
        if (!window.confirm('Are you sure you want to accept this offer? This will complete the negotiation.')) {
            return;
        }

        try {
            setActionLoading(true);
            await acceptOffer(negotiationId);
            refreshNegotiations(); // Use the real-time refresh function
        } catch (error) {
            setError(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptCurrentPrice = async (negotiationId) => {
        if (!window.confirm('Are you sure you want to accept the current price? This will complete the negotiation and you can then book the service.')) {
            return;
        }

        try {
            setActionLoading(true);
            await acceptOffer(negotiationId);
            refreshNegotiations(); // Use the real-time refresh function
        } catch (error) {
            setError(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeclineOffer = async (negotiationId, reason = '') => {
        try {
            setActionLoading(true);
            await declineOffer(negotiationId, reason);
            refreshNegotiations(); // Use the real-time refresh function
        } catch (error) {
            setError(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelNegotiation = async (negotiationId, reason = '') => {
        if (!window.confirm('Are you sure you want to cancel this negotiation?')) {
            return;
        }

        try {
            setActionLoading(true);
            await cancelNegotiation(negotiationId, reason);
            refreshNegotiations(); // Use the real-time refresh function
        } catch (error) {
            setError(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteNegotiation = async (negotiationId) => {
        console.log('🗑️ Frontend delete handler called for:', negotiationId);
        if (!window.confirm('Are you sure you want to permanently delete this negotiation? This action cannot be undone.')) {
            console.log('❌ User cancelled delete operation');
            return;
        }

        try {
            setActionLoading(true);
            console.log('🚀 Calling deleteNegotiation service...');
            await deleteNegotiation(negotiationId);
            console.log('✅ Delete successful, refreshing negotiations...');
            refreshNegotiations(); // Refresh the list after deletion
        } catch (error) {
            console.error('❌ Delete failed:', error);
            setError(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBookNow = (negotiation) => {
        console.log('📝 Opening booking modal for negotiation:', negotiation._id);
        setSelectedBookingNegotiation(negotiation);
        setShowBookingModal(true);
    };

    const handleCreateBooking = async () => {
        if (!bookingDate || !bookingLocation) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setActionLoading(true);
            console.log('📝 Creating booking from negotiation:', selectedBookingNegotiation._id);
            
            const booking = await createBookingFromNegotiation(
                selectedBookingNegotiation._id,
                bookingDate,
                bookingLocation,
                bookingNotes,
                selectedBookingNegotiation.service?._id || selectedBookingNegotiation.service
            );

            console.log('✅ Booking created successfully:', booking);
            
            // Close modal and reset form
            setShowBookingModal(false);
            setSelectedBookingNegotiation(null);
            setBookingDate('');
            setBookingLocation('');
            setBookingNotes('');
            
            // Refresh negotiations to show updated status
            refreshNegotiations();
            
            alert('Booking created successfully!');
        } catch (error) {
            console.error('❌ Error creating booking:', error);
            setError(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const getLatestOffer = (negotiation) => {
        return negotiation.offers
            .filter(offer => offer.status === 'pending')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    };

    const canTakeAction = (negotiation) => {
        const latestOffer = getLatestOffer(negotiation);
        return latestOffer && latestOffer.toUser._id === (user?.id || user?._id);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!user) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning">
                    Please log in to view your negotiations.
                </div>
            </div>
        );
    }

    return (
        <div className="negotiations-dashboard">
            <div className="dashboard-header">
                <div className="header-content">
                    <div className="header-text">
                        <h1 className="page-title">
                            <span className="title-icon">🤝</span>
                            My Negotiations
                        </h1>
                        <p className="page-subtitle">Manage your service negotiations and offers</p>
                    </div>
                    <div className="header-stats">
                        <div className="stat-item">
                            <span className="stat-number">{negotiations.length}</span>
                            <span className="stat-label">Total</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{negotiations.filter(n => n.status === 'active').length}</span>
                            <span className="stat-label">Active</span>
                        </div>
                        <div className="real-time-indicator">
                            <div className="live-dot"></div>
                            <span className="live-text">Live</span>
                            <div className="last-updated">
                                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{error}</span>
                    <button className="error-close" onClick={() => setError('')}>✕</button>
                </div>
            )}

            {/* Modern Filter Tabs */}
            <div className="filters-section">
                <div className="filter-tabs">
                    <button 
                        className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <span className="tab-icon">📋</span>
                        All
                        <span className="tab-count">{negotiations.length}</span>
                    </button>
                    <button 
                        className={`filter-tab ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        <span className="tab-icon">🔥</span>
                        Active
                        <span className="tab-count">{negotiations.filter(n => n.status === 'active').length}</span>
                    </button>
                    <button 
                        className={`filter-tab ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        <span className="tab-icon">✅</span>
                        Completed
                        <span className="tab-count">{negotiations.filter(n => n.status === 'completed').length}</span>
                    </button>
                    <button 
                        className={`filter-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cancelled')}
                    >
                        <span className="tab-icon">❌</span>
                        Cancelled
                        <span className="tab-count">{negotiations.filter(n => n.status === 'cancelled').length}</span>
                    </button>
                </div>
                <div className="filter-actions">
                    <div className="filter-dropdown">
                        <select 
                            className="modern-select" 
                            value={typeFilter} 
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Negotiations</option>
                            <option value="client">Where I'm Client</option>
                            <option value="provider">Where I'm Provider</option>
                        </select>
                    </div>
                    <button 
                        className="refresh-btn"
                        onClick={() => refreshNegotiations()}
                        disabled={loading}
                        title="Refresh negotiations"
                    >
                        <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading your negotiations...</p>
                </div>
            ) : negotiations.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">💼</div>
                    <h3 className="empty-title">No negotiations yet</h3>
                    <p className="empty-description">
                        Start negotiating on services to see them here
                    </p>
                </div>
            ) : (
                <div className="negotiations-grid">
                    {negotiations.map((negotiation) => {
                        const isClient = negotiation.client._id === (user?.id || user?._id);
                        const latestOffer = getLatestOffer(negotiation);
                        const canAct = canTakeAction(negotiation);

                        return (
                            <div key={negotiation._id} className={`negotiation-card ${negotiation.status}`}>
                                <div className="card-header">
                                    <div className="service-info">
                                        <h3 className="service-title">{negotiation.service.title}</h3>
                                        <div className="role-badge">
                                            {isClient ? '🛒 Client' : '🔧 Provider'}
                                        </div>
                                    </div>
                                    <div className={`status-badge ${negotiation.status}`}>
                                        {negotiation.status === 'active' && '🔥'}
                                        {negotiation.status === 'completed' && '✅'}
                                        {negotiation.status === 'cancelled' && '❌'}
                                        {negotiation.status === 'expired' && '⏰'}
                                        {negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="participant-info">
                                        <div className="participant">
                                            <span className="participant-label">
                                                {isClient ? 'Provider:' : 'Client:'}
                                            </span>
                                            <span className="participant-name">
                                                {isClient ? negotiation.provider.name : negotiation.client.name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="price-section">
                                        <div className="price-grid">
                                            <div className="price-item">
                                                <span className="price-label">Base Price</span>
                                                <span className="price-value base">৳{negotiation.basePrice}</span>
                                            </div>
                                            <div className="price-item">
                                                <span className="price-label">Current Offer</span>
                                                <span className="price-value current">৳{negotiation.currentOffer}</span>
                                            </div>
                                            {negotiation.finalPrice && (
                                                <div className="price-item">
                                                    <span className="price-label">Final Price</span>
                                                    <span className="price-value final">৳{negotiation.finalPrice}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {latestOffer && (
                                        <div className="latest-offer">
                                            <div className="offer-header">
                                                <span className="offer-label">Latest Offer</span>
                                                <span className="offer-time">{formatDate(latestOffer.timestamp)}</span>
                                            </div>
                                            <div className="offer-content">
                                                <div className="offer-price">৳{latestOffer.offeredPrice}</div>
                                                <div className="offer-from">by {latestOffer.fromUser.name}</div>
                                                {latestOffer.message && (
                                                    <div className="offer-message">"{latestOffer.message}"</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="card-footer">
                                        <div className="created-date">
                                            <span className="date-icon">📅</span>
                                            Created {formatDate(negotiation.createdAt)}
                                        </div>

                                        {negotiation.status === 'active' && (
                                            <div className="actions-section">
                                                {canAct && latestOffer ? (
                                                    <div className="action-buttons primary">
                                                        <button 
                                                            className="action-btn accept"
                                                            onClick={() => handleAcceptOffer(negotiation._id)}
                                                            disabled={actionLoading}
                                                        >
                                                            <span className="btn-icon">✅</span>
                                                            Accept
                                                        </button>
                                                        <button 
                                                            className="action-btn counter"
                                                            onClick={() => setSelectedNegotiation(negotiation._id)}
                                                            disabled={actionLoading}
                                                        >
                                                            <span className="btn-icon">💬</span>
                                                            Counter
                                                        </button>
                                                        <button 
                                                            className="action-btn decline"
                                                            onClick={() => handleDeclineOffer(negotiation._id)}
                                                            disabled={actionLoading}
                                                        >
                                                            <span className="btn-icon">❌</span>
                                                            Decline
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="action-buttons secondary">
                                                        <button 
                                                            className="action-btn make-offer"
                                                            onClick={() => setSelectedNegotiation(negotiation._id)}
                                                            disabled={actionLoading}
                                                        >
                                                            <span className="btn-icon">💰</span>
                                                            Make Offer
                                                        </button>
                                                        
                                                        {/* Accept current price button for clients */}
                                                        {negotiation.client && 
                                                         (negotiation.client._id === (user?.id || user?._id) || negotiation.client === (user?.id || user?._id)) && 
                                                         negotiation.basePrice && (
                                                            <button 
                                                                className="action-btn accept-price"
                                                                onClick={() => handleAcceptCurrentPrice(negotiation._id)}
                                                                disabled={actionLoading}
                                                                title="Accept the current price and complete negotiation"
                                                            >
                                                                <span className="btn-icon">💯</span>
                                                                Accept ৳{negotiation.currentOffer || negotiation.basePrice}
                                                            </button>
                                                        )}
                                                        
                                                        <button 
                                                            className="action-btn cancel"
                                                            onClick={() => handleCancelNegotiation(negotiation._id)}
                                                            disabled={actionLoading}
                                                        >
                                                            <span className="btn-icon">🚫</span>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {/* Show waiting message for offer sender */}
                                                {latestOffer && latestOffer.fromUser._id === (user?.id || user?._id) && (
                                                    <div className="waiting-info">
                                                        <div className="waiting-badge">
                                                            <span className="waiting-icon">⏳</span>
                                                            <span className="waiting-text">
                                                                Waiting for {latestOffer.toUser.name} to respond to your ৳{latestOffer.offeredPrice} offer
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions for completed negotiations */}
                                        {negotiation.status === 'completed' && (
                                            <div className="actions-section">
                                                <div className="completion-info">
                                                    <div className="completion-badge">
                                                        <span className="completion-icon">🎉</span>
                                                        <span className="completion-text">
                                                            Negotiation completed! Final price: ৳{negotiation.finalPrice || negotiation.currentOffer}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Debug info - remove after testing */}
                                                    <div style={{
                                                        fontSize: '14px', 
                                                        color: '#000', 
                                                        backgroundColor: '#ffeb3b', 
                                                        padding: '10px', 
                                                        margin: '10px 0',
                                                        borderRadius: '5px',
                                                        border: '2px solid #f57c00'
                                                    }}>
                                                        <strong>DEBUG INFO:</strong><br/>
                                                        User ID: {user?.id}<br/>
                                                        User _ID: {user?._id}<br/>
                                                        User Role: {user?.role}<br/>
                                                        User Name: {user?.name}<br/>
                                                        Client ID: {negotiation.client?._id || negotiation.client}<br/>
                                                        Client Name: {negotiation.client?.name || 'Unknown'}<br/>
                                                        Provider ID: {negotiation.provider?._id || negotiation.provider}<br/>
                                                        Type Filter: {typeFilter}<br/>
                                                        Status: {negotiation.status}
                                                    </div>
                                                    
                                                    {/* Show Book Now for clients ONLY - Fixed condition */}
                                                    {((negotiation.client && negotiation.client._id === (user?.id || user?._id)) ||
                                                      (negotiation.client === (user?.id || user?._id)) ||
                                                      (typeof negotiation.client === 'string' && negotiation.client === (user?.id || user?._id))) && (
                                                        <div className="action-buttons primary" style={{marginTop: '1rem'}}>
                                                            <button 
                                                                className="action-btn book-now"
                                                                onClick={() => handleBookNow(negotiation)}
                                                                disabled={actionLoading}
                                                                title="Create booking with agreed price"
                                                                style={{fontSize: '16px', padding: '12px 20px'}}
                                                            >
                                                                <span className="btn-icon">📅</span>
                                                                Book Now - ৳{negotiation.finalPrice || negotiation.currentOffer}
                                                            </button>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Show info for providers */}
                                                    {(negotiation.provider && 
                                                      (negotiation.provider._id === (user?.id || user?._id) || negotiation.provider === (user?.id || user?._id))) && (
                                                        <div className="provider-info">
                                                            <p className="info-text">
                                                                🔔 Waiting for client to book this service at the agreed price.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Delete option for completed, cancelled, or rejected negotiations */}
                                        {(negotiation.status === 'completed' || 
                                          negotiation.status === 'cancelled' || 
                                          negotiation.status === 'rejected') && (
                                            <div className="actions-section">
                                                <div className="action-buttons cleanup">
                                                    {/* Show Book Now button for completed negotiations where user is client */}
                                                    {negotiation.status === 'completed' && 
                                                     negotiation.client && 
                                                     negotiation.client._id === (user?.id || user?._id) && (
                                                        <button 
                                                            className="action-btn book-now"
                                                            onClick={() => handleBookNow(negotiation)}
                                                            disabled={actionLoading}
                                                            title="Create booking with agreed price"
                                                        >
                                                            <span className="btn-icon">📅</span>
                                                            Book Now
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="action-btn delete"
                                                        onClick={() => handleDeleteNegotiation(negotiation._id)}
                                                        disabled={actionLoading}
                                                        title="Permanently delete this negotiation"
                                                    >
                                                        <span className="btn-icon">🗑️</span>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modern Counter Offer Modal */}
            {selectedNegotiation && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="modal-icon">💰</span>
                                Make Counter Offer
                            </h3>
                            <button 
                                className="modal-close"
                                onClick={() => setSelectedNegotiation(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">💵</span>
                                    Counter Offer Amount
                                </label>
                                <div className="input-wrapper">
                                    <span className="input-prefix">$</span>
                                    <input
                                        type="number"
                                        className="modern-input"
                                        value={counterOffer}
                                        onChange={(e) => setCounterOffer(e.target.value)}
                                        placeholder="Enter amount"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">💬</span>
                                    Message (Optional)
                                </label>
                                <textarea
                                    className="modern-textarea"
                                    rows="3"
                                    value={counterMessage}
                                    onChange={(e) => setCounterMessage(e.target.value)}
                                    placeholder="Explain your counter offer..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary" 
                                onClick={() => setSelectedNegotiation(null)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={() => handleCounterOffer(selectedNegotiation)}
                                disabled={actionLoading || !counterOffer}
                            >
                                {actionLoading ? (
                                    <>
                                        <div className="btn-spinner"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <span className="btn-icon">📤</span>
                                        Send Counter Offer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && selectedBookingNegotiation && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="modal-icon">📅</span>
                                Book Service
                            </h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowBookingModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="booking-summary">
                                <h4>{selectedBookingNegotiation.service?.title}</h4>
                                <p><strong>Final Price:</strong> ৳{selectedBookingNegotiation.finalPrice || selectedBookingNegotiation.currentOffer}</p>
                                <p><strong>Provider:</strong> {selectedBookingNegotiation.provider?.name}</p>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📅</span>
                                    Preferred Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📍</span>
                                    Service Location
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={bookingLocation}
                                    onChange={(e) => setBookingLocation(e.target.value)}
                                    placeholder="Enter the address where service is needed..."
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📝</span>
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    className="form-textarea"
                                    value={bookingNotes}
                                    onChange={(e) => setBookingNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Any special instructions or requirements..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary" 
                                onClick={() => setShowBookingModal(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-primary book-confirm"
                                onClick={handleCreateBooking}
                                disabled={actionLoading || !bookingDate || !bookingLocation}
                            >
                                {actionLoading ? (
                                    <>
                                        <div className="btn-spinner"></div>
                                        Creating Booking...
                                    </>
                                ) : (
                                    <>
                                        <span className="btn-icon">✅</span>
                                        Confirm Booking
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .negotiations-dashboard {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                }

                .dashboard-header {
                    background: white;
                    border-radius: 16px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 2rem;
                }

                .header-text {
                    flex: 1;
                }

                .page-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #2d3748;
                    margin: 0 0 0.5rem 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .title-icon {
                    font-size: 2rem;
                }

                .page-subtitle {
                    color: #718096;
                    font-size: 1.1rem;
                    margin: 0;
                }

                .header-stats {
                    display: flex;
                    gap: 2rem;
                    align-items: center;
                }

                .stat-item {
                    text-align: center;
                    padding: 1rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px;
                    min-width: 100px;
                }

                .stat-number {
                    display: block;
                    font-size: 2rem;
                    font-weight: 700;
                }

                .stat-label {
                    display: block;
                    font-size: 0.9rem;
                    opacity: 0.9;
                }

                .real-time-indicator {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.5rem 1rem;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }

                .live-dot {
                    width: 8px;
                    height: 8px;
                    background: #48bb78;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                .live-text {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: white;
                }

                .last-updated {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.8);
                }

                @keyframes pulse {
                    0% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7);
                    }
                    
                    70% {
                        transform: scale(1);
                        box-shadow: 0 0 0 10px rgba(72, 187, 120, 0);
                    }
                    
                    100% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(72, 187, 120, 0);
                    }
                }

                .error-banner {
                    background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
                    color: #9b2c2c;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .error-icon {
                    font-size: 1.2rem;
                }

                .error-text {
                    flex: 1;
                }

                .error-close {
                    background: none;
                    border: none;
                    color: #9b2c2c;
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 0.25rem;
                    border-radius: 6px;
                }

                .error-close:hover {
                    background: rgba(155, 44, 44, 0.1);
                }

                .filters-section {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .filter-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .filter-tabs {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .filter-tab {
                    background: #f7fafc;
                    border: 2px solid transparent;
                    border-radius: 12px;
                    padding: 0.75rem 1.25rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    color: #4a5568;
                }

                .filter-tab:hover {
                    background: #edf2f7;
                    transform: translateY(-1px);
                }

                .filter-tab.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-color: #667eea;
                }

                .tab-icon {
                    font-size: 1rem;
                }

                .tab-count {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    padding: 0.25rem 0.5rem;
                    font-size: 0.8rem;
                    min-width: 24px;
                    text-align: center;
                }

                .filter-tab.active .tab-count {
                    background: rgba(255, 255, 255, 0.3);
                }

                .modern-select {
                    padding: 0.75rem 1rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    font-size: 1rem;
                    color: #4a5568;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .modern-select:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .refresh-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 12px;
                    padding: 0.75rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    color: white;
                    min-width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .refresh-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .refresh-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .refresh-icon {
                    font-size: 1.2rem;
                    transition: transform 0.3s ease;
                }

                .refresh-icon.spinning {
                    animation: spin 1s linear infinite;
                }

                .loading-container {
                    text-align: center;
                    padding: 4rem 2rem;
                }

                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }

                .loading-text {
                    color: #718096;
                    font-size: 1.1rem;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .empty-title {
                    color: #2d3748;
                    margin-bottom: 0.5rem;
                }

                .empty-description {
                    color: #718096;
                    font-size: 1.1rem;
                }

                .negotiations-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 2rem;
                }

                .negotiation-card {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    border: 2px solid transparent;
                    transition: all 0.3s ease;
                }

                .negotiation-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                }

                .negotiation-card.active {
                    border-color: #48bb78;
                }

                .negotiation-card.completed {
                    border-color: #38b2ac;
                }

                .negotiation-card.cancelled {
                    border-color: #e53e3e;
                }

                .card-header {
                    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                    padding: 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .service-info {
                    flex: 1;
                }

                .service-title {
                    font-size: 1.3rem;
                    font-weight: 600;
                    color: #2d3748;
                    margin: 0 0 0.5rem 0;
                }

                .role-badge {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .status-badge {
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .status-badge.active {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: white;
                }

                .status-badge.completed {
                    background: linear-gradient(135deg, #38b2ac 0%, #319795 100%);
                    color: white;
                }

                .status-badge.cancelled {
                    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
                    color: white;
                }

                .status-badge.expired {
                    background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
                    color: white;
                }

                .card-body {
                    padding: 1.5rem;
                }

                .participant-info {
                    margin-bottom: 1.5rem;
                }

                .participant {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f7fafc;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                }

                .participant-label {
                    color: #718096;
                    font-size: 0.9rem;
                }

                .participant-name {
                    font-weight: 600;
                    color: #2d3748;
                }

                .price-section {
                    margin-bottom: 1.5rem;
                }

                .price-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 1rem;
                }

                .price-item {
                    text-align: center;
                    padding: 1rem;
                    border-radius: 12px;
                    background: #f7fafc;
                }

                .price-label {
                    display: block;
                    font-size: 0.8rem;
                    color: #718096;
                    margin-bottom: 0.25rem;
                }

                .price-value {
                    display: block;
                    font-size: 1.3rem;
                    font-weight: 700;
                }

                .price-value.base {
                    color: #718096;
                }

                .price-value.current {
                    color: #667eea;
                }

                .price-value.final {
                    color: #48bb78;
                }

                .latest-offer {
                    background: linear-gradient(135deg, #e6fffa 0%, #c6f6d5 100%);
                    border-left: 4px solid #48bb78;
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                }

                .offer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .offer-label {
                    font-weight: 600;
                    color: #2d3748;
                    font-size: 0.9rem;
                }

                .offer-time {
                    font-size: 0.8rem;
                    color: #718096;
                }

                .offer-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .offer-price {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #48bb78;
                }

                .offer-from {
                    font-size: 0.9rem;
                    color: #718096;
                }

                .offer-message {
                    font-style: italic;
                    color: #4a5568;
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 8px;
                }

                .card-footer {
                    border-top: 1px solid #e2e8f0;
                    padding: 1.5rem;
                    background: #f7fafc;
                }

                .created-date {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #718096;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }

                .date-icon {
                    font-size: 1rem;
                }

                .actions-section {
                    display: flex;
                    justify-content: center;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .action-btn {
                    padding: 0.75rem 1.25rem;
                    border: none;
                    border-radius: 10px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }

                .action-btn:hover {
                    transform: translateY(-1px);
                }

                .action-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .action-btn.accept {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: white;
                }

                .action-btn.counter {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .action-btn.decline {
                    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
                    color: white;
                }

                .action-btn.make-offer {
                    background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
                    color: white;
                }

                .action-btn.cancel {
                    background: #e2e8f0;
                    color: #718096;
                }

                .action-btn.accept-price {
                    background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%);
                    color: white;
                    font-weight: 600;
                }

                .action-btn.accept-price:hover {
                    background: linear-gradient(135deg, #805ad5 0%, #6b46c1 100%);
                    transform: translateY(-1px);
                }

                .action-btn.delete {
                    background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
                    color: white;
                    border: 1px solid #a0aec0;
                }

                .action-btn.delete:hover {
                    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
                    transform: translateY(-1px);
                }

                .action-btn.book-now {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: white;
                    margin-right: 10px;
                }

                .action-btn.book-now:hover {
                    background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
                    transform: translateY(-1px);
                }

                .action-buttons.cleanup {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #e2e8f0;
                }

                .btn-icon {
                    font-size: 1rem;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }

                .modal-container {
                    background: white;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                }

                .modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-title {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .modal-icon {
                    font-size: 1.2rem;
                }

                .modal-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    transition: background 0.3s ease;
                }

                .modal-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .modal-body {
                    padding: 2rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #2d3748;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .label-icon {
                    font-size: 1rem;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-prefix {
                    position: absolute;
                    left: 1rem;
                    color: #718096;
                    font-weight: 600;
                    z-index: 1;
                }

                .modern-input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .modern-input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .modern-textarea {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-family: inherit;
                    resize: vertical;
                    min-height: 80px;
                    transition: all 0.3s ease;
                }

                .modern-textarea:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .modal-footer {
                    background: #f7fafc;
                    padding: 1.5rem 2rem;
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }

                .btn-secondary {
                    padding: 0.75rem 1.5rem;
                    background: #e2e8f0;
                    color: #4a5568;
                    border: none;
                    border-radius: 10px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-secondary:hover {
                    background: #cbd5e0;
                    transform: translateY(-1px);
                }

                .btn-primary {
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .btn-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                /* Booking Modal Styles */
                .booking-summary {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                }

                .booking-summary h4 {
                    margin: 0 0 0.5rem 0;
                    color: #2d3748;
                    font-size: 1.1rem;
                }

                .booking-summary p {
                    margin: 0.25rem 0;
                    color: #4a5568;
                    font-size: 0.9rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #2d3748;
                    font-size: 0.9rem;
                }

                .label-icon {
                    font-size: 1rem;
                }

                .form-input, .form-textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    background: white;
                    box-sizing: border-box;
                }

                .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .btn-primary.book-confirm {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                }

                .btn-primary.book-confirm:hover {
                    background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
                }

                /* Completion info styles */
                .completion-info {
                    background: #f0fff4;
                    border: 2px solid #38a169;
                    border-radius: 12px;
                    padding: 1rem;
                    margin-top: 1rem;
                }

                .completion-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .completion-icon {
                    font-size: 1.2rem;
                }

                .completion-text {
                    font-weight: 600;
                    color: #2f855a;
                    font-size: 1rem;
                }

                .provider-info {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: #e6fffa;
                    border-radius: 8px;
                    border-left: 4px solid #38b2ac;
                }

                .info-text {
                    margin: 0;
                    color: #2c7a7b;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                /* Waiting info styles */
                .waiting-info {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: #fef5e7;
                    border-radius: 8px;
                    border-left: 4px solid #ed8936;
                }

                .waiting-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .waiting-icon {
                    font-size: 1rem;
                }

                .waiting-text {
                    color: #c05621;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .negotiations-dashboard {
                        padding: 1rem;
                    }
                    
                    .header-content {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .header-stats {
                        justify-content: center;
                    }
                    
                    .filters-section {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .filter-tabs {
                        justify-content: center;
                    }
                    
                    .negotiations-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .price-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .action-buttons {
                        justify-content: center;
                    }
                    
                    .modal-container {
                        width: 95%;
                        margin: 1rem;
                    }
                    
                    .modal-footer {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default NegotiationsDashboard;
