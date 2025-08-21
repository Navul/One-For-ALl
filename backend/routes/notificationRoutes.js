const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  handleNotificationAction
} = require('../controllers/notificationController');

// Get user notifications (with role-based filtering)
router.get('/', protect, getUserNotifications);

// Get unread count (with role-based filtering)
router.get('/unread-count', protect, getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', protect, markAsRead);

// Mark all notifications as read (with role-based filtering)
router.put('/mark-all-read', protect, markAllAsRead);

// Delete specific notification
router.delete('/:notificationId', protect, deleteNotification);

// Handle notification actions (confirm, cancel, view, etc.)
router.post('/:notificationId/action', protect, handleNotificationAction);

module.exports = router;
