const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../controllers/notificationController');

// Get user notifications
router.get('/', auth, getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', auth, markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', auth, markAllAsRead);

// Get unread count
router.get('/unread-count', auth, getUnreadCount);

module.exports = router;
