const mongoose = require('mongoose');

const instantServiceRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['general', 'plumbing', 'electrical', 'cleaning', 'delivery', 'personal', 'emergency']
    },
    details: {
        type: String,
        required: true,
        default: function() {
            return `${this.type || 'Service'} request`;
        }
    },
    phone: {
        type: String,
        required: true,
        minlength: 6
    },
    location: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    client: {
        // If client is authenticated
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        // If client is not authenticated, store socket info
        socketId: String,
        name: String
    },
    provider: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        socketId: String,
        name: String
    },
    status: {
        type: String,
        enum: ['open', 'accepted', 'in_progress', 'completed', 'cancelled'],
        default: 'open'
    },
    acceptedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    // Price negotiation tracking
    negotiation: {
        hasNegotiation: {
            type: Boolean,
            default: false
        },
        negotiationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Negotiation'
        },
        agreedPrice: Number
    },
    // Additional metadata
    urgency: {
        type: String,
        enum: ['low', 'normal', 'high', 'emergency'],
        default: 'normal'
    },
    estimatedDuration: Number, // in minutes
    notes: String,
    // Tracking and history
    history: [{
        action: String, // 'created', 'accepted', 'completed', etc.
        timestamp: {
            type: Date,
            default: Date.now
        },
        actor: {
            userId: mongoose.Schema.Types.ObjectId,
            socketId: String,
            name: String
        },
        details: String
    }]
}, {
    timestamps: true
});

// Indexes for efficient queries
instantServiceRequestSchema.index({ status: 1 });
instantServiceRequestSchema.index({ 'client.userId': 1 });
instantServiceRequestSchema.index({ 'provider.userId': 1 });
instantServiceRequestSchema.index({ 'location.lat': 1, 'location.lng': 1 });
instantServiceRequestSchema.index({ type: 1 });
instantServiceRequestSchema.index({ createdAt: -1 });

// Auto-expire open requests after 2 hours
instantServiceRequestSchema.index({ createdAt: 1 }, { 
    expireAfterSeconds: 7200, 
    partialFilterExpression: { status: 'open' } 
});

// Method to add history entry
instantServiceRequestSchema.methods.addHistory = function(action, actor, details = null) {
    this.history.push({
        action,
        actor,
        details,
        timestamp: new Date()
    });
    return this.save();
};

// Static method to find nearby requests
instantServiceRequestSchema.statics.findNearby = function(lat, lng, radiusKm = 10) {
    const radiusRad = radiusKm / 6371; // Earth's radius in km
    return this.find({
        'location.lat': {
            $gte: lat - (radiusRad * 180 / Math.PI),
            $lte: lat + (radiusRad * 180 / Math.PI)
        },
        'location.lng': {
            $gte: lng - (radiusRad * 180 / Math.PI),
            $lte: lng + (radiusRad * 180 / Math.PI)
        }
    });
};

module.exports = mongoose.model('InstantServiceRequest', instantServiceRequestSchema);
