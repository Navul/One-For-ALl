const express = require('express');
const router = express.Router();
const {
    requestInstantService,
    getAvailableInstantServices,
    acceptInstantService,
    updateServiceStatus,
    getProviderInstantRequests,
    toggleInstantServiceAvailability,
    getAllInstantServices,
    getMyInstantServices,
    getInstantServiceById,
    getAllInstantServiceRequests
} = require('../controllers/instantServiceController');
const { protect } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');

// Public routes (no authentication required, but optional auth for enhanced features)
router.get('/all', optionalAuth, getAllInstantServices);
router.get('/debug/all-requests', getAllInstantServiceRequests); // Debug endpoint
router.get('/:id', optionalAuth, getInstantServiceById);

// Protected routes (authentication required)
router.get('/my/requests', protect, getMyInstantServices);

// The following routes are commented out because their handlers are not implemented or exported:
// router.post('/join', protect, joinInstantServices);
// router.post('/leave', protect, leaveInstantServices);
// router.get('/nearby', protect, getNearbyUsers);
// router.put('/location', protect, updateLocation);
// router.put('/status', protect, updateStatus);
// router.get('/session', protect, getCurrentSession);

module.exports = router;
