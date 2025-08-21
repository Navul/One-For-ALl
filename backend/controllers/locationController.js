const User = require('../models/User');
const Service = require('../models/service');
const Booking = require('../models/booking');
const { getDistance } = require('geolib');

// Update user location
const updateUserLocation = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
                    address: address || '',
                    isLocationEnabled: true,
                    lastUpdated: new Date()
                }
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            location: user.location
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: error.message });
    }
};

// Toggle location sharing
const toggleLocationSharing = async (req, res) => {
    try {
        const { enabled } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                'location.isLocationEnabled': enabled
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: `Location sharing ${enabled ? 'enabled' : 'disabled'}`,
            isLocationEnabled: user.location.isLocationEnabled
        });
    } catch (error) {
        console.error('Error toggling location:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get nearby services
const getNearbyServices = async (req, res) => {
    try {
        const { latitude, longitude, radius = 10, category, instantOnly = false } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const searchRadius = parseInt(radius);

        // Build query
        let query = {
            availability: true,
            'location.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: searchRadius * 1000 // Convert km to meters
                }
            }
        };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (instantOnly === 'true') {
            query.instantService = true;
        }

        const services = await Service.find(query)
            .populate('provider', 'name email phone location rating')
            .limit(50);

        // Calculate distances and add them to the response
        const servicesWithDistance = services.map(service => {
            const distance = service.location && service.location.coordinates.length === 2 
                ? getDistance(
                    { latitude: lat, longitude: lng },
                    { latitude: service.location.coordinates[1], longitude: service.location.coordinates[0] }
                ) / 1000 // Convert to km
                : null;

            return {
                ...service.toObject(),
                distance: distance ? Math.round(distance * 100) / 100 : null
            };
        });

        // Sort by distance
        servicesWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

        res.status(200).json({
            success: true,
            services: servicesWithDistance,
            count: servicesWithDistance.length
        });

    } catch (error) {
        console.error('Error getting nearby services:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get nearby providers
const getNearbyProviders = async (req, res) => {
    try {
        const { latitude, longitude, radius = 10, category } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const searchRadius = parseInt(radius);

        // Find providers with location enabled and within radius
        let providerQuery = {
            role: 'provider',
            'location.isLocationEnabled': true,
            instantServiceAvailable: true,
            'location.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: searchRadius * 1000
                }
            }
        };

        const providers = await User.find(providerQuery)
            .select('name email phone location serviceRadius')
            .limit(20);

        // Get services for each provider if category is specified
        const providersWithServices = await Promise.all(providers.map(async (provider) => {
            let serviceQuery = { provider: provider._id, availability: true };
            if (category && category !== 'all') {
                serviceQuery.category = category;
            }

            const services = await Service.find(serviceQuery);
            
            const distance = getDistance(
                { latitude: lat, longitude: lng },
                { latitude: provider.location.coordinates[1], longitude: provider.location.coordinates[0] }
            ) / 1000;

            return {
                ...provider.toObject(),
                services,
                distance: Math.round(distance * 100) / 100
            };
        }));

        // Filter providers who have services in the requested category
        const filteredProviders = providersWithServices.filter(provider => 
            !category || category === 'all' || provider.services.length > 0
        );

        // Sort by distance
        filteredProviders.sort((a, b) => a.distance - b.distance);

        res.status(200).json({
            success: true,
            providers: filteredProviders,
            count: filteredProviders.length
        });

    } catch (error) {
        console.error('Error getting nearby providers:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update service location
const updateServiceLocation = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { latitude, longitude, address } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const service = await Service.findOne({ 
            _id: serviceId, 
            provider: req.user._id 
        });

        if (!service) {
            return res.status(404).json({ message: 'Service not found or unauthorized' });
        }

        service.location = {
            type: 'Point',
            coordinates: [longitude, latitude],
            address: address || ''
        };

        await service.save();

        res.status(200).json({
            success: true,
            message: 'Service location updated successfully',
            service
        });

    } catch (error) {
        console.error('Error updating service location:', error);
        res.status(500).json({ message: error.message });
    }
};

// Request instant service - uses unified booking system
const requestInstantService = async (req, res) => {
    try {
        const { serviceId, latitude, longitude, address, notes = '', urgency = 'normal' } = req.body;
        
        if (!serviceId || !latitude || !longitude) {
            return res.status(400).json({ 
                success: false, 
                message: 'Service ID, latitude, and longitude are required' 
            });
        }

        // Create booking using unified system by calling the booking endpoint internally
        const bookingData = {
            serviceId,
            date: new Date().toISOString(), // Instant service = now
            location: address || `${latitude}, ${longitude}`,
            notes: notes,
            isInstantService: true
        };

        // Use the unified booking system (we'll import the booking controller)
        const bookingController = require('./bookingController');
        
        // Create a mock request/response for the unified booking system
        const mockReq = {
            body: bookingData,
            user: req.user
        };
        
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    if (code === 201) {
                        res.status(201).json({
                            success: true,
                            message: 'Instant service requested successfully',
                            booking: data.booking,
                            instantService: true
                        });
                    } else {
                        res.status(code).json(data);
                    }
                }
            })
        };

        // Call unified booking system
        await bookingController.createBooking(mockReq, mockRes);
        
    } catch (error) {
        console.error('Error requesting instant service:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error requesting instant service', 
            error: error.message 
        });
    }
};

module.exports = {
    updateUserLocation,
    toggleLocationSharing,
    getNearbyServices,
    getNearbyProviders,
    updateServiceLocation,
    requestInstantService
};
