const mongoose = require('mongoose');

// Simple test script to add services
async function addTestData() {
    try {
        const MONGO_URI = 'mongodb+srv://mdnabilkhan:nabil123@cluster0.syc8y.mongodb.net/simple_mflix?retryWrites=true&w=majority&appName=Cluster0';
        
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Create test services directly
        const Service = mongoose.model('Service', new mongoose.Schema({
            title: String,
            description: String,
            category: String,
            price: Number,
            duration: Number,
            provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            location: {
                type: {
                    type: String,
                    enum: ['Point']
                },
                coordinates: [Number]
            },
            instantService: Boolean,
            serviceRadius: Number,
            estimatedDuration: String,
            rating: {
                averageRating: Number,
                totalReviews: Number
            },
            isActive: Boolean,
            availability: Boolean
        }));

        // Create a test user/provider
        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            password: String,
            role: String,
            instantServiceAvailable: Boolean,
            location: {
                type: {
                    type: String,
                    enum: ['Point']
                },
                coordinates: [Number]
            }
        }));

        // Create test provider
        let provider = await User.findOne({ email: 'testprovider@example.com' });
        if (!provider) {
            provider = new User({
                name: 'Test Provider',
                email: 'testprovider@example.com',
                password: 'password123',
                role: 'provider',
                instantServiceAvailable: true,
                location: {
                    type: 'Point',
                    coordinates: [90.4125, 23.8103] // Dhaka coordinates
                }
            });
            await provider.save();
            console.log('Created test provider');
        }

        // Add test services
        const testServices = [
            {
                title: 'Quick House Cleaning',
                description: 'Professional cleaning service available instantly',
                category: 'cleaning',
                price: 50,
                duration: 120,
                provider: provider._id,
                location: {
                    type: 'Point',
                    coordinates: [90.4125, 23.8103]
                },
                instantService: true,
                serviceRadius: 10,
                estimatedDuration: '2 hours',
                rating: {
                    averageRating: 4.5,
                    totalReviews: 12
                },
                isActive: true,
                availability: true
            },
            {
                title: 'Emergency Plumbing',
                description: 'Urgent plumbing repairs and fixes',
                category: 'plumbing',
                price: 75,
                duration: 90,
                provider: provider._id,
                location: {
                    type: 'Point',
                    coordinates: [90.4165, 23.8143]
                },
                instantService: true,
                serviceRadius: 15,
                estimatedDuration: '1.5 hours',
                rating: {
                    averageRating: 4.8,
                    totalReviews: 8
                },
                isActive: true,
                availability: true
            }
        ];

        // Remove existing test services
        await Service.deleteMany({ provider: provider._id });
        
        // Insert new test services
        await Service.insertMany(testServices);
        console.log(`Added ${testServices.length} test services`);

        console.log('Test data added successfully!');
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

addTestData();
