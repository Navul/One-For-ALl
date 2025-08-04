const Booking = require('../models/booking');
const Service = require('../models/service');

// Create a booking
exports.createBooking = async (req, res) => {
    try {
        const { serviceId, date } = req.body;
        
        // Validate required fields
        if (!serviceId) {
            return res.status(400).json({ success: false, message: 'Service ID is required' });
        }
        if (!date || date.trim() === '') {
            return res.status(400).json({ success: false, message: 'Start date is required' });
        }
        
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        
        // Check if user already has a booking on the same date
        const bookingDate = new Date(date);
        const startOfDay = new Date(bookingDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(bookingDate.setHours(23, 59, 59, 999));
        
        const existingBooking = await Booking.findOne({
            user: req.user._id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });
        
        if (existingBooking) {
            return res.status(400).json({ 
                success: false, 
                message: 'You already have a booking on this date. Only one booking per day is allowed.' 
            });
        }
        
        const booking = await Booking.create({
            service: serviceId,
            user: req.user._id,
            provider: service.provider,
            date: new Date(date)
        });
        
        res.status(201).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Booking failed', error: error.message });
    }
};

// Get bookings for a user
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).populate('service');
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching bookings', error: error.message });
    }
};

// Get bookings for a provider
exports.getProviderBookings = async (req, res) => {
    try {
        // First, find all services created by this provider
        const providerServices = await Service.find({ provider: req.user._id });
        const serviceIds = providerServices.map(service => service._id);
        
        // Then find all bookings for those services
        const bookings = await Booking.find({ 
            service: { $in: serviceIds } 
        }).populate('service user');
        
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching bookings', error: error.message });
    }
};
