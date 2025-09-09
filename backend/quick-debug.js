require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('./models/review');
const Service = require('./models/service');

async function quickDebug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Find the specific service
        const targetServiceId = '68a1e700b160b117195e1128';
        
        console.log('\n=== CHECKING SERVICE ===');
        const service = await Service.findById(targetServiceId);
        console.log('Service found:', service ? {
            _id: service._id,
            title: service.title,
            provider: service.provider,
            idType: typeof service._id,
            idConstructor: service._id.constructor.name
        } : 'Not found');
        
        console.log('\n=== CHECKING ALL REVIEWS ===');
        const allReviews = await Review.find({});
        console.log('Total reviews in database:', allReviews.length);
        
        allReviews.forEach((review, index) => {
            console.log(`Review ${index + 1}:`, {
                _id: review._id,
                service: review.service,
                serviceType: typeof review.service,
                serviceConstructor: review.service?.constructor?.name,
                rating: review.rating,
                status: review.status
            });
        });
        
        console.log('\n=== TESTING DIFFERENT QUERY APPROACHES ===');
        
        // Try string query
        console.log('\n1. String query:');
        const stringResults = await Review.find({ service: targetServiceId });
        console.log('String results:', stringResults.length);
        
        // Try ObjectId query
        console.log('\n2. ObjectId query:');
        const objectIdResults = await Review.find({ service: new mongoose.Types.ObjectId(targetServiceId) });
        console.log('ObjectId results:', objectIdResults.length);
        
        // Try $in with string
        console.log('\n3. $in with string:');
        const inStringResults = await Review.find({ service: { $in: [targetServiceId] } });
        console.log('$in string results:', inStringResults.length);
        
        // Try $in with ObjectId
        console.log('\n4. $in with ObjectId:');
        const inObjectIdResults = await Review.find({ service: { $in: [new mongoose.Types.ObjectId(targetServiceId)] } });
        console.log('$in ObjectId results:', inObjectIdResults.length);
        
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

quickDebug();
