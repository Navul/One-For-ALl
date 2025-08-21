import React, { useState, useEffect } from 'react';
import { startNegotiation } from '../services/negotiationService';

const BargainSystem = ({ service, currentUser, onNegotiationUpdate }) => {
    const [showBargainForm, setShowBargainForm] = useState(false);
    const [initialOffer, setInitialOffer] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Price limits configuration (30% range)
    const priceLimit = 0.3; // 30%
    const minPrice = Math.max(service.price * (1 - priceLimit), service.price * 0.5); // Minimum 50% of original
    const maxPrice = service.price * (1 + priceLimit);

    // Reset form when service changes
    useEffect(() => {
        setInitialOffer('');
        setMessage('');
        setError('');
        setSuccess('');
        setShowBargainForm(false);
    }, [service]);

    const handleStartNegotiation = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            setError('Please log in to start bargaining');
            return;
        }

        if (!initialOffer || parseFloat(initialOffer) <= 0) {
            setError('Please enter a valid offer amount');
            return;
        }

        const offerAmount = parseFloat(initialOffer);
        
        // Validate price limits
        if (offerAmount < minPrice) {
            setError(`Offer too low. Minimum allowed: $${minPrice.toFixed(2)}`);
            return;
        }
        
        if (offerAmount > maxPrice) {
            setError(`Offer too high. Maximum allowed: $${maxPrice.toFixed(2)}`);
            return;
        }

        if (offerAmount === service.price) {
            setError('Your offer should be different from the base price');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const result = await startNegotiation(
                service._id,
                offerAmount,
                message || `I would like to negotiate the price to $${offerAmount}`,
                null, // location can be added later
                null, // scheduledDate can be added later
                null  // notes can be added later
            );

            setSuccess('Negotiation started successfully! The provider will be notified.');
            setShowBargainForm(false);
            setInitialOffer('');
            setMessage('');
            
            if (onNegotiationUpdate) {
                onNegotiationUpdate(result.negotiation);
            }
        } catch (error) {
            setError(error.message || 'Failed to start negotiation');
        } finally {
            setLoading(false);
        }
    };

    const calculateSavings = () => {
        if (!initialOffer) return null;
        const offer = parseFloat(initialOffer);
        const savings = service.price - offer;
        const percentage = ((savings / service.price) * 100).toFixed(1);
        
        if (savings > 0) {
            return { savings, percentage, type: 'save' };
        } else {
            return { savings: Math.abs(savings), percentage: Math.abs(percentage), type: 'extra' };
        }
    };

    const savings = calculateSavings();

    return (
        <div className="bargain-system">
            {error && (
                <div className="alert alert-danger mb-3">
                    {error}
                    <button 
                        className="btn-close float-end" 
                        onClick={() => setError('')}
                        style={{ background: 'none', border: 'none', color: 'white' }}
                    >
                        ×
                    </button>
                </div>
            )}
            
            {success && (
                <div className="alert alert-success mb-3">
                    {success}
                    <button 
                        className="btn-close float-end" 
                        onClick={() => setSuccess('')}
                        style={{ background: 'none', border: 'none', color: 'white' }}
                    >
                        ×
                    </button>
                </div>
            )}

            {!showBargainForm ? (
                <div className="bargain-intro">
                    <div className="price-info mb-3">
                        <h5>Service Price: <span className="text-primary">${service.price}</span></h5>
                        <p className="text-muted">
                            Want a better deal? Start bargaining with the provider!
                        </p>
                    </div>
                    
                    <button 
                        className="btn btn-warning btn-lg"
                        onClick={() => setShowBargainForm(true)}
                        disabled={!currentUser}
                    >
                        <i className="fas fa-handshake me-2"></i>
                        Start Bargaining
                    </button>
                    
                    {!currentUser && (
                        <p className="text-muted mt-2">
                            <small>Please log in to start bargaining</small>
                        </p>
                    )}
                </div>
            ) : (
                <div className="bargain-form">
                    <div className="card">
                        <div className="card-header bg-warning">
                            <h5 className="mb-0">
                                <i className="fas fa-handshake me-2"></i>
                                Start Your Bargain
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleStartNegotiation}>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Base Price: <strong>${service.price}</strong>
                                    </label>
                                    <div className="price-limits text-muted small">
                                        Price Range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} 
                                        <span className="badge bg-info ms-2">±30% limit</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="initialOffer" className="form-label">
                                        Your Offer Amount *
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">$</span>
                                        <input
                                            type="number"
                                            id="initialOffer"
                                            className="form-control"
                                            value={initialOffer}
                                            onChange={(e) => setInitialOffer(e.target.value)}
                                            placeholder={`Enter between $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`}
                                            min={minPrice.toFixed(2)}
                                            max={maxPrice.toFixed(2)}
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    
                                    {savings && (
                                        <div className="mt-2">
                                            {savings.type === 'save' ? (
                                                <small className="text-success">
                                                    <i className="fas fa-arrow-down me-1"></i>
                                                    You'll save ${savings.savings.toFixed(2)} ({savings.percentage}%)
                                                </small>
                                            ) : (
                                                <small className="text-warning">
                                                    <i className="fas fa-arrow-up me-1"></i>
                                                    ${savings.savings.toFixed(2)} more than base price (+{savings.percentage}%)
                                                </small>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="message" className="form-label">
                                        Message to Provider (Optional)
                                    </label>
                                    <textarea
                                        id="message"
                                        className="form-control"
                                        rows="3"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Explain why you're offering this price..."
                                        maxLength={500}
                                    />
                                    <small className="text-muted">
                                        {message.length}/500 characters
                                    </small>
                                </div>

                                <div className="d-flex gap-2">
                                    <button 
                                        type="submit" 
                                        className="btn btn-success"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin me-2"></i>
                                                Starting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane me-2"></i>
                                                Send Offer
                                            </>
                                        )}
                                    </button>
                                    
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={() => setShowBargainForm(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .bargain-system {
                    margin-top: 20px;
                    padding: 20px;
                    border: 2px solid #ffc107;
                    border-radius: 10px;
                    background-color: #fff9c4;
                }
                
                .price-info h5 {
                    font-size: 1.3rem;
                    margin-bottom: 10px;
                }
                
                .bargain-intro {
                    text-align: center;
                }
                
                .btn-warning {
                    background-color: #ffc107;
                    border-color: #ffc107;
                    color: #212529;
                    font-weight: bold;
                }
                
                .btn-warning:hover {
                    background-color: #ffca2c;
                    border-color: #ffc720;
                }
                
                .card-header.bg-warning {
                    background-color: #ffc107 !important;
                    color: #212529;
                }
                
                .alert {
                    border-radius: 5px;
                }
                
                .input-group-text {
                    background-color: #e9ecef;
                    border-color: #ced4da;
                }
                
                .text-success {
                    color: #198754 !important;
                }
                
                .text-warning {
                    color: #ff6b00 !important;
                }
            `}</style>
        </div>
    );
};

export default BargainSystem;
