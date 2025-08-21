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
      'SERVICE_BOOKED',
      'BOOKING_CONFIRMED',
      'BOOKING_CANCELLED',
      'BOOKING_COMPLETED',
      'SERVICE_UPDATE',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'SYSTEM_UPDATE',
      'PROVIDER_RESPONSE'
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
    offerAmount: Number,
    originalPrice: Number,
    finalPrice: Number
  },
  // Action-related fields for interactive notifications
  hasActions: {
    type: Boolean,
    default: false
  },
  actions: [{
    label: String,
    action: String,
    style: String, // 'primary', 'secondary', 'danger', 'success'
  }],
  isActionable: {
    type: Boolean,
    default: true
  },
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // User role for role-based filtering
  userRole: {
    type: String,
    enum: ['client', 'provider', 'admin'],
    required: true
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
