const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// Test endpoint to check if routes are working
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Booking routes are working!' });
});

// Unified booking system - handles both regular and negotiation bookings
router.post('/', protect, bookingController.createBooking);

// Legacy route for compatibility (will be removed later)
// router.post('/book', protect, bookingController.createBooking);

// Get bookings for user
router.get('/user', protect, bookingController.getUserBookings);

// Get bookings for provider
router.get('/provider', protect, bookingController.getProviderBookings);

// Get negotiations for provider - simple test first
router.get('/negotiations', protect, (req, res) => {
    console.log('Negotiations endpoint called by user:', req.user._id);
    try {
        // Call the actual function
        return bookingController.getProviderNegotiations(req, res);
    } catch (error) {
        console.error('Error in negotiations endpoint:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
