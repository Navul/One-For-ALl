const mongoose = require('mongoose');
require('dotenv').config();

console.log('Connecting to MongoDB...');

if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found in environment variables');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected successfully!');
        
        // Import models after connection
        const Service = require('./models/service');
        const User = require('./models/User');

        // Check existing services
        const serviceCount = await Service.countDocuments();
        console.log('Existing services:', serviceCount);
        
        // Check if we have a provider user
        let provider = await User.findOne({ role: 'provider' });
        if (!provider) {
            console.log('Creating a provider user...');
            provider = await User.create({
                name: 'Test Provider',
                email: 'provider@test.com',
                password: '$2a$10$test.hash.for.testing',
                role: 'provider',
                phone: '+1234567890'
            });
            console.log('Provider created:', provider.name);
        } else {
            console.log('Found existing provider:', provider.name);
        }

        // Create a simple test service
        console.log('Creating test service...');
        const testService = await Service.create({
            title: 'Quick Test Service',
            description: 'This is a test instant service',
            category: 'Other',
            price: 25,
            location: {
                type: 'Point',
                coordinates: [0, 0], // Simple coordinates
                address: 'Test Location'
            },
            provider: provider._id,
            instantService: true,
            availableNow: true
        });

        console.log('Service created successfully!');
        console.log('Service ID:', testService._id);
        console.log('Service Title:', testService.title);
        console.log('Location:', testService.location.coordinates);
        
        // Verify we can find it
        const foundServices = await Service.find({ instantService: true, availableNow: true });
        console.log('Total instant services available:', foundServices.length);
        
        mongoose.connection.close();
        console.log('Done!');
    })
    .catch(err => {
        console.error('Connection error:', err);
    });
