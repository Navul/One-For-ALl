const mongoose = require('mongoose');

const instantServiceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userRole: {
        type: String,
        enum: ['customer', 'provider'],
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    address: {
        type: String,
        required: true
    },
    serviceCategory: {
        type: String,
        required: function() {
            return this.userRole === 'customer';
        }
    },
    availableServices: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    radius: {
        type: Number,
        default: 10000 // 10km in meters
    },
    socketId: {
        type: String
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['available', 'busy', 'offline'],
        default: 'available'
    }
}, {
    timestamps: true
});

// Create geospatial index for location-based queries
instantServiceSchema.index({ location: '2dsphere' });

// Index for efficient queries
instantServiceSchema.index({ userId: 1, isActive: 1 });
instantServiceSchema.index({ userRole: 1, isActive: 1, status: 1 });

module.exports = mongoose.model('InstantService', instantServiceSchema);
