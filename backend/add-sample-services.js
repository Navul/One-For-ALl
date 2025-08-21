const mongoose = require('mongoose');
const Service = require('./models/service');
const User = require('./models/User');
require('dotenv').config();

const sampleServices = [
    {
        title: 'Professional Cleaning Service',
        description: 'Deep cleaning for homes and offices',
        category: 'cleaning',
        price: 50,
        duration: 120,
        instantService: true,
        location: {
            type: 'Point',
            coordinates: [90.4125, 23.8103] // Dhaka coordinates
        },
        serviceRadius: 10,
        estimatedDuration: '2 hours',
        rating: 4.5,
        isActive: true
    },
    {
        title: 'Emergency Plumbing Repair',
        description: 'Quick plumbing fixes and installations',
        category: 'plumbing',
        price: 75,
        duration: 90,
        instantService: true,
        location: {
            type: 'Point',
            coordinates: [90.4205, 23.8203] // Near Dhaka
        },
        serviceRadius: 15,
        estimatedDuration: '1.5 hours',
        rating: 4.8,
        isActive: true
    },
    {
        title: 'Electrical Repair Service',
        description: 'Electrical installations and repairs',
        category: 'electrical',
        price: 60,
        duration: 100,
        instantService: true,
        location: {
            type: 'Point',
            coordinates: [90.4085, 23.8153] // Near Dhaka
        },
        serviceRadius: 12,
        estimatedDuration: '1.5 hours',
        rating: 4.3,
        isActive: true
    },
    {
        title: 'Handyman Services',
        description: 'General repairs and maintenance',
        category: 'handyman',
        price: 40,
        duration: 150,
        instantService: true,
        location: {
            type: 'Point',
            coordinates: [90.4165, 23.8083] // Near Dhaka
        },
        serviceRadius: 8,
        estimatedDuration: '2.5 hours',
        rating: 4.2,
        isActive: true
    },
    {
        title: 'Mobile Car Wash',
        description: 'Professional car cleaning at your location',
        category: 'automotive',
        price: 35,
        duration: 60,
        instantService: true,
        location: {
            type: 'Point',
            coordinates: [90.4145, 23.8123] // Near Dhaka
        },
        serviceRadius: 20,
        estimatedDuration: '1 hour',
        rating: 4.6,
        isActive: true
    }
];

async function addSampleServices() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // First, let's create a sample provider user
        const existingUser = await User.findOne({ email: 'provider@example.com' });
        let providerId;
        
        if (!existingUser) {
            const provider = new User({
                name: 'Sample Provider',
                email: 'provider@example.com',
                password: 'password123',
                role: 'provider',
                location: {
                    type: 'Point',
                    coordinates: [90.4125, 23.8103]
                },
                instantServiceAvailable: true,
                serviceRadius: 15
            });
            await provider.save();
            providerId = provider._id;
            console.log('Created sample provider user');
        } else {
            providerId = existingUser._id;
            console.log('Using existing provider user');
        }

        // Add provider to each sample service
        const servicesWithProvider = sampleServices.map(service => ({
            ...service,
            provider: providerId
        }));

        // Clear existing sample services
        await Service.deleteMany({ provider: providerId });
        console.log('Cleared existing sample services');

        // Insert new sample services
        const insertedServices = await Service.insertMany(servicesWithProvider);
        console.log(`Added ${insertedServices.length} sample services`);

        console.log('Sample services added successfully!');
    } catch (error) {
        console.error('Error adding sample services:', error);
    } finally {
        await mongoose.connection.close();
    }
}

addSampleServices();
