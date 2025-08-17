const mongoose = require('mongoose');
require('dotenv').config();

console.log('Connecting to MongoDB...');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
    runTest();
}).catch(error => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
});

// Define the Service schema directly here to avoid import issues
const serviceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { 
        type: String, 
        required: true,
        enum: ['cleaning', 'fixing', 'painting', 'gardening', 'others'],
        default: 'others'
    },
    provider: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    availability: { type: Boolean, default: true }
}, { timestamps: true });

const Service = mongoose.model('Service', serviceSchema);

async function runTest() {
    try {
        // Clear existing services
        await Service.deleteMany({});
        console.log('Cleared existing services');

        // Create a dummy provider ID
        const providerId = new mongoose.Types.ObjectId();

        // Add services with proper categories
        const services = [
            {
                title: 'Professional House Cleaning',
                description: 'Deep cleaning service for your home',
                price: 75,
                category: 'cleaning',
                provider: providerId
            },
            {
                title: 'Plumbing Repairs',
                description: 'Fix leaks and install fixtures',
                price: 120,
                category: 'fixing',
                provider: providerId
            },
            {
                title: 'Interior Painting',
                description: 'Professional wall painting service',
                price: 200,
                category: 'painting',
                provider: providerId
            },
            {
                title: 'Garden Landscaping',
                description: 'Complete garden design and maintenance',
                price: 300,
                category: 'gardening',
                provider: providerId
            },
            {
                title: 'Moving Service',
                description: 'Professional moving and packing',
                price: 150,
                category: 'others',
                provider: providerId
            },
            {
                title: 'Electrical Work',
                description: 'Electrical installation and repairs',
                price: 180,
                category: 'fixing',
                provider: providerId
            }
        ];

        const createdServices = await Service.insertMany(services);
        console.log(`Created ${createdServices.length} services with categories:`);
        
        createdServices.forEach(service => {
            console.log(`- ${service.title}: ${service.category}`);
        });

        // Verify the services were created with categories
        const allServices = await Service.find({});
        console.log('\nVerification - All services in database:');
        allServices.forEach(service => {
            console.log(`- ID: ${service._id}, Title: ${service.title}, Category: ${service.category}`);
        });

        // Test category filtering
        const cleaningServices = await Service.find({ category: 'cleaning' });
        console.log(`\nCleaning services: ${cleaningServices.length}`);
        
        const fixingServices = await Service.find({ category: 'fixing' });
        console.log(`Fixing services: ${fixingServices.length}`);
        
        console.log('\nTest completed successfully!');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}
