const Service = require('../models/service');

const addDebugService = async (req, res) => {
    try {
        // Create a simple test service
        const testService = new Service({
            title: 'Debug Test Service',
            description: 'Quick test service for debugging',
            category: 'cleaning',
            price: 25,
            duration: 60,
            location: {
                type: 'Point',
                coordinates: [90.4125, 23.8103] // Dhaka
            },
            instantService: true,
            serviceRadius: 10,
            estimatedDuration: '1 hour',
            isActive: true,
            availability: true,
            // We'll create a mock provider ID
            provider: '507f1f77bcf86cd799439011' // Mock ObjectId
        });

        await testService.save();
        
        res.json({
            success: true,
            message: 'Debug service added',
            service: testService
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding debug service',
            error: error.message
        });
    }
};

const getDebugServices = async (req, res) => {
    try {
        const services = await Service.find({});
        res.json({
            success: true,
            count: services.length,
            services: services
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching services',
            error: error.message
        });
    }
};

module.exports = {
    addDebugService,
    getDebugServices
};
