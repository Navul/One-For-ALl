const mongoose = require('mongoose');
const Service = require('./models/service');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mdnabilkhan:nabil123@cluster0.syc8y.mongodb.net/simple_mflix?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function addTestServices() {
    try {
        console.log('Connected to MongoDB');
        
        // First, let's create a test user/provider
        let testProvider = await User.findOne({ email: 'provider@test.com' });
        if (!testProvider) {
            testProvider = await User.create({
                name: 'Test Provider',
                email: 'provider@test.com',
                password: 'hashedpassword', // In real app, this would be hashed
                role: 'provider',
                phone: '+1234567890'
            });
            console.log('Test provider created');
        }

        // Clear existing test services
        await Service.deleteMany({ title: /Test.*Service/ });
        console.log('Cleared existing test services');

        // Add services in different locations for testing
        const testServices = [
            {
                title: 'Test Plumbing Service NYC',
                description: 'Emergency plumbing service in New York City',
                category: 'Plumbing',
                price: 75,
                location: {
                    type: 'Point',
                    coordinates: [-74.006, 40.7128], // New York City
                    address: 'New York, NY, USA'
                },
                provider: testProvider._id,
                instantService: true,
                availableNow: true
            },
            {
                title: 'Test Electrical Service NYC',
                description: 'Quick electrical repairs in NYC',
                category: 'Electrical',
                price: 85,
                location: {
                    type: 'Point',
                    coordinates: [-74.0059, 40.7614], // Manhattan
                    address: 'Manhattan, NY, USA'
                },
                provider: testProvider._id,
                instantService: true,
                availableNow: true
            },
            {
                title: 'Test Plumbing Service LA',
                description: 'Emergency plumbing in Los Angeles',
                category: 'Plumbing',
                price: 80,
                location: {
                    type: 'Point',
                    coordinates: [-118.2437, 34.0522], // Los Angeles
                    address: 'Los Angeles, CA, USA'
                },
                provider: testProvider._id,
                instantService: true,
                availableNow: true
            },
            {
                title: 'Test Cleaning Service London',
                description: 'Quick cleaning service in London',
                category: 'Cleaning',
                price: 50,
                location: {
                    type: 'Point',
                    coordinates: [-0.1276, 51.5074], // London
                    address: 'London, UK'
                },
                provider: testProvider._id,
                instantService: true,
                availableNow: true
            },
            {
                title: 'Test Plumbing Service Local',
                description: 'Local plumbing service',
                category: 'Plumbing',
                price: 70,
                location: {
                    type: 'Point',
                    coordinates: [0, 0], // Default location - will be near any test location
                    address: 'Test Location'
                },
                provider: testProvider._id,
                instantService: true,
                availableNow: true
            }
        ];

        const createdServices = await Service.insertMany(testServices);
        console.log(`Added ${createdServices.length} test services`);
        
        console.log('Test services locations:');
        createdServices.forEach(service => {
            console.log(`- ${service.title}: ${service.location.coordinates}`);
        });

        mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error adding test services:', error);
        mongoose.connection.close();
    }
}

addTestServices();
