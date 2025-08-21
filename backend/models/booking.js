const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'bargaining', 'negotiating', 'counter_offered'],
        default: 'pending'
    },
    // Pricing fields - unified system
    originalPrice: {
        type: Number,
        required: true  // Always store the service's original price
    },
    finalPrice: {
        type: Number,
        required: true  // Variable price: negotiated OR original price
    },
    offeredPrice: {
        type: Number    // Optional: for tracking negotiation offers
    },
    bargainMessage: {
        type: String
    },
    bargainHistory: [{
        price: Number,
        message: String,
        fromUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    isInstantService: {
        type: Boolean,
        default: false
    },
    customerLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        },
        address: String
    },
    estimatedArrival: {
        type: Date
    },
    actualArrival: {
        type: Date
    },
    completionTime: {
        type: Date
    },
    distance: {
        type: Number // in kilometers
    },
    totalAmount: {
        type: Number,
        required: true  // This will be set to finalPrice
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    notes: {
        type: String
    },
    // Link to negotiation if booking was created from negotiation
    negotiationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Negotiation'
    },
    // Location for the service
    location: {
        type: String
    },
    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        review: String,
        createdAt: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
