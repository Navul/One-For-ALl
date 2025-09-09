const Review = require('../models/review');
const Service = require('../models/service');
const User = require('../models/User');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    try {
        console.log('📝 CREATE REVIEW REQUEST RECEIVED');
        console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
        console.log('📝 User from req.user:', req.user ? { id: req.user._id, name: req.user.name, role: req.user.role } : 'No user');

        const { serviceId, rating, title, comment } = req.body;

        console.log('📝 Extracted fields:', { serviceId, rating, title, comment });

        // Validation
        if (!serviceId || !rating || !comment) {
            console.log('❌ Missing required fields validation failed');
            return res.status(400).json({
                success: false,
                message: 'Service ID, rating, and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Check if service exists (commented out for testing with sample services)
        /*
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        */

        console.log('✅ Validation passed, checking if user can review...');

        // Check if user can review this service
        const canReview = await Review.canUserReview(req.user._id, serviceId);
        console.log('📝 canUserReview result:', canReview);
        
        if (!canReview.canReview) {
            let message = 'You cannot review this service';
            if (canReview.reason === 'already_reviewed') {
                message = 'You have already reviewed this service';
            } else if (canReview.reason === 'no_booking') {
                message = 'You must book this service before reviewing it';
            }
            console.log('❌ Cannot review:', message, 'Reason:', canReview.reason);
            return res.status(400).json({
                success: false,
                message
            });
        }

        console.log('✅ User can review, creating review...');

        // Create review
        const review = await Review.create({
            service: serviceId,
            user: req.user._id,
            rating: parseInt(rating),
            title: title?.trim(),
            comment: comment.trim(),
            status: 'pending' // All reviews start as pending for moderation
        });

        console.log('✅ Review created successfully:', review._id);

        // Populate user info for response
        await review.populate('user', 'name email');
        await review.populate('service', 'title');

        console.log('✅ Review populated with user and service info');

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully and is pending moderation',
            data: review
        });

    } catch (error) {
        console.error('Error creating review:', error);
        
        // Handle duplicate key error (user already reviewed this service)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this service'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating review',
            error: error.message
        });
    }
};

// @desc    Get reviews for a service
// @route   GET /api/reviews/service/:serviceId
// @access  Public
const getServiceReviews = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt'; // createdAt, rating, helpful
        const order = req.query.order === 'asc' ? 1 : -1;
        const filter = req.query.filter || 'approved'; // all, approved, pending

        // Build query
        let query = { service: serviceId };
        if (filter !== 'all') {
            query.status = filter;
        }

        // Get reviews with pagination
        const reviews = await Review.find(query)
            .populate('user', 'name')
            .sort({ [sortBy]: order })
            .limit(limit)
            .skip((page - 1) * limit);

        // Get total count
        const total = await Review.countDocuments(query);

        // Get average rating and stats
        const stats = await Review.calculateAverageRating(serviceId);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                },
                stats
            }
        });

    } catch (error) {
        console.error('Error getting service reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message
        });
    }
};

// @desc    Get review statistics for a service
// @route   GET /api/reviews/service/:serviceId/stats
// @access  Public
const getServiceReviewStats = async (req, res) => {
    try {
        const { serviceId } = req.params;
        
        const stats = await Review.calculateAverageRating(serviceId);
        
        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error getting review stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching review statistics',
            error: error.message
        });
    }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getUserReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const reviews = await Review.find({ user: req.user._id })
            .populate('service', 'title description price')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const total = await Review.countDocuments({ user: req.user._id });

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error getting user reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching your reviews',
            error: error.message
        });
    }
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private
const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;

        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user owns this review
        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }

        // Update fields
        if (rating) review.rating = parseInt(rating);
        if (title !== undefined) review.title = title?.trim();
        if (comment) review.comment = comment.trim();
        
        // Reset status to pending if content changed
        if (rating || comment) {
            review.status = 'pending';
            review.moderatedBy = undefined;
            review.moderatedAt = undefined;
            review.moderationNote = undefined;
        }

        await review.save();
        await review.populate('user', 'name');
        await review.populate('service', 'title');

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: review
        });

    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating review',
            error: error.message
        });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user owns this review or is admin
        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }

        await Review.findByIdAndDelete(reviewId);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting review',
            error: error.message
        });
    }
};

