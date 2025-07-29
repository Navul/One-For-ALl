const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// User books a service
router.post('/book', bookingController.createBooking);

// Get bookings for user
router.get('/user', bookingController.getUserBookings);

// Get bookings for provider
router.get('/provider', bookingController.getProviderBookings);

module.exports = router;
