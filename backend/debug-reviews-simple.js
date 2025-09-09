const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const debugReviews = async () => {
    try {
        await connectDB();

        const User = require('./models/User');
        const Service = require('./models/service');
        const Review = require('./models/review');

        console.log('\n🔍 === DEBUGGING REVIEWS ===\n');

        // 1. Check all users and their roles
        console.log('👥 All Users:');
        const users = await User.find({}).select('name email role');
        users.forEach(user => {
            console.log(`  - ${user.name} (${user.email}) - Role: ${user.role || 'user'}`);
        });

        // 2. Check all services and their providers
        console.log('\n🏪 All Services:');
        const services = await Service.find({}).populate('provider', 'name email role');
        services.forEach(service => {
            console.log(`  - "${service.title}" by ${service.provider?.name} (${service.provider?.email})`);
            console.log(`    Provider ID: ${service.provider?._id}`);
            console.log(`    Service ID: ${service._id}`);
        });

        // 3. Check all reviews
        console.log('\n⭐ All Reviews:');
        const reviews = await Review.find({})
            .populate('user', 'name email')
            .populate('service', 'title');
        
        if (reviews.length === 0) {
            console.log('  ❌ No reviews found in database');
        } else {
            reviews.forEach(review => {
                console.log(`  - ${review.rating}⭐ by ${review.user?.name} for "${review.service?.title}"`);
                console.log(`    Service ID: ${review.service?._id} (${typeof review.service})`);
                console.log(`    Status: ${review.status}`);
                console.log(`    Comment: ${review.comment.substring(0, 50)}...`);
            });
        }

        // 4. Test the provider review query logic
        console.log('\n🔧 Testing Provider Review Query:');
        
        // Find a provider
        const provider = await User.findOne({ role: 'provider' });
        if (!provider) {
            console.log('  ❌ No provider found');
        } else {
            console.log(`  📋 Testing for provider: ${provider.name} (${provider._id})`);
            
            // Find their services
            const providerServices = await Service.find({ provider: provider._id });
            console.log(`  🏪 Provider has ${providerServices.length} services`);
            
            if (providerServices.length > 0) {
                const serviceIds = providerServices.map(s => s._id);
                console.log(`  🎯 Service IDs: ${serviceIds.map(id => id.toString()).join(', ')}`);
                
                // Test the dual query format (ObjectId and string)
                const reviewQuery = { 
                    service: { 
                        $in: [
                            ...serviceIds, // ObjectId format
                            ...serviceIds.map(id => id.toString()) // String format
                        ] 
                    },
                    status: 'approved'
                };
                
                console.log('  🔍 Review Query:', JSON.stringify(reviewQuery, null, 2));
                
                const providerReviews = await Review.find(reviewQuery)
                    .populate('user', 'name')
                    .populate('service', 'title');
                
                console.log(`  📊 Found ${providerReviews.length} reviews for provider`);
                
                if (providerReviews.length > 0) {
                    providerReviews.forEach(review => {
                        console.log(`    ⭐ ${review.rating} stars - "${review.service?.title}" by ${review.user?.name}`);
                    });
                } else {
                    console.log('    ❌ No approved reviews found for this provider');
                    
                    // Check for any reviews regardless of status
                    const anyReviews = await Review.find({ service: { $in: serviceIds } });
                    console.log(`    🔍 Total reviews (any status): ${anyReviews.length}`);
                    anyReviews.forEach(review => {
                        console.log(`      - Status: ${review.status}, Rating: ${review.rating}`);
                    });
                }
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

debugReviews();
