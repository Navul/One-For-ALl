const ChatMessage = require('../models/chatMessage');

// Save a new chat message
exports.saveMessage = async (data) => {
  const msg = new ChatMessage(data);
  return await msg.save();
};

// Get chat history for a booking
exports.getChatHistory = async (bookingId) => {
  return await ChatMessage.find({ bookingId }).sort({ timestamp: 1 });
};
