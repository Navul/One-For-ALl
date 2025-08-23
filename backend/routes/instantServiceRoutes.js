const express = require('express');
const router = express.Router();
const {
    requestInstantService,
    getAvailableInstantServices,
    acceptInstantService,
    updateServiceStatus,
    getProviderInstantRequests,
    toggleInstantServiceAvailability
} = require('../controllers/instantServiceController');
const { protect } = require('../middleware/auth');

// The following routes are commented out because their handlers are not implemented or exported:
// router.post('/join', protect, joinInstantServices);
// router.post('/leave', protect, leaveInstantServices);
// router.get('/nearby', protect, getNearbyUsers);
// router.put('/location', protect, updateLocation);
// router.put('/status', protect, updateStatus);
// router.get('/session', protect, getCurrentSession);

module.exports = router;
