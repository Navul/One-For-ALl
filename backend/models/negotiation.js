const mongoose = require('mongoose');

const negotiationOfferSchema = new mongoose.Schema({
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    offeredPrice: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        maxLength: 500
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    }
});

const negotiationSchema = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    currentOffer: {
        type: Number,
        required: true
    },
    offers: [negotiationOfferSchema],
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled', 'expired', 'booked'],
        default: 'active'
    },
    finalPrice: {
        type: Number
    },
    completedAt: {
        type: Date
    },
    expiresAt: {
        type: Date,
        default: function() {
            // Negotiations expire after 48 hours
            return new Date(Date.now() + 48 * 60 * 60 * 1000);
        }
    },
    location: {
        address: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    scheduledDate: {
        type: Date
    },
    notes: {
        type: String,
        maxLength: 1000
    }
}, {
    timestamps: true
});

// Index for efficient queries
negotiationSchema.index({ service: 1, client: 1, provider: 1 });
negotiationSchema.index({ status: 1 });
negotiationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Negotiation', negotiationSchema);
