const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'NEGOTIATION_STARTED',
      'COUNTER_OFFER_RECEIVED', 
      'OFFER_ACCEPTED',
      'OFFER_DECLINED',
      'NEGOTIATION_EXPIRED',
      'BOOKING_CREATED',
      'SERVICE_BOOKED'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negotiation'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    amount: Number,
    offerAmount: Number
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
