import React, { useState, useEffect } from 'react';
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

// Individual Review Component
const ReviewItem = ({ review, onReport, onMarkHelpful }) => {
    const { user } = useAuth();
    const [showReportModal, setShowReportModal] = useState(false);
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleReport = (reason) => {
        onReport(review._id, reason);
        setShowReportModal(false);
    };

    return (
        <div className="border-b border-gray-200 py-6">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                            {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">
                            {review.user?.name || 'Anonymous User'}
                        </h4>
                        <div className="flex items-center space-x-2">
                            <StarRating rating={review.rating} size="small" />
                            <span className="text-sm text-gray-500">
                                {formatDate(review.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
                
                {user && user._id !== review.user?._id && (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onMarkHelpful(review._id)}
                            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600"
                        >
                            <span>👍</span>
                            <span>{review.helpful}</span>
                        </button>
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="text-sm text-gray-500 hover:text-red-600"
                        >
                            Report
                        </button>
                    </div>
                )}
            </div>
            
            {review.title && (
                <h5 className="font-semibold text-gray-800 mb-2">{review.title}</h5>
            )}
            
            <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
            
            {review.status === 'pending' && (
                <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Pending Moderation
                </span>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">Report Review</h3>
                        <p className="text-gray-600 mb-4">Why are you reporting this review?</p>
                        <div className="space-y-2">
                            {[
                                { value: 'inappropriate', label: 'Inappropriate content' },
                                { value: 'spam', label: 'Spam' },
                                { value: 'fake', label: 'Fake review' },
                                { value: 'offensive', label: 'Offensive language' },
                                { value: 'irrelevant', label: 'Irrelevant to service' }
                            ].map(reason => (
                                <button
                                    key={reason.value}
                                    onClick={() => handleReport(reason.value)}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                                >
                                    {reason.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Reviews Component
const ReviewsSection = ({ serviceId, className = '' }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    
    // Review form state
    const [formData, setFormData] = useState({
        rating: 0,
        title: '',
        comment: ''
    });
    const [submitting, setSubmitting] = useState(false);
    
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://one-for-all-6lpg.onrender.com/api' 
        : 'http://localhost:5000/api';

    // Fetch reviews and stats
    const fetchReviews = async (page = 1) => {
        try {
            const [reviewsResponse, statsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/reviews/service/${serviceId}?page=${page}&filter=approved`),
                fetch(`${API_BASE_URL}/reviews/service/${serviceId}/stats`)
            ]);

            if (reviewsResponse.ok) {
                const reviewsData = await reviewsResponse.json();
                setReviews(reviewsData.data.reviews);
                setPagination(reviewsData.data.pagination);
            }

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData.data);
            }
        } catch (err) {
            setError('Failed to load reviews');
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (serviceId) {
            fetchReviews(currentPage);
        }
    }, [serviceId, currentPage]);

    // Submit review
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Please login to leave a review');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    serviceId,
                    ...formData
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Review submitted successfully and is pending moderation');
                setFormData({ rating: 0, title: '', comment: '' });
                setShowReviewForm(false);
                fetchReviews(currentPage); // Refresh reviews
            } else {
                alert(data.message || 'Failed to submit review');
            }
        } catch (err) {
            alert('Error submitting review');
            console.error('Error submitting review:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Report review
    const handleReport = async (reviewId, reason) => {
        if (!user) {
            alert('Please login to report reviews');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            const data = await response.json();
            if (data.success) {
                alert('Review reported successfully');
            } else {
                alert(data.message || 'Failed to report review');
            }
        } catch (err) {
            alert('Error reporting review');
            console.error('Error reporting review:', err);
        }
    };

    // Mark review as helpful
    const handleMarkHelpful = async (reviewId) => {
        if (!user) {
            alert('Please login to mark reviews as helpful');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                // Update the helpful count in the UI
                setReviews(prevReviews =>
                    prevReviews.map(review =>
                        review._id === reviewId
                            ? { ...review, helpful: data.helpful }
                            : review
                    )
                );
            } else {
                alert(data.message || 'Failed to mark review as helpful');
            }
        } catch (err) {
            console.error('Error marking review helpful:', err);
        }
    };

    if (loading) {
        return (
            <div className={`${className}`}>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${className}`}>
            {/* Header with Stats */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
                    {stats && (
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <StarRating rating={Math.round(stats.averageRating)} size="medium" />
                                <span className="text-xl font-semibold">
                                    {stats.averageRating.toFixed(1)}
                                </span>
                                <span className="text-gray-500">
                                    ({stats.totalReviews} reviews)
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                
                {user && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Write a Review
                    </button>
                )}
            </div>

            {/* Rating Distribution */}
            {stats && stats.ratingDistribution && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-3">Rating Distribution</h4>
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => {
                            const count = stats.ratingDistribution[rating] || 0;
                            const percentage = stats.totalReviews > 0 
                                ? (count / stats.totalReviews * 100).toFixed(1) 
                                : 0;
                            
                            return (
                                <div key={rating} className="flex items-center space-x-2">
                                    <span className="text-sm w-2">{rating}</span>
                                    <span className="text-yellow-400">★</span>
                                    <div className="flex-1 h-2 bg-gray-200 rounded">
                                        <div 
                                            className="h-full bg-yellow-400 rounded"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600 w-12">
                                        {percentage}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Review Form Modal */}
            {showReviewForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Rating *</label>
                                <StarRating
                                    rating={formData.rating}
                                    onRatingChange={(rating) => setFormData({...formData, rating})}
                                    interactive={true}
                                    size="large"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Title (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Quick summary of your experience"
                                    maxLength={100}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Your Review *
                                </label>
                                <textarea
                                    value={formData.comment}
                                    onChange={(e) => setFormData({...formData, comment: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                                    placeholder="Tell others about your experience..."
                                    required
                                    maxLength={1000}
                                />
                                <div className="text-right text-xs text-gray-500">
                                    {formData.comment.length}/1000
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || formData.rating === 0 || !formData.comment.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-0">
                {reviews.length > 0 ? (
                    <>
                        {reviews.map(review => (
                            <ReviewItem
                                key={review._id}
                                review={review}
                                onReport={handleReport}
                                onMarkHelpful={handleMarkHelpful}
                            />
                        ))}
                        
                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-center space-x-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border rounded disabled:bg-gray-100"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-2">
                                    Page {currentPage} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                                    disabled={currentPage === pagination.pages}
                                    className="px-3 py-2 border rounded disabled:bg-gray-100"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No reviews yet. Be the first to leave a review!</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ReviewsSection;
