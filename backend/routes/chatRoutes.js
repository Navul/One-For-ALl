const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Get unread message counts for user's bookings
router.get('/unread-counts', protect, chatController.getUnreadCounts);

// Mark messages as read for a specific booking
router.post('/mark-read/:bookingId', protect, chatController.markAsRead);

module.exports = router;
