import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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

const ReviewItem = ({ review, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        rating: review.rating,
        title: review.title || '',
        comment: review.comment
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleSaveEdit = () => {
        onEdit(review._id, editData);
        setIsEditing(false);
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        
        return (
            <span className={`inline-block px-2 py-1 text-xs rounded ${badges[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (isEditing) {
        return (
            <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-gray-50">
                <div className="mb-4">
                    <h4 className="font-semibold text-lg">{review.service?.title}</h4>
                    <p className="text-gray-600">Editing your review</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Rating</label>
                        <StarRating
                            rating={editData.rating}
                            onRatingChange={(rating) => setEditData({...editData, rating})}
                            interactive={true}
                            size="large"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-2">Title (Optional)</label>
                        <input
                            type="text"
                            value={editData.title}
                            onChange={(e) => setEditData({...editData, title: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Quick summary of your experience"
                            maxLength={100}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-2">Your Review</label>
                        <textarea
                            value={editData.comment}
                            onChange={(e) => setEditData({...editData, comment: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                            placeholder="Tell others about your experience..."
                            maxLength={1000}
                        />
                        <div className="text-right text-xs text-gray-500">
                            {editData.comment.length}/1000
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            disabled={!editData.comment.trim() || editData.rating === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-semibold text-lg mb-1">{review.service?.title}</h4>
                    <div className="flex items-center space-x-3">
                        <StarRating rating={review.rating} size="medium" />
                        <span className="text-gray-500">{formatDate(review.createdAt)}</span>
                        {getStatusBadge(review.status)}
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(review._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                    >
                        Delete
                    </button>
                </div>
            </div>
            
            {review.title && (
                <h5 className="font-semibold text-gray-800 mb-2">{review.title}</h5>
            )}
            
            <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
            
            {review.status === 'rejected' && review.moderationNote && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                        <strong>Moderation Note:</strong> {review.moderationNote}
                    </p>
                </div>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                    {review.helpful > 0 && (
                        <span>👍 {review.helpful} found this helpful</span>
                    )}
                    {review.reported > 0 && (
                        <span>⚠️ {review.reported} reports</span>
                    )}
                </div>
            </div>
        </div>
    );
};

const MyReviews = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);

    const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://one-for-all-6lpg.onrender.com/api' 
        : 'http://localhost:5000/api';

    const fetchReviews = async (page = 1) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/my-reviews?page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data.data.reviews);
                setPagination(data.data.pagination);
            } else {
                setError('Failed to load reviews');
            }
        } catch (err) {
            setError('Error loading reviews');
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchReviews(currentPage);
        }
    }, [user, currentPage]);

    const handleEditReview = async (reviewId, editData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });

            const data = await response.json();
            if (data.success) {
                alert('Review updated successfully');
                fetchReviews(currentPage); // Refresh the list
            } else {
                alert(data.message || 'Failed to update review');
            }
        } catch (err) {
            alert('Error updating review');
            console.error('Error updating review:', err);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                alert('Review deleted successfully');
                fetchReviews(currentPage); // Refresh the list
            } else {
                alert(data.message || 'Failed to delete review');
            }
        } catch (err) {
            alert('Error deleting review');
            console.error('Error deleting review:', err);
        }
    };

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">My Reviews</h1>
                    <p className="text-gray-600">Please log in to view your reviews.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reviews</h1>
                    <p className="text-gray-600">
                        Manage your reviews and see their status
                    </p>
                </div>
                {pagination.total > 0 && (
                    <div className="text-sm text-gray-500">
                        {pagination.total} review{pagination.total !== 1 ? 's' : ''} total
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {reviews.length > 0 ? (
                <>
                    <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {reviews.filter(r => r.status === 'approved').length}
                                </div>
                                <div className="text-sm text-gray-600">Approved</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {reviews.filter(r => r.status === 'pending').length}
                                </div>
                                <div className="text-sm text-gray-600">Pending</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {reviews.filter(r => r.status === 'rejected').length}
                                </div>
                                <div className="text-sm text-gray-600">Rejected</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        {reviews.map(review => (
                            <ReviewItem
                                key={review._id}
                                review={review}
                                onEdit={handleEditReview}
                                onDelete={handleDeleteReview}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center space-x-2 mt-8">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border rounded disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 font-medium">
                                Page {currentPage} of {pagination.pages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                                disabled={currentPage === pagination.pages}
                                className="px-4 py-2 border rounded disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-2xl">⭐</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Reviews Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                        You haven't left any reviews yet. Book a service and share your experience!
                    </p>
                    <button
                        onClick={() => window.location.href = '/browse'}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                        Browse Services
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyReviews;