// @desc    Report a review
// @route   POST /api/reviews/:reviewId/report
// @access  Private
const reportReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { reason } = req.body;

        const validReasons = ['inappropriate', 'spam', 'fake', 'offensive', 'irrelevant'];
        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: 'Valid reason is required'
            });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user already reported this review
        const alreadyReported = review.reportReasons.some(
            report => report.user.toString() === req.user._id.toString()
        );

        if (alreadyReported) {
            return res.status(400).json({
                success: false,
                message: 'You have already reported this review'
            });
        }

        // Add report
        review.reportReasons.push({
            user: req.user._id,
            reason
        });
        review.reported += 1;

        await review.save();

        res.json({
            success: true,
            message: 'Review reported successfully'
        });

    } catch (error) {
        console.error('Error reporting review:', error);
        res.status(500).json({
            success: false,
            message: 'Error reporting review',
            error: error.message
        });
    }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:reviewId/helpful
// @access  Private
const markReviewHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.helpful += 1;
        await review.save();

        res.json({
            success: true,
            message: 'Review marked as helpful',
            helpful: review.helpful
        });

    } catch (error) {
        console.error('Error marking review helpful:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking review helpful',
            error: error.message
        });
    }
};

// ADMIN MODERATION ENDPOINTS

// @desc    Get all reviews for moderation
// @route   GET /api/reviews/admin/moderate
// @access  Admin
const getReviewsForModeration = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || 'pending';

        const reviews = await Review.find({ status })
            .populate('user', 'name email')
            .populate('service', 'title')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const total = await Review.countDocuments({ status });

        // Get counts for all statuses
        const statusCounts = await Review.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const counts = {
            pending: 0,
            approved: 0,
            rejected: 0
        };
        statusCounts.forEach(item => {
            counts[item._id] = item.count;
        });

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                },
                statusCounts: counts
            }
        });

    } catch (error) {
        console.error('Error getting reviews for moderation:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews for moderation',
            error: error.message
        });
    }
};

// @desc    Moderate a review (approve/reject)
// @route   PUT /api/reviews/admin/moderate/:reviewId
// @access  Admin
const moderateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { action, note } = req.body; // action: 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Action must be either "approve" or "reject"'
            });
        }

        const review = await Review.findById(reviewId)
            .populate('user', 'name email')
            .populate('service', 'title');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.status = action === 'approve' ? 'approved' : 'rejected';
        review.moderatedBy = req.user._id;
        review.moderatedAt = new Date();
        if (note) review.moderationNote = note.trim();

        await review.save();

        res.json({
            success: true,
            message: `Review ${action}d successfully`,
            data: review
        });

    } catch (error) {
        console.error('Error moderating review:', error);
        res.status(500).json({
            success: false,
            message: 'Error moderating review',
            error: error.message
        });
    }
};

// @desc    Get reported reviews
// @route   GET /api/reviews/admin/reported
// @access  Admin
const getReportedReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const reviews = await Review.find({ reported: { $gt: 0 } })
            .populate('user', 'name email')
            .populate('service', 'title')
            .populate('reportReasons.user', 'name')
            .sort({ reported: -1, createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const total = await Review.countDocuments({ reported: { $gt: 0 } });

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error getting reported reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reported reviews',
            error: error.message
        });
    }
};

