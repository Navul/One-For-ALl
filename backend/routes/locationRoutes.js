const express = require('express');
const router = express.Router();
const {
    updateUserLocation,
    toggleLocationSharing,
    getNearbyServices,
    getNearbyProviders,
    updateServiceLocation
} = require('../controllers/locationController');
const {
    requestInstantService,
    getAvailableInstantServices,
    acceptInstantService,
    updateServiceStatus,
    getProviderInstantRequests,
    toggleInstantServiceAvailability
} = require('../controllers/instantServiceController');
const { protect } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');

// Location routes
router.put('/user/location', protect, updateUserLocation);
router.put('/user/location/toggle', protect, toggleLocationSharing);
router.get('/services/nearby', optionalAuth, getNearbyServices); // Public access with optional auth
router.get('/providers/nearby', protect, getNearbyProviders);
router.put('/service/:serviceId/location', protect, updateServiceLocation);

// Instant service routes
router.post('/instant/request', protect, requestInstantService);
router.get('/instant/available', optionalAuth, getAvailableInstantServices); // Public access with optional auth
router.put('/instant/:bookingId/accept', protect, acceptInstantService);
router.put('/instant/:bookingId/status', protect, updateServiceStatus);
router.get('/instant/provider/requests', protect, getProviderInstantRequests);
router.put('/instant/provider/toggle', protect, toggleInstantServiceAvailability);

module.exports = router;
