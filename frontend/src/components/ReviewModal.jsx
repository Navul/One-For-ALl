import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// StarRating component for display and input
const StarRating = ({ rating, onRatingChange, interactive = false, size = 'medium' }) => {
    const [hoverRating, setHoverRating] = useState(0);
    
    const sizes = {
        small: 'text-sm',
        medium: 'text-lg',
        large: 'text-2xl'
    };

    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`${sizes[size]} ${
                        interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                    } transition-all duration-200`}
                    onClick={() => interactive && onRatingChange && onRatingChange(star)}
                    onMouseEnter={() => interactive && setHoverRating(star)}
                    onMouseLeave={() => interactive && setHoverRating(0)}
                    disabled={!interactive}
                >
                    <span 
                        className={`${
                            star <= (hoverRating || rating) 
                                ? 'text-yellow-400' 
                                : 'text-gray-300'
                        }`}
                    >
                        ★
                    </span>
                </button>
            ))}
        </div>
    );
};

const ReviewModal = ({ 
    isOpen, 
    onClose, 
    serviceId, 
    serviceName, 
    booking = null,
    onReviewSubmitted = null
}) => {
    console.log('🔍 ReviewModal rendered with props:', {
        isOpen,
        serviceId,
        serviceName,
        booking: booking ? 'exists' : 'null',
        onClose: typeof onClose,
        onReviewSubmitted: typeof onReviewSubmitted
    });

    const { user } = useAuth();
    const [formData, setFormData] = useState({
        rating: 0,
        title: '',
        comment: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        if (!user) {
            setError('Please login to submit a review');
            return;
        }

        if (formData.rating === 0) {
            setError('Please select a rating');
            return;
        }

        if (!formData.comment.trim()) {
            setError('Please write a comment');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const reviewData = {
                serviceId: serviceId,
                rating: formData.rating,
                title: formData.title.trim(),
                comment: formData.comment.trim()
            };

            // If this review is from a booking, include booking reference
            if (booking) {
                reviewData.booking = booking.id || booking._id;
            }

            const response = await fetch(`${API_BASE_URL}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reviewData)
            });

            const data = await response.json();
            
            if (data.success) {
                // Reset form
                setFormData({
                    rating: 0,
                    title: '',
                    comment: ''
                });
                
                // Call callback if provided
                if (onReviewSubmitted) {
                    onReviewSubmitted();
                }
                
                // Close modal
                onClose();
                
                alert('Review submitted successfully! It will be visible once approved by moderators.');
            } else {
                setError(data.message || 'Failed to submit review');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            rating: 0,
            title: '',
            comment: ''
        });
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{ padding: '24px' }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        borderBottom: '2px solid #f59e0b',
                        paddingBottom: '12px'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#1f2937',
                            margin: 0
                        }}>
                            ⭐ Write Review for {serviceName}
                        </h2>
                        <button
                            onClick={handleClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#6b7280',
                                padding: '4px'
                            }}
                            title="Close"
                        >
                            ×
                        </button>
                    </div>

                    {/* Service Info */}
                    {serviceName && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '6px',
                            marginBottom: '20px'
                        }}>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Reviewing service:</p>
                            <p style={{ fontWeight: '500', margin: 0, color: '#1f2937' }}>{serviceName}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            marginBottom: '20px'
                        }}>
                            <p style={{ fontSize: '14px', color: '#dc2626', margin: 0 }}>{error}</p>
                        </div>
                    )}

                    {/* Rating Section */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '8px',
                            color: '#1f2937'
                        }}>
                            Rating <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <StarRating
                            rating={formData.rating}
                            onRatingChange={(rating) => setFormData({...formData, rating})}
                            interactive={true}
                            size="large"
                        />
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Click on stars to rate</p>
                    </div>

                    {/* Title Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '8px',
                            color: '#1f2937'
                        }}>
                            Review Title (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="Brief summary of your experience..."
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                            maxLength={100}
                        />
                    </div>

                    {/* Comment Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '8px',
                            color: '#1f2937'
                        }}>
                            Your Review <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <textarea
                            value={formData.comment}
                            onChange={(e) => setFormData({...formData, comment: e.target.value})}
                            placeholder="Share your experience with this service..."
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                            maxLength={1000}
                            required
                        />
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            {formData.comment.length}/1000 characters
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        paddingTop: '20px'
                    }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                flex: '1',
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                backgroundColor: '#f9fafb',
                                color: '#374151',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmitReview}
                            disabled={submitting || formData.rating === 0 || !formData.comment.trim()}
                            style={{
                                flex: '1',
                                padding: '12px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: submitting || formData.rating === 0 || !formData.comment.trim() 
                                    ? '#9ca3af' : '#2563eb',
                                color: 'white',
                                cursor: submitting || formData.rating === 0 || !formData.comment.trim() 
                                    ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
