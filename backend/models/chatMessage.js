const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  from: {
    id: { type: String, required: true },
    name: { type: String },
    role: { type: String }
  },
  to: {
    id: { type: String, required: true },
    name: { type: String },
    role: { type: String }
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readBy: [{ 
    userId: { type: String, required: true },
    readAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
