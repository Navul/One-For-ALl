const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://mdnabilkhan:nabil123@cluster0.syc8y.mongodb.net/simple_mflix?retryWrites=true&w=majority&appName=Cluster0')
.then(() => {
    console.log('✅ Connected to MongoDB');
    return checkReviews();
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});

// Define Review schema (inline)
const reviewSchema = new mongoose.Schema({
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true },
    comment: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    moderationNote: { type: String, trim: true },
    reported: { type: Boolean, default: false },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reportedAt: { type: Date },
    reportReason: { type: String, trim: true }
}, {
    timestamps: true
});

const Review = mongoose.model('Review', reviewSchema);

async function checkReviews() {
    try {
        console.log('🔍 Querying all reviews in database...');
        
        const allReviews = await Review.find({})
            .populate('user', 'name email')
            .populate('service', 'title provider')
            .sort({ createdAt: -1 });
        
        console.log(`📊 Total reviews found: ${allReviews.length}`);
        
        if (allReviews.length === 0) {
            console.log('❌ No reviews found in database');
            console.log('\n🔍 Let me check if there are any documents in the reviews collection...');
            
            const count = await Review.countDocuments({});
            console.log(`📊 Review collection document count: ${count}`);
            
            // Check collection names
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('\n📋 Available collections:');
            collections.forEach(col => {
                console.log(`  - ${col.name}`);
            });
        } else {
            console.log('\n📝 Reviews found:');
            allReviews.forEach((review, i) => {
                console.log(`\n${i + 1}. Review ID: ${review._id}`);
                console.log(`   User: ${review.user?.name} (${review.user?.email})`);
                console.log(`   Service: ${review.service?.title}`);
                console.log(`   Rating: ${review.rating}/5`);
                console.log(`   Status: ${review.status}`);
                console.log(`   Comment: ${review.comment}`);
                console.log(`   Created: ${review.createdAt}`);
                console.log('   ---');
            });
            
            // Show status breakdown
            const statusCounts = await Review.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);
            
            console.log('\n📊 Review status breakdown:');
            statusCounts.forEach(status => {
                console.log(`   ${status._id}: ${status.count}`);
            });
            
            // Check for service 68a1e700b160b117195e1128 specifically
            console.log('\n🎯 Reviews for "Cleaning pc" service:');
            const cleaningReviews = await Review.find({ 
                service: new mongoose.Types.ObjectId('68a1e700b160b117195e1128')
            }).populate('user', 'name').populate('service', 'title');
            
            console.log(`Found ${cleaningReviews.length} reviews for Cleaning pc service`);
            cleaningReviews.forEach((review, i) => {
                console.log(`   ${i+1}. ${review.rating}⭐ by ${review.user?.name} - Status: ${review.status}`);
                console.log(`      "${review.comment}"`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error querying reviews:', error);
    } finally {
        console.log('\n🔚 Closing database connection...');
        mongoose.connection.close();
    }
}
