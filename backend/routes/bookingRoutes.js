const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// User books a service
router.post('/book', protect, bookingController.createBooking);

// Get bookings for user
router.get('/user', protect, bookingController.getUserBookings);

// Get bookings for provider
router.get('/provider', protect, bookingController.getProviderBookings);

module.exports = router;
