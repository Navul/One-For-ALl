import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const StarRating = ({ rating, size = 'medium' }) => {
    const sizes = {
        small: 'text-sm',
        medium: 'text-lg',
        large: 'text-2xl'
    };

    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <span 
                    key={star}
                    className={`${sizes[size]} ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

const ReviewModerationItem = ({ review, onModerate, onViewReports }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [moderationNote, setModerationNote] = useState('');
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        };
        
        return (
            <span className={`inline-block px-3 py-1 text-sm rounded-full border ${badges[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const handleModerate = (action) => {
        onModerate(review._id, action, moderationNote);
        setModerationNote('');
        setIsExpanded(false);
    };

    return (
        <div className="border border-gray-200 rounded-lg p-6 mb-4 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                                {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">
                                {review.user?.name || 'Anonymous User'}
                            </h4>
                            <p className="text-sm text-gray-600">{review.user?.email}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                        <StarRating rating={review.rating} />
                        <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                        </span>
                        {getStatusBadge(review.status)}
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    {review.reported > 0 && (
                        <button
                            onClick={() => onViewReports(review)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-50 text-red-700 rounded-full border border-red-200 hover:bg-red-100"
                        >
                            <span>⚠️</span>
                            <span>{review.reported} reports</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        {isExpanded ? 'Collapse' : 'Moderate'}
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <h5 className="font-semibold text-lg text-gray-900 mb-2">
                    Service: {review.service?.title}
                </h5>
                {review.title && (
                    <h6 className="font-medium text-gray-800 mb-2">"{review.title}"</h6>
                )}
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
            </div>

            {review.status !== 'pending' && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-600">Moderated by:</span>
                        <span className="text-sm text-gray-800">Admin</span>
                        <span className="text-sm text-gray-500">
                            on {formatDate(review.moderatedAt)}
                        </span>
                    </div>
                    {review.moderationNote && (
                        <p className="text-sm text-gray-700">
                            <strong>Note:</strong> {review.moderationNote}
                        </p>
                    )}
                </div>
            )}

            {isExpanded && review.status === 'pending' && (
                <div className="border-t pt-4 mt-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Moderation Note (Optional)
                        </label>
                        <textarea
                            value={moderationNote}
                            onChange={(e) => setModerationNote(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            placeholder="Add a note explaining your decision..."
                            rows="3"
                        />
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleModerate('approve')}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            ✅ Approve
                        </button>
                        <button
                            onClick={() => handleModerate('reject')}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            ❌ Reject
                        </button>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReviewModeration = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [statusCounts, setStatusCounts] = useState({});
    const [selectedReview, setSelectedReview] = useState(null);
    const [showReportsModal, setShowReportsModal] = useState(false);

    const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://one-for-all-6lpg.onrender.com/api' 
        : 'http://localhost:5000/api';

    const fetchReviews = async (status = 'pending', page = 1) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/admin/moderate?status=${status}&page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data.data.reviews);
                setPagination(data.data.pagination);
                setStatusCounts(data.data.statusCounts);
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

    const fetchReportedReviews = async (page = 1) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/admin/reported?page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data.data.reviews);
                setPagination(data.data.pagination);
            } else {
                setError('Failed to load reported reviews');
            }
        } catch (err) {
            setError('Error loading reported reviews');
            console.error('Error fetching reported reviews:', err);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            setCurrentPage(1);
            if (activeTab === 'reported') {
                fetchReportedReviews(1);
            } else {
                fetchReviews(activeTab, 1);
            }
        }
    }, [user, activeTab]);

    useEffect(() => {
        if (user?.role === 'admin' && currentPage > 1) {
            if (activeTab === 'reported') {
                fetchReportedReviews(currentPage);
            } else {
                fetchReviews(activeTab, currentPage);
            }
        }
    }, [currentPage]);

    const handleModerate = async (reviewId, action, note) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/admin/moderate/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action, note })
            });

            const data = await response.json();
            if (data.success) {
                alert(`Review ${action}d successfully`);
                // Refresh the current tab
                if (activeTab === 'reported') {
                    fetchReportedReviews(currentPage);
                } else {
                    fetchReviews(activeTab, currentPage);
                }
            } else {
                alert(data.message || `Failed to ${action} review`);
            }
        } catch (err) {
            alert(`Error ${action}ing review`);
            console.error(`Error ${action}ing review:`, err);
        }
    };

    const handleViewReports = (review) => {
        setSelectedReview(review);
        setShowReportsModal(true);
    };

    const tabs = [
        { id: 'pending', label: 'Pending', count: statusCounts.pending || 0 },
        { id: 'approved', label: 'Approved', count: statusCounts.approved || 0 },
        { id: 'rejected', label: 'Rejected', count: statusCounts.rejected || 0 },
        { id: 'reported', label: 'Reported', count: reviews.filter(r => r.reported > 0).length }
    ];

    if (user?.role !== 'admin') {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Moderation</h1>
                <p className="text-gray-600">
                    Moderate user reviews and handle reported content
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                activeTab === tab.id
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-200 text-gray-600'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Reviews List */}
            {reviews.length > 0 ? (
                <>
                    <div className="mb-6">
                        {reviews.map(review => (
                            <ReviewModerationItem
                                key={review._id}
                                review={review}
                                onModerate={handleModerate}
                                onViewReports={handleViewReports}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center space-x-2">
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
                        No Reviews to Moderate
                    </h3>
                    <p className="text-gray-600">
                        {activeTab === 'pending' && 'All reviews have been moderated.'}
                        {activeTab === 'approved' && 'No approved reviews yet.'}
                        {activeTab === 'rejected' && 'No rejected reviews yet.'}
                        {activeTab === 'reported' && 'No reported reviews at this time.'}
                    </p>
                </div>
            )}

            {/* Reports Modal */}
            {showReportsModal && selectedReview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Review Reports</h3>
                        
                        <div className="mb-4 p-4 bg-gray-50 rounded">
                            <h4 className="font-medium">{selectedReview.service?.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                By: {selectedReview.user?.name} | {selectedReview.reported} reports
                            </p>
                            <p className="mt-2">{selectedReview.comment}</p>
                        </div>

                        <div className="space-y-3">
                            <h5 className="font-medium">Reports:</h5>
                            {selectedReview.reportReasons?.map((report, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded">
                                    <div>
                                        <span className="font-medium">{report.reason}</span>
                                        <p className="text-sm text-gray-600">
                                            Reported by: {report.user?.name || 'Anonymous'}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => setShowReportsModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Close
                            </button>
                            {selectedReview.status === 'approved' && (
                                <button
                                    onClick={() => {
                                        handleModerate(selectedReview._id, 'reject', 'Rejected due to multiple reports');
                                        setShowReportsModal(false);
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Reject Review
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewModeration;
