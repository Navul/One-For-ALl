console.log('🚀 Starting debug script...');

require('dotenv').config();
const connectDB = require('./config/db');
const Review = require('./models/review');

console.log('📦 Loaded dependencies');

async function checkReviews() {
    try {
        console.log('🔗 Connecting to database...');
        await connectDB();
        console.log('✅ Connected to database');
        
        console.log('🔍 Querying all reviews in database...');
        const allReviews = await Review.find({}).populate('user', 'name').populate('service', 'title provider');
        console.log('✅ Query completed. Total reviews found:', allReviews.length);
        
        if (allReviews.length === 0) {
            console.log('❌ No reviews found in database');
            process.exit(0);
            return;
        }
        
        allReviews.forEach((review, i) => {
            console.log(`${i+1}. Review ID: ${review._id}`);
            console.log(`   User: ${review.user?.name}`);
            console.log(`   Service: ${review.service?.title}`);
            console.log(`   Provider: ${review.service?.provider}`);
            console.log(`   Rating: ${review.rating}`);
            console.log(`   Status: ${review.status}`);
            console.log(`   Comment: ${review.comment?.substring(0, 50)}...`);
            console.log('   ---');
        });
        
        console.log('\n🎯 Reviews for Cleaning pc service (68a1e700b160b117195e1128):');
        const cleaningReviews = await Review.find({ 
            service: '68a1e700b160b117195e1128'
        }).populate('user', 'name').populate('service', 'title');
        
        console.log('Found', cleaningReviews.length, 'reviews for Cleaning pc service');
        cleaningReviews.forEach((review, i) => {
            console.log(`${i+1}. Rating: ${review.rating}, Status: ${review.status}, User: ${review.user?.name}`);
            console.log(`   Comment: ${review.comment}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkReviews();
