import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// StarRating component for display
const StarRating = ({ rating, size = 'medium', showRating = true }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    const starSize = size === 'small' ? '16px' : size === 'large' ? '24px' : '20px';

    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars.push(
                <span key={i} style={{ color: '#fbbf24', fontSize: starSize }}>★</span>
            );
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars.push(
                <span key={i} style={{ color: '#fbbf24', fontSize: starSize }}>☆</span>
            );
        } else {
            stars.push(
                <span key={i} style={{ color: '#d1d5db', fontSize: starSize }}>☆</span>
            );
        }
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {stars}
            {showRating && (
                <span style={{ marginLeft: '8px', fontSize: '14px', color: '#6b7280' }}>
                    ({rating.toFixed(1)})
                </span>
            )}
        </div>
    );
};

const ProviderReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [services, setServices] = useState([]);
    const [stats, setStats] = useState({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedService, setSelectedService] = useState('all');
    const [statusFilter, setStatusFilter] = useState('approved'); // Default to 'approved' to show only approved reviews

    const fetchProviderReviews = useCallback(async () => {
        try {
            setLoading(true);
            setError(''); // Clear previous errors
            const token = localStorage.getItem('token');
            let url = `${API_BASE_URL || 'http://localhost:5000'}/api/reviews/provider/my-services?status=${statusFilter}`;
            
            if (selectedService !== 'all') {
                url += `&serviceId=${selectedService}`;
            }

            console.log('🔍 Fetching provider reviews from:', url);
            console.log('🎫 Using token:', token ? 'Token exists' : 'No token');
            console.log('🌐 API_BASE_URL:', API_BASE_URL);

            if (!token) {
                setError('No authentication token found. Please log in.');
                return;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            if (!response.ok) {
                console.error('❌ HTTP Error:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('❌ Error response text:', errorText);
                
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    return;
                } else if (response.status === 403) {
                    setError('Access denied. You need to be a service provider to view this.');
                    return;
                } else {
                    setError(`Server error: ${response.status} - ${response.statusText}`);
                    return;
                }
            }
            
            const data = await response.json();
            console.log('📄 Full response data:', JSON.stringify(data, null, 2));
            
            if (data.success) {
                console.log('✅ API call successful');
                console.log('📊 Stats received:', data.data.stats);
                console.log('🏪 Services received:', data.data.services.length);
                console.log('⭐ Reviews received:', data.data.reviews.length);
                
                setReviews(data.data.reviews || []);
                setServices(data.data.services || []);
                setStats(data.data.stats || {
                    totalReviews: 0,
                    averageRating: 0,
                    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                });
                
                // Additional debug for stats
                console.log('✅ Stats set to:', stats);
            } else {
                console.error('❌ API returned success=false:', data.message);
                setError(data.message || 'Failed to fetch reviews');
            }
        } catch (err) {
            console.error('💥 Network/Parse error:', err);
            setError(`Error loading reviews: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [selectedService, statusFilter]);

    useEffect(() => {
        fetchProviderReviews();
    }, [fetchProviderReviews]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading your reviews...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                maxWidth: '1200px', 
                margin: '0 auto', 
                padding: '20px',
                textAlign: 'center' 
            }}>
                <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '20px',
                    color: '#dc2626'
                }}>
                    <h3>Error Loading Reviews</h3>
                    <p>{error}</p>
                    <button 
                        onClick={() => {
                            setError('');
                            fetchProviderReviews();
                        }}
                        style={{
                            marginTop: '10px',
                            padding: '8px 16px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px'
            }}>
                <h2 style={{ margin: 0, color: '#1f2937' }}>Customer Reviews</h2>
            </div>

            {/* Overall Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Total Reviews</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                        {stats.totalReviews}
                    </p>
                </div>
                
                <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Average Rating</h3>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                            {stats.averageRating || '0.0'}
                        </span>
                        <StarRating rating={stats.averageRating || 0} showRating={false} />
                    </div>
                </div>
            </div>

            {/* Rating Distribution */}
            {stats.totalReviews > 0 && (
                <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '30px',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Rating Distribution</h3>
                    {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '8px'
                        }}>
                            <span style={{ width: '20px', fontSize: '14px', color: '#6b7280' }}>{rating}</span>
                            <span style={{ color: '#fbbf24', marginLeft: '8px' }}>★</span>
                            <div style={{
                                flex: 1,
                                height: '8px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                margin: '0 10px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    backgroundColor: '#fbbf24',
                                    width: stats.totalReviews > 0 
                                        ? `${(stats.ratingDistribution[rating] / stats.totalReviews) * 100}%` 
                                        : '0%',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <span style={{ fontSize: '14px', color: '#6b7280', width: '30px' }}>
                                {stats.ratingDistribution[rating] || 0}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '30px',
                flexWrap: 'wrap'
            }}>
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '5px',
                        color: '#374151'
                    }}>
                        Filter by Service:
                    </label>
                    <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="all">All Services</option>
                        {services.map(service => (
                            <option key={service._id} value={service._id}>
                                {service.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '5px',
                        color: '#374151'
                    }}>
                        Status:
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="all">All</option>
                    </select>
                </div>
            </div>

            {/* Reviews List */}
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

            {reviews.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>
                        {statusFilter === 'approved' 
                            ? 'No approved reviews yet. Keep providing excellent service to earn reviews!'
                            : 'No reviews found.'
                        }
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {reviews.map(review => (
                        <div key={review._id} style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '12px'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <StarRating rating={review.rating} showRating={false} />
                                        <span style={{
                                            fontSize: '12px',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            backgroundColor: review.status === 'approved' ? '#dcfce7' : '#fef3c7',
                                            color: review.status === 'approved' ? '#166534' : '#92400e'
                                        }}>
                                            {review.status}
                                        </span>
                                    </div>
                                    <p style={{ 
                                        fontSize: '14px', 
                                        color: '#6b7280', 
                                        margin: 0 
                                    }}>
                                        <strong>{review.user?.name || 'Anonymous'}</strong> • {formatDate(review.createdAt)}
                                    </p>
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    textAlign: 'right'
                                }}>
                                    <p style={{ margin: 0, fontWeight: '500' }}>
                                        {review.service?.title}
                                    </p>
                                </div>
                            </div>

                            {review.title && (
                                <h4 style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    margin: '0 0 10px 0'
                                }}>
                                    {review.title}
                                </h4>
                            )}

                            <p style={{
                                color: '#374151',
                                lineHeight: '1.6',
                                margin: '0 0 15px 0'
                            }}>
                                {review.comment}
                            </p>

                            {review.helpful > 0 && (
                                <div style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                    <span>👍</span>
                                    <span>{review.helpful} people found this helpful</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProviderReviews;
