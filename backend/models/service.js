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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);