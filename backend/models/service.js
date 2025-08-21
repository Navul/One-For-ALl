const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'cleaning', 
            'plumbing', 
            'electrical', 
            'painting', 
            'gardening', 
            'moving', 
            'handyman', 
            'automotive', 
            'tutoring', 
            'fitness', 
            'beauty', 
            'pet-care', 
            'appliance-repair',
            'carpentry',
            'roofing',
            'others'
        ],
        default: 'others'
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    availability: {
        type: Boolean,
        default: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        },
        address: String
    },
    instantService: {
        type: Boolean,
        default: false
    },
    estimatedDuration: {
        type: Number, // in minutes
        default: 60
    },
    serviceRadius: {
        type: Number, // in kilometers
        default: 5,
        min: 1,
        max: 25
    },
    rating: {
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalReviews: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);