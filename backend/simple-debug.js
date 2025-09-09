require('dotenv').config();
const mongoose = require('mongoose');

async function quickDebug() {
    console.log('=== Starting Debug ===');
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
        
        const Review = require('./models/review');
        const Service = require('./models/service');
        
        // Find the service
        const service = await Service.findById('68a1e700b160b117195e1128');
        console.log('Service found:', service ? { _id: service._id, title: service.title } : 'Not found');
        
        // Get all reviews
        const allReviews = await Review.find({});
        console.log('\nAll Reviews:');
        allReviews.forEach(review => {
            console.log({
                _id: review._id.toString(),
                service: review.service.toString(),
                serviceType: typeof review.service,
                status: review.status,
                rating: review.rating
            });
        });
        
        // Test the query that's failing
        const serviceId = new mongoose.Types.ObjectId('68a1e700b160b117195e1128');
        const query = { service: { $in: [serviceId] } };
        console.log('\nQuery:', JSON.stringify(query));
        
        const queryResult = await Review.find(query);
        console.log('Query result count:', queryResult.length);
        
        await mongoose.disconnect();
        console.log('=== Debug Complete ===');
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
    }
}

quickDebug();
