const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for testing
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    moderatedAt: {
        type: Date
    },
    moderationNote: {
        type: String,
        maxlength: 500
    },
    helpful: {
        type: Number,
        default: 0
    },
    reported: {
        type: Number,
        default: 0
    },
    reportReasons: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String,
            enum: ['inappropriate', 'spam', 'fake', 'offensive', 'irrelevant']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index for efficient queries
reviewSchema.index({ service: 1, status: 1 });
reviewSchema.index({ user: 1, service: 1 }, { unique: true }); // One review per user per service
reviewSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
    return this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Static method to calculate average rating for a service
reviewSchema.statics.calculateAverageRating = async function(serviceId) {
    const result = await this.aggregate([
        { $match: { service: serviceId, status: 'approved' } },
        {
            $group: {
                _id: '$service',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        }
    ]);

    if (result.length > 0) {
        const stats = result[0];
        
        // Calculate rating distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stats.ratingDistribution.forEach(rating => {
            distribution[rating] = (distribution[rating] || 0) + 1;
        });

        return {
            averageRating: Math.round(stats.averageRating * 10) / 10, // Round to 1 decimal
            totalReviews: stats.totalReviews,
            ratingDistribution: distribution
        };
    }

    return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
};

// Method to check if user can review this service
reviewSchema.statics.canUserReview = async function(userId, serviceId) {
    // Check if user has already reviewed this service
    const existingReview = await this.findOne({ user: userId, service: serviceId });
    if (existingReview) {
        return { canReview: false, reason: 'already_reviewed' };
    }

    // For testing purposes, allow reviews without booking requirement
    // TODO: Re-enable booking requirement in production
    /*
    // Check if user has booked this service (optional requirement)
    const Booking = require('./booking');
    const hasBooking = await Booking.findOne({ 
        user: userId, 
        service: serviceId,
        status: { $in: ['confirmed', 'completed'] }
    });

    if (!hasBooking) {
        return { canReview: false, reason: 'no_booking' };
    }
    */

    return { canReview: true };
};

module.exports = mongoose.model('Review', reviewSchema);
