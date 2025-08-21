const Notification = require('../models/notification');
const User = require('../models/User');
const Service = require('../models/service');
const Booking = require('../models/booking');

// Helper function to create notifications with role management
const createNotification = async ({ recipient, sender, type, title, message, data = {}, hasActions = false, actions = [], priority = 'medium', userRole }) => {
  try {
    // Determine user role if not provided
    if (!userRole) {
      const recipientUser = await User.findById(recipient);
      userRole = recipientUser ? recipientUser.role : 'client';
    }

    const notification = new Notification({
      recipient,
      sender,
      type,
      title,
      message,
      data,
      hasActions,
      actions,
      isActionable: hasActions,
      priority,
      userRole
    });
    
    await notification.save();
    console.log(`📩 Notification created for ${userRole}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get user notifications with role-based filtering
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    // Build query with role-based filtering
    let query = { recipient: userId };
    
    // Role-based filtering - users only see notifications for their role or 'all'
    if (userRole !== 'admin') {
      query.userRole = { $in: [userRole, 'all'] };
    }
    
    // Unread filter
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email role')
      .populate('data.serviceId', 'title price category')
      .populate('data.bookingId', 'date status finalPrice')
      .sort({ priority: -1, createdAt: -1 }) // Sort by priority first, then by date
      .skip(skip)
      .limit(limit);

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false,
      userRole: userRole !== 'admin' ? { $in: [userRole, 'all'] } : { $exists: true }
    });

    res.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
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

// Mark all notifications as read with role filtering
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = { recipient: userId, isRead: false };
    
    // Role-based filtering
    if (userRole !== 'admin') {
      query.userRole = { $in: [userRole, 'all'] };
    }

    await Notification.updateMany(query, { 
      isRead: true, 
      readAt: new Date() 
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get unread count with role filtering
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let query = { recipient: userId, isRead: false };
    
    // Role-based filtering
    if (userRole !== 'admin') {
      query.userRole = { $in: [userRole, 'all'] };
    }
    
    const unreadCount = await Notification.countDocuments(query);
    
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
      recipient: userId
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
    const booking = await Booking.findById(bookingId)
      .populate('service', 'title provider')
      .populate('user', 'name role')
      .populate('provider', 'name role');

    if (!booking) {
      throw new Error('Booking not found');
    }

    switch (type) {
      case 'BOOKING_CREATED':
        // Notify provider
        await createNotification({
          recipient: booking.provider._id,
          sender: booking.user._id,
          title: 'New Booking Request',
          message: `${booking.user.name} has booked your service "${booking.service.title}" for ${new Date(booking.date).toLocaleDateString()}`,
          type,
          data: {
            bookingId: booking._id,
            serviceId: booking.service._id,
            amount: booking.finalPrice || booking.totalAmount
          },
          hasActions: true,
          actions: [
            { label: 'View Booking', action: 'view_booking', style: 'primary' },
            { label: 'Contact Client', action: 'contact_client', style: 'secondary' }
          ],
          priority: 'high',
          userRole: 'provider'
        });

        // Notify client
        await createNotification({
          recipient: booking.user._id,
          sender: booking.provider._id,
          title: 'Booking Confirmed',
          message: `Your booking for "${booking.service.title}" has been created successfully.`,
          type: 'BOOKING_CONFIRMED',
          data: {
            bookingId: booking._id,
            serviceId: booking.service._id,
            amount: booking.finalPrice || booking.totalAmount
          },
          priority: 'medium',
          userRole: 'client'
        });
        break;

      case 'BOOKING_COMPLETED':
        await createNotification({
          recipient: booking.user._id,
          sender: booking.provider._id,
          title: 'Service Completed',
          message: `Your service "${booking.service.title}" has been marked as completed.`,
          type,
          data: { bookingId: booking._id, serviceId: booking.service._id },
          hasActions: true,
          actions: [
            { label: 'Rate Service', action: 'rate_service', style: 'primary' },
            { label: 'Leave Review', action: 'leave_review', style: 'secondary' }
          ],
          priority: 'medium',
          userRole: 'client'
        });
        break;
    }

    console.log(`✅ Booking notification sent for booking ${bookingId}`);
  } catch (error) {
    console.error('Error sending booking notification:', error);
  }
};

// Send negotiation notification
const sendNegotiationNotification = async (negotiationId, type, senderId, recipientId) => {
  try {
    let title, message, actions = [], hasActions = false, userRole = 'client';

    switch (type) {
      case 'NEGOTIATION_STARTED':
        title = 'New Negotiation Started';
        message = 'A client has started a negotiation for your service.';
        hasActions = true;
        userRole = 'provider';
        actions = [
          { label: 'View Negotiation', action: 'view_negotiation', style: 'primary' },
          { label: 'Respond', action: 'respond', style: 'success' }
        ];
        break;

      case 'COUNTER_OFFER_RECEIVED':
        title = 'Counter Offer Received';
        message = 'You have received a counter offer on your negotiation.';
        hasActions = true;
        actions = [
          { label: 'Accept', action: 'accept_offer', style: 'success' },
          { label: 'Counter', action: 'counter_offer', style: 'secondary' },
          { label: 'Decline', action: 'decline_offer', style: 'danger' }
        ];
        break;

      case 'OFFER_ACCEPTED':
        title = 'Offer Accepted!';
        message = 'Your negotiation offer has been accepted. You can now proceed to book the service.';
        hasActions = true;
        actions = [{ label: 'Book Now', action: 'book_service', style: 'primary' }];
        break;

      case 'OFFER_DECLINED':
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

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  handleNotificationAction,
  sendBookingNotification,
  sendNegotiationNotification
};
