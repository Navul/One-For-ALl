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
    provider: {
        type: String,
        required: true
    },
    availability: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Service', serviceSchema);