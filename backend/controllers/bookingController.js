const Booking = require('../models/booking');
const Service = require('../models/service');

// Create a booking
exports.createBooking = async (req, res) => {
    try {
        const { serviceId, date } = req.body;
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        const booking = await Booking.create({
            service: serviceId,
            user: req.session.userId,
            provider: service.provider,
            date
        });
        res.status(201).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Booking failed', error: error.message });
    }
};

// Get bookings for a user
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.session.userId }).populate('service');
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching bookings', error: error.message });
    }
};

// Get bookings for a provider
exports.getProviderBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ provider: req.session.userId }).populate('service user');
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching bookings', error: error.message });
    }
};