// @desc    Get provider's service reviews (for providers to see reviews on their services)
// @route   GET /api/reviews/provider/my-services
// @access  Private (Service Provider)
const getProviderServiceReviews = async (req, res) => {
    try {
        console.log('🔍 Provider reviews request from user:', req.user._id, 'Role:', req.user.role);
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'approved'; // Show approved reviews by default
        const serviceId = req.query.serviceId; // Optional filter by specific service

        console.log('📋 Query params:', { page, limit, status, serviceId });

        // First get all services owned by this provider
        const Service = require('../models/service');
        let serviceQuery = { provider: req.user._id };
        if (serviceId) {
            serviceQuery._id = serviceId;
        }
        
        console.log('🏪 Searching for services with query:', serviceQuery);
        const providerServices = await Service.find(serviceQuery).select('_id title');
        console.log('🏪 Found services:', providerServices.length, providerServices);
        
        const serviceIds = providerServices.map(service => service._id);

        if (serviceIds.length === 0) {
            console.log('❌ No services found for provider');
            return res.json({
                success: true,
                data: {
                    reviews: [],
                    services: [],
                    pagination: {
                        page: 1,
                        limit,
                        total: 0,
                        pages: 0
                    },
                    stats: {
                        totalReviews: 0,
                        averageRating: 0,
                        ratingDistribution: {
                            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
                        }
                    }
                }
            });
        }

        // Build query for reviews - handle both string and ObjectId formats for service field
        let reviewQuery = { 
            service: { 
                $in: [
                    ...serviceIds, // ObjectId format
                    ...serviceIds.map(id => id.toString()) // String format
                ] 
            } 
        };
        if (status !== 'all') {
            reviewQuery.status = status;
        }

        console.log('📝 Searching for reviews with FIXED query:', reviewQuery);

        // Get reviews with pagination
        const reviews = await Review.find(reviewQuery)
            .populate('user', 'name')
            .populate('service', 'title')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        console.log('📝 Found reviews:', reviews.length, reviews);

        const total = await Review.countDocuments(reviewQuery);
        console.log('📊 Total reviews count:', total);

        // Calculate overall stats for all provider services
        const statsMatchCondition = { 
            service: { 
                $in: [
                    ...serviceIds, // ObjectId format
                    ...serviceIds.map(id => id.toString()) // String format
                ] 
            }
        };
        
        // Only filter by status if not requesting 'all'
        if (status !== 'all') {
            statsMatchCondition.status = status;
        }
        
        console.log('📊 Stats aggregation match condition:', statsMatchCondition);
        
        const statsAggregation = await Review.aggregate([
            {
                $match: statsMatchCondition
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    ratingCounts: {
                        $push: '$rating'
                    }
                }
            }
        ]);

        console.log('📊 Stats aggregation result:', statsAggregation);

        let stats = {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: {
                5: 0, 4: 0, 3: 0, 2: 0, 1: 0
            }
        };

        if (statsAggregation.length > 0) {
            const result = statsAggregation[0];
            stats.totalReviews = result.totalReviews;
            stats.averageRating = Math.round(result.averageRating * 10) / 10;
            
            // Calculate rating distribution
            result.ratingCounts.forEach(rating => {
                stats.ratingDistribution[rating]++;
            });
        }

        console.log('📊 Final calculated stats:', stats);

        res.json({
            success: true,
            data: {
                reviews,
                services: providerServices,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                },
                stats
            }
        });

    } catch (error) {
        console.error('Error getting provider service reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching your service reviews',
            error: error.message
        });
    }
};

// @desc    Get provider's overall rating from all their services
// @route   GET /api/reviews/provider/:providerId/rating
// @access  Public
const getProviderRating = async (req, res) => {
    try {
        const { providerId } = req.params;

        // Get all services by this provider
        const providerServices = await Service.find({ provider: providerId }).select('_id');
        const serviceIds = providerServices.map(service => service._id);

        if (serviceIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    averageRating: 0,
                    totalReviews: 0,
                    ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
                }
            });
        }

        // Create dual-format service IDs for both ObjectId and string matching
        const serviceIdsForQuery = [];
        serviceIds.forEach(id => {
            serviceIdsForQuery.push(id); // ObjectId format
            serviceIdsForQuery.push(id.toString()); // String format
        });

        // Aggregate reviews for all provider's services
        const stats = await Review.aggregate([
            {
                $match: {
                    service: { $in: serviceIdsForQuery },
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    ratingCounts: { $push: '$rating' }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    averageRating: 0,
                    totalReviews: 0,
                    ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
                }
            });
        }

        // Calculate rating distribution
        const ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        stats[0].ratingCounts.forEach(rating => {
            ratingDistribution[rating.toString()]++;
        });

        res.status(200).json({
            success: true,
            data: {
                averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place
                totalReviews: stats[0].totalReviews,
                ratingDistribution
            }
        });

    } catch (error) {
        console.error('Error getting provider rating:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching provider rating',
            error: error.message
        });
    }
};

module.exports = {
    createReview,
    getServiceReviews,
    getServiceReviewStats,
    getUserReviews,
    updateReview,
    deleteReview,
    reportReview,
    markReviewHelpful,
    getReviewsForModeration,
    moderateReview,
    getReportedReviews,
    getProviderServiceReviews,
    getProviderRating
};
