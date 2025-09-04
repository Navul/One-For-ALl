const ChatMessage = require('../models/chatMessage');

// Save a new chat message
exports.saveMessage = async (data) => {
  const msg = new ChatMessage({
    ...data,
    readBy: [{ userId: data.from.id }] // Mark as read by sender immediately
  });
  return await msg.save();
};

// Get chat history for a booking
exports.getChatHistory = async (bookingId) => {
  return await ChatMessage.find({ bookingId }).sort({ timestamp: 1 });
};

// Mark messages as read for a user in a specific booking
exports.markAsRead = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id.toString();
    
    console.log(`📖 Marking messages as read for user ${userId} in booking ${bookingId}`);
    
    // Update all messages in this booking that haven't been read by this user
    const result = await ChatMessage.updateMany(
      { 
        bookingId: bookingId,
        'readBy.userId': { $ne: userId },
        'from.id': { $ne: userId } // Don't mark own messages as "read"
      },
      {
        $push: {
          readBy: {
            userId: userId,
            readAt: new Date()
          }
        }
      }
    );
    
    console.log(`📖 Marked ${result.modifiedCount} messages as read`);
    
    res.json({ 
      success: true, 
      message: `Marked ${result.modifiedCount} messages as read` 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get unread message counts for user's bookings
exports.getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    // Get all bookings for the user
    const Booking = require('../models/booking');
    const bookings = await Booking.find({
      $or: [
        { user: req.user._id },
        { 'service.provider': req.user._id }
      ]
    });
    
    const bookingIds = bookings.map(b => b._id);
    
    // Get unread counts for each booking
    const unreadCounts = {};
    
    for (const bookingId of bookingIds) {
      // Count messages in this booking that haven't been read by the current user
      const count = await ChatMessage.countDocuments({
        bookingId: bookingId,
        'from.id': { $ne: userId }, // Messages not from current user
        'readBy.userId': { $ne: userId } // Not read by current user
      });
      
      if (count > 0) {
        unreadCounts[bookingId.toString()] = count;
      }
    }
    
    res.json({ success: true, unreadCounts });
  } catch (error) {
    console.error('Error getting unread message counts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
