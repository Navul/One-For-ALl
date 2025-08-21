const mongoose = require('mongoose');
const Service = require('./models/service');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mdnabilkhan:nabil123@cluster0.syc8y.mongodb.net/simple_mflix?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => {
        console.log('Connected to MongoDB');
        return checkServices();
    })
    .then(() => {
        mongoose.connection.close();
        console.log('Database connection closed');
    })
    .catch(err => {
        console.error('Error:', err);
        mongoose.connection.close();
    });

async function checkServices() {
    try {
        console.log('\n=== CHECKING SERVICES IN DATABASE ===');
        
        const totalServices = await Service.countDocuments();
        console.log('Total services in database:', totalServices);
        
        const instantServices = await Service.countDocuments({ instantService: true });
        console.log('Instant services in database:', instantServices);
        
        const availableInstantServices = await Service.countDocuments({ 
            instantService: true, 
            availableNow: true 
        });
        console.log('Available instant services:', availableInstantServices);
        
        console.log('\n=== SAMPLE SERVICES ===');
        const sampleServices = await Service.find({}).limit(5).populate('provider', 'name email');
        sampleServices.forEach((service, index) => {
            console.log(`${index + 1}. ${service.title}`);
            console.log(`   Category: ${service.category}`);
            console.log(`   Instant: ${service.instantService}`);
            console.log(`   Available: ${service.availableNow}`);
            console.log(`   Location: ${service.location?.coordinates || 'No location'}`);
            console.log(`   Provider: ${service.provider?.name || 'No provider'}`);
            console.log('   ---');
        });

        console.log('\n=== CREATING TEST SERVICE IF NEEDED ===');
        if (availableInstantServices === 0) {
            // Create a simple test service
            const User = require('./models/User');
            let testProvider = await User.findOne({ email: 'test@provider.com' });
            if (!testProvider) {
                testProvider = await User.create({
                    name: 'Test Provider',
                    email: 'test@provider.com',
                    password: '$2a$10$test', // dummy hash
                    role: 'provider',
                    phone: '+1234567890'
                });
                console.log('Created test provider');
            }

            const testService = await Service.create({
                title: 'Emergency Test Service',
                description: 'Test instant service',
                category: 'Other',
                price: 50,
                location: {
                    type: 'Point',
                    coordinates: [0, 0], // Default location
                    address: 'Test Location'
                },
                provider: testProvider._id,
                instantService: true,
                availableNow: true
            });
            
            console.log('Created test service:', testService.title);
        }

    } catch (error) {
        console.error('Error checking services:', error);
    }
}
