const mongoose = require('mongoose');
require('dotenv').config();

async function debugReviewServiceMatch() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get the specific service and reviews directly
        const serviceId = '68a1e700b160b117195e1128';
        console.log('🔍 Looking for service ID:', serviceId);
        console.log('🔍 Service ID type:', typeof serviceId);
        console.log('🔍 Service ID as ObjectId:', new mongoose.Types.ObjectId(serviceId));

        // Query reviews collection directly
        const db = mongoose.connection.db;
        const reviewsCollection = db.collection('reviews');
        
        // Get all reviews and check their service field types
        const allReviews = await reviewsCollection.find({}).toArray();
        console.log('\n📋 All Reviews:');
        allReviews.forEach((review, index) => {
            console.log(`Review ${index + 1}:`);
            console.log(`  _id: ${review._id}`);
            console.log(`  service: ${review.service} (type: ${typeof review.service})`);
            console.log(`  service is ObjectId: ${review.service instanceof mongoose.Types.ObjectId}`);
            console.log(`  status: ${review.status}`);
            console.log(`  rating: ${review.rating}`);
            console.log(`  user: ${review.user}`);
            console.log('  ---');
        });

        // Test different query approaches
        console.log('\n🔍 Testing different queries:');
        
        // Query 1: String comparison
        const query1 = await reviewsCollection.find({ service: serviceId }).toArray();
        console.log(`Query 1 (string): ${query1.length} results`);
        
        // Query 2: ObjectId comparison
        const query2 = await reviewsCollection.find({ service: new mongoose.Types.ObjectId(serviceId) }).toArray();
        console.log(`Query 2 (ObjectId): ${query2.length} results`);
        
        // Query 3: $in with ObjectId
        const query3 = await reviewsCollection.find({ service: { $in: [new mongoose.Types.ObjectId(serviceId)] } }).toArray();
        console.log(`Query 3 ($in with ObjectId): ${query3.length} results`);
        
        // Query 4: $in with string
        const query4 = await reviewsCollection.find({ service: { $in: [serviceId] } }).toArray();
        console.log(`Query 4 ($in with string): ${query4.length} results`);

        await mongoose.disconnect();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

debugReviewServiceMatch();
