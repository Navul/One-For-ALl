const Service = require('../models/service');
const Booking = require('../models/booking');
const User = require('../models/User');
const { getDistance } = require('geolib');

// Request instant service
const requestInstantService = async (req, res) => {
    try {
        const { 
            serviceId, 
            latitude, 
            longitude, 
            address, 
            notes,
            urgency = 'normal' // normal, urgent, emergency
        } = req.body;

        if (!serviceId || !latitude || !longitude) {
            return res.status(400).json({ 
                message: 'Service ID, latitude, and longitude are required' 
            });
        }

        const service = await Service.findById(serviceId).populate('provider');
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        if (!service.instantService) {
            return res.status(400).json({ 
                message: 'This service does not support instant booking' 
            });
        }

        if (!service.availability) {
            return res.status(400).json({ 
                message: 'Service is currently unavailable' 
            });
        }

        // Check if provider is within service radius
        if (service.provider.location && service.provider.location.coordinates) {
            const distance = getDistance(
                { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
                { 
                    latitude: service.provider.location.coordinates[1], 
                    longitude: service.provider.location.coordinates[0] 
                }
            ) / 1000; // Convert to km

            if (distance > service.serviceRadius) {
                return res.status(400).json({ 
                    message: `Service provider is outside service area. Maximum distance: ${service.serviceRadius}km, Your distance: ${Math.round(distance * 100) / 100}km` 
                });
            }
        }

        // Calculate estimated arrival time based on distance and urgency
        let estimatedMinutes = service.estimatedDuration;
        if (urgency === 'urgent') {
            estimatedMinutes = Math.max(estimatedMinutes * 0.7, 15); // Rush service
        } else if (urgency === 'emergency') {
            estimatedMinutes = Math.max(estimatedMinutes * 0.5, 10); // Emergency service
        }

        const estimatedArrival = new Date(Date.now() + estimatedMinutes * 60000);

        // Create instant booking
        const booking = new Booking({
            service: serviceId,
            user: req.user._id,
            provider: service.provider._id,
            date: new Date(),
            status: 'pending',
            isInstantService: true,
            customerLocation: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
                address: address || ''
            },
            estimatedArrival,
            totalAmount: service.price,
            notes: notes || '',
            distance: service.provider.location ? getDistance(
                { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
                { 
                    latitude: service.provider.location.coordinates[1], 
                    longitude: service.provider.location.coordinates[0] 
                }
            ) / 1000 : 0
        });

        await booking.save();

        // Populate the booking with service and provider details
        const populatedBooking = await Booking.findById(booking._id)
            .populate('service', 'title description price category')
            .populate('provider', 'name email phone')
            .populate('user', 'name email phone');

        res.status(201).json({
            success: true,
            message: 'Instant service requested successfully',
            booking: populatedBooking
        });

    } catch (error) {
        console.error('Error requesting instant service:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get available instant services
const getAvailableInstantServices = async (req, res) => {
    try {
        const { latitude, longitude, category, radius = 10 } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ 
                message: 'Current location (latitude and longitude) is required' 
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const searchRadius = parseInt(radius);

        let query = {
            instantService: true,
            availability: true,
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

        if (category && category !== 'all') {
            query.category = category;
        }

        const services = await Service.find(query)
            .populate('provider', 'name email phone location rating instantServiceAvailable')
            .limit(20);

        // Filter services where provider is available for instant service
        const availableServices = services.filter(service => 
            service.provider.instantServiceAvailable
        );

        // Add distance and estimated arrival time
        const servicesWithDetails = availableServices.map(service => {
            const distance = service.provider.location && service.provider.location.coordinates.length === 2 
                ? getDistance(
                    { latitude: lat, longitude: lng },
                    { 
                        latitude: service.provider.location.coordinates[1], 
                        longitude: service.provider.location.coordinates[0] 
                    }
                ) / 1000
                : null;

            const estimatedArrival = distance 
                ? new Date(Date.now() + (service.estimatedDuration + (distance * 2)) * 60000)
                : new Date(Date.now() + service.estimatedDuration * 60000);

            return {
                ...service.toObject(),
                distance: distance ? Math.round(distance * 100) / 100 : null,
                estimatedArrival,
                responseTime: distance ? `${Math.round(service.estimatedDuration + (distance * 2))} mins` : `${service.estimatedDuration} mins`
            };
        });

        // Sort by distance and availability
        servicesWithDetails.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

        res.status(200).json({
            success: true,
            services: servicesWithDetails,
            count: servicesWithDetails.length
        });

    } catch (error) {
        console.error('Error getting available instant services:', error);
        res.status(500).json({ message: error.message });
    }
};

// Accept instant service request (for providers)
const acceptInstantService = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { estimatedArrival } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.provider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to accept this booking' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ message: 'Booking is no longer available' });
        }

        booking.status = 'confirmed';
        if (estimatedArrival) {
            booking.estimatedArrival = new Date(estimatedArrival);
        }

        await booking.save();

        const populatedBooking = await Booking.findById(booking._id)
            .populate('service', 'title description price')
            .populate('user', 'name email phone')
            .populate('provider', 'name email phone');

        res.status(200).json({
            success: true,
            message: 'Instant service request accepted',
            booking: populatedBooking
        });

    } catch (error) {
        console.error('Error accepting instant service:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update service status (for providers)
const updateServiceStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status, actualArrival, completionTime } = req.body;

        const validStatuses = ['confirmed', 'in-progress', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
            });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.provider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to update this booking' });
        }

        booking.status = status;
        
        if (status === 'in-progress' && actualArrival) {
            booking.actualArrival = new Date(actualArrival);
        }
        
        if (status === 'completed') {
            booking.completionTime = completionTime ? new Date(completionTime) : new Date();
            booking.paymentStatus = 'pending';
        }

        await booking.save();

        const populatedBooking = await Booking.findById(booking._id)
            .populate('service', 'title description price')
            .populate('user', 'name email phone')
            .populate('provider', 'name email phone');

        res.status(200).json({
            success: true,
            message: `Service status updated to ${status}`,
            booking: populatedBooking
        });

    } catch (error) {
        console.error('Error updating service status:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get instant service requests for provider
const getProviderInstantRequests = async (req, res) => {
    try {
        const { status = 'pending' } = req.query;

        const bookings = await Booking.find({
            provider: req.user._id,
            isInstantService: true,
            status: status
        })
        .populate('service', 'title description price category')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            bookings,
            count: bookings.length
        });

    } catch (error) {
        console.error('Error getting provider instant requests:', error);
        res.status(500).json({ message: error.message });
    }
};

// Toggle instant service availability
const toggleInstantServiceAvailability = async (req, res) => {
    try {
        const { available } = req.body;

        await User.findByIdAndUpdate(req.user._id, {
            instantServiceAvailable: available
        });

        res.status(200).json({
            success: true,
            message: `Instant service ${available ? 'enabled' : 'disabled'}`,
            instantServiceAvailable: available
        });

    } catch (error) {
        console.error('Error toggling instant service availability:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    requestInstantService,
    getAvailableInstantServices,
    acceptInstantService,
    updateServiceStatus,
    getProviderInstantRequests,
    toggleInstantServiceAvailability
};
