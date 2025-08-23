const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// Test endpoint to check if routes are working
router.get('/test', (req, res) => {
    console.log('🧪 TEST ENDPOINT HIT - Booking routes are working!');
    res.json({ success: true, message: 'Booking routes are working!' });
});

// Debug endpoint to check all bookings in database
router.get('/debug/all', protect, async (req, res) => {
    try {
        const Booking = require('../models/booking');
        const allBookings = await Booking.find({}).populate('service user provider');
        console.log('🔍 Debug: Found', allBookings.length, 'total bookings in database');
        res.json({ 
            success: true, 
            message: `Found ${allBookings.length} total bookings in database`,
            totalBookings: allBookings.length,
            bookings: allBookings,
            currentUser: req.user._id
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to create a test booking
router.post('/debug/create-test', protect, async (req, res) => {
    try {
        const Service = require('../models/service');
        const Booking = require('../models/booking');
        
        // Find any service or create a test one
        let testService = await Service.findOne({});
        if (!testService) {
            const User = require('../models/User');
            const testUser = await User.findOne({ role: 'provider' });
            if (!testUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No provider found to create test service' 
                });
            }
            
            testService = new Service({
                title: 'Test Service for Booking',
                description: 'This is a test service for booking demonstration',
                category: 'Other',
                price: 100,
                location: 'Test Location',
                provider: testUser._id
            });
            await testService.save();
        }

        // Create a test booking
        const testBooking = new Booking({
            service: testService._id,
            user: req.user._id,
            provider: testService.provider,
            date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            originalPrice: testService.price,
            finalPrice: testService.price,
            totalAmount: testService.price,
            status: 'confirmed',
            location: 'Test Location for Booking',
            notes: 'This is a test booking created for demonstration'
        });

        await testBooking.save();
        
        console.log('✅ Test booking created:', testBooking._id);
        res.json({ 
            success: true, 
            message: 'Test booking created successfully',
            booking: testBooking 
        });
    } catch (error) {
        console.error('❌ Error creating test booking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Unified booking system - handles both regular and negotiation bookings
router.post('/', protect, bookingController.createBooking);

// Legacy route for compatibility (will be removed later)
// router.post('/book', protect, bookingController.createBooking);

// Get bookings for user
router.get('/user', protect, bookingController.getUserBookings);

// Get provider bookings with detailed client info (for BookedPrograms page) - MUST come before /provider
router.get('/provider/my-bookings', protect, bookingController.getProviderBookingsDetailed);

// Test endpoint specifically for provider bookings debugging
router.get('/provider/test', (req, res) => {
    console.log('🧪 PROVIDER TEST ENDPOINT HIT');
    res.json({ success: true, message: 'Provider test endpoint is working!' });
});

// Get bookings for provider (general route - MUST come after specific /provider/* routes)
router.get('/provider', protect, bookingController.getProviderBookings);

// Update booking status
router.put('/:id/status', protect, bookingController.updateBookingStatus);

// Rate a booking
router.put('/:id/rate', protect, bookingController.rateBooking);

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
