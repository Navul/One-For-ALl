const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/reviewController');

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/service/:serviceId', getServiceReviews);
router.get('/service/:serviceId/stats', getServiceReviewStats);
router.get('/provider/:providerId/rating', getProviderRating);

// Protected routes (authenticated users)
router.use(protect);

// User review management
router.post('/', createReview);
router.get('/my-reviews', getUserReviews);
router.get('/provider/my-services', getProviderServiceReviews);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);

// Review interaction
router.post('/:reviewId/report', reportReview);
router.post('/:reviewId/helpful', markReviewHelpful);

// Admin routes
router.get('/admin/moderate', authorize('admin'), getReviewsForModeration);
router.put('/admin/moderate/:reviewId', authorize('admin'), moderateReview);
router.get('/admin/reported', authorize('admin'), getReportedReviews);

// Debug endpoint to check all reviews
router.get('/debug/all', async (req, res) => {
    try {
        console.log('🔍 DEBUG: Getting all reviews from database...');
        
        const Review = require('../models/review');
        const allReviews = await Review.find({})
            .populate('user', 'name email')
            .populate('service', 'title provider')
            .sort({ createdAt: -1 });
        
        console.log(`📊 Total reviews found: ${allReviews.length}`);
        
        const statusCounts = {};
        allReviews.forEach(review => {
            statusCounts[review.status] = (statusCounts[review.status] || 0) + 1;
        });
        
        console.log('📊 Status breakdown:', statusCounts);
        
        res.json({
            success: true,
            totalReviews: allReviews.length,
            statusCounts,
            reviews: allReviews
        });
    } catch (error) {
        console.error('❌ Error in debug endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message
        });
    }
});

module.exports = router;
