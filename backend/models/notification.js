const mongoose = require('mongoose');


const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  type: {
    type: String,
    enum: [
      'session',
      'meal_plan',
      'achievement',
      'booking_confirmation',
      'booking_request',
      'payment_success',
      'payment_failed',
      'BOOKING_CREATED',
      'BOOKING_CONFIRMED',
      'BOOKING_COMPLETED',
      'BOOKING_CANCELLED',
      'OFFER_ACCEPTED',
      'OFFER_DECLINED',
      'NEGOTIATION_EXPIRED',
      'SERVICE_BOOKED',
      'SERVICE_UPDATE',
      'SYSTEM_UPDATE',
      'PROVIDER_RESPONSE',
      'chat'
    ],
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel',
  },
  relatedModel: {
    type: String,
    enum: ['Program', 'MealPlan', 'Booking', 'Service', 'Negotiation'],
  },
  data: {
    type: Object,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  hasActions: {
    type: Boolean,
    default: false
  },
  actions: [{
    label: String,
    action: String,
    style: String
  }],
  isActionable: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
