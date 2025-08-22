const Notification = require('../models/notification');
const User = require('../models/User');
const Service = require('../models/service');
const Booking = require('../models/booking');

// Helper function to create notifications (recipient is now userId)
const createNotification = async ({ userId, title, message, type, relatedId, relatedModel, data = {}, hasActions = false, actions = [], isActionable = false }) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      relatedId,
      relatedModel,
      data,
      hasActions,
      actions,
      isActionable
    });
    await notification.save();
    console.log(`📩 Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('❌ [createNotification] Error creating notification:', error);
    throw error;
  }
};

// Get all notifications for a user (no role filtering)
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { userId: userId, isRead: false }, 
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Notification.countDocuments({ 
      userId: userId, 
      isRead: false 
    });
    
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Handle notification actions
const handleNotificationAction = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { action } = req.body;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Mark as read and non-actionable
    notification.isRead = true;
    notification.readAt = new Date();
    notification.isActionable = false;
    await notification.save();

    // Handle specific actions
    let result = { success: true, message: 'Action processed successfully' };

    switch (action) {
      case 'view_booking':
        result.redirect = `/bookings/${notification.data.bookingId}`;
        break;
      case 'view_negotiation':
        result.redirect = `/negotiations/${notification.data.negotiationId}`;
        break;
      case 'book_service':
        result.redirect = `/services/${notification.data.serviceId}/book`;
        break;
      default:
        result.message = `Action "${action}" processed`;
    }

    res.json(result);
  } catch (error) {
    console.error('Error handling notification action:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Send booking notification
const sendBookingNotification = async (bookingId, type = 'BOOKING_CREATED') => {
  try {
    console.log(`🔄 Sending booking notification for booking: ${bookingId}, type: ${type}`);
    
    const booking = await Booking.findById(bookingId)
      .populate('service', 'title provider')
      .populate('user', 'name role')
      .populate('provider', 'name role');

    console.log(`📋 Booking found:`, {
      id: booking?._id,
      service: booking?.service?.title,
      user: booking?.user?.name,
      provider: booking?.provider?.name,
      hasService: !!booking?.service,
      hasUser: !!booking?.user,
      hasProvider: !!booking?.provider
    });

    if (!booking) {
      console.error('❌ [sendBookingNotification] Booking not found!');
      throw new Error('Booking not found');
    }

    switch (type) {
      case 'BOOKING_CREATED':
        console.log('🔄 [sendBookingNotification] Creating notification for provider:', booking.provider?._id);
        // Notify provider
        await createNotification({
          userId: booking.provider._id,
          title: 'New Booking Request',
          message: `${booking.user.name} has booked your service "${booking.service.title}" for ${new Date(booking.date).toLocaleDateString()}`,
          type,
          relatedId: booking._id,
          relatedModel: 'Booking',
          data: {
            bookingId: booking._id,
            serviceId: booking.service._id,
            amount: booking.finalPrice || booking.totalAmount
          },
          hasActions: true,
          actions: [
            { label: 'View Booking', action: 'view_booking', style: 'primary' },
            { label: 'Contact Client', action: 'contact_client', style: 'secondary' }
          ]
        });

        console.log('🔄 [sendBookingNotification] Creating notification for client:', booking.user?._id);
        // Notify client
        await createNotification({
          userId: booking.user._id,
          title: 'Booking Confirmed',
          message: `Your booking for "${booking.service.title}" has been created successfully.`,
          type: 'BOOKING_CONFIRMED',
          relatedId: booking._id,
          relatedModel: 'Booking',
          data: {
            bookingId: booking._id,
            serviceId: booking.service._id,
            amount: booking.finalPrice || booking.totalAmount
          }
        });
        break;

      case 'BOOKING_COMPLETED':
        console.log('🔄 [sendBookingNotification] Creating completion notification for client:', booking.user?._id);
        await createNotification({
          userId: booking.user._id,
          title: 'Service Completed',
          message: `Your service "${booking.service.title}" has been marked as completed.`,
          type,
          relatedId: booking._id,
          relatedModel: 'Booking',
          data: { bookingId: booking._id, serviceId: booking.service._id },
          hasActions: true,
          actions: [
            { label: 'Rate Service', action: 'rate_service', style: 'primary' },
            { label: 'Leave Review', action: 'leave_review', style: 'secondary' }
          ]
        });
        break;
    }

    console.log('✅ [sendBookingNotification] Booking notification sent for booking', bookingId);
  } catch (error) {
    console.error('❌ [sendBookingNotification] Error sending booking notification:', error);
    // Don't throw error to avoid breaking booking flow
  }
};

// Send negotiation notification
const sendNegotiationNotification = async (negotiationId, type, recipientId, senderId, userRole) => {
  try {
    let title, message, hasActions = false, actions = [];

    switch (type) {
      case 'NEGOTIATION_STARTED':
        title = 'New Negotiation Started';
        message = 'A new price negotiation has been started for your service.';
        hasActions = true;
        actions = [
          { label: 'View Offer', action: 'view_negotiation', style: 'primary' },
          { label: 'Make Counter Offer', action: 'counter_offer', style: 'secondary' }
        ];
        break;
      case 'NEGOTIATION_ACCEPTED':
        title = 'Offer Accepted';
        message = 'Your negotiation offer has been accepted.';
        break;
      case 'NEGOTIATION_DECLINED':
        title = 'Offer Declined';
        message = 'Your negotiation offer has been declined.';
        break;
    }

      await createNotification({
        recipient: recipientId,
        sender: senderId,
        title,
        message,
        type,
        data: { negotiationId },
        hasActions,
        actions,
        priority: 'high',
        userRole
      });
  
    } catch (error) {
      console.error('Error sending negotiation notification:', error);
    }
  };

// Create test notification
const createTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notification = await createNotification({
      userId,
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      type: 'TEST',
      relatedId: null,
      relatedModel: null,
      data: { test: true },
      hasActions: true,
      actions: [
        { label: 'Mark as Read', action: 'mark_read', style: 'primary' }
      ],
      isActionable: true
    });

    res.status(201).json({ 
      success: true, 
      message: 'Test notification created',
      notification 
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create test notification',
      error: error.message 
    });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  handleNotificationAction,
  sendBookingNotification,
  sendNegotiationNotification,
  createTestNotification
};
