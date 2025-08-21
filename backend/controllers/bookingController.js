const Booking = require('../models/booking');
const Service = require('../models/service');
const Negotiation = require('../models/negotiation');
const mongoose = require('mongoose');
const { sendBookingNotification } = require('./notificationController');

// Create a booking - Unified system for regular and negotiation bookings
exports.createBooking = async (req, res) => {
    console.log('🚀 UNIFIED BOOKING SYSTEM - createBooking called!');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User from middleware:', req.user ? req.user._id : 'No user found');
    console.log('🔗 Full URL:', req.originalUrl);
    console.log('📍 Method:', req.method);
    console.log('🔑 Headers:', req.headers.authorization ? 'Bearer token present' : 'No auth header');
    
    // Check if user exists (like Health-and-Fitness-Center does)
    if (!req.user) {
        console.log('❌ No user found in request - auth middleware may have failed');
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    try {
        const { serviceId, date, location, notes, isInstantService, negotiationId, userId } = req.body;
        
        console.log('📝 Creating booking:', { serviceId, negotiationId, userId: req.user._id });
        
        // Validate required fields
        if (!serviceId) {
            return res.status(400).json({ success: false, message: 'Service ID is required' });
        }
        if (!date || date.trim() === '') {
            return res.status(400).json({ success: false, message: 'Start date is required' });
        }

        // Validate serviceId format
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid service ID format. Please provide a valid MongoDB ObjectId.' 
            });
        }
        
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        // Validate that user is not trying to book their own service
        if (service.provider.toString() === req.user._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot book your own service' 
            });
        }
        
        // Initialize pricing variables
        let finalPrice = service.price;  // Default to service price
        let negotiation = null;
        
        // If booking from negotiation, get negotiated price
        if (negotiationId) {
            console.log('🤝 Booking from negotiation:', negotiationId);
            negotiation = await Negotiation.findById(negotiationId);
            
            if (!negotiation) {
                return res.status(404).json({ success: false, message: 'Negotiation not found' });
            }
            
            // Verify user is the client in the negotiation
            if (negotiation.client.toString() !== req.user._id.toString()) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only book services from your own negotiations' 
                });
            }
            
            // Verify negotiation is completed
            if (negotiation.status !== 'completed') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Negotiation must be completed before booking' 
                });
            }
            
            // Use negotiated price
            finalPrice = negotiation.finalPrice || negotiation.currentOffer;
            console.log('💰 Using negotiated price:', finalPrice);
            
            // Check if booking already exists for this negotiation
            const existingNegotiationBooking = await Booking.findOne({ negotiationId: negotiationId });
            if (existingNegotiationBooking) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'A booking already exists for this negotiation' 
                });
            }
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
        
        // Create unified booking object
        const bookingData = {
            service: serviceId,
            user: req.user._id,
            provider: service.provider,
            date: new Date(date),
            originalPrice: service.price,        // Always store original service price
            finalPrice: finalPrice,              // Variable price (negotiated or original)
            totalAmount: finalPrice,             // Set total to final price
            status: 'confirmed'                  // Unified bookings are confirmed
        };
        
        // Add negotiation link if booking from negotiation
        if (negotiationId) {
            bookingData.negotiationId = negotiationId;
        }

        // Add optional fields if provided
        if (location && location.trim() !== '') {
            if (typeof location === 'string') {
                // Simple string location
                bookingData.location = location;
            } else if (location.lng && location.lat) {
                // Coordinate-based location
                bookingData.customerLocation = {
                    type: 'Point',
                    coordinates: [location.lng, location.lat],
                    address: location.address || ''
                };
            }
        } else if (!negotiationId) {
            // For regular bookings without location, use service provider's location
            bookingData.location = 'To be determined by provider';
        }

        if (notes) {
            bookingData.notes = notes;
        }

        if (isInstantService) {
            bookingData.isInstantService = true;
        }

        const booking = await Booking.create(bookingData);
        
        // If booking was created from negotiation, update negotiation status
        if (negotiationId && negotiation) {
            negotiation.status = 'booked';
            negotiation.updatedAt = new Date();
            await negotiation.save();
            console.log('✅ Updated negotiation status to booked');
        }
        
        console.log('✅ Booking created successfully:', booking._id);
        
        // Send notification to both client and provider
        try {
            await sendBookingNotification(booking._id, 'BOOKING_CREATED');
        } catch (notificationError) {
            console.error('Failed to send booking notification:', notificationError);
            // Don't fail the booking if notification fails
        }
        
        // Populate the response
        const populatedBooking = await Booking.findById(booking._id)
            .populate('service', 'title category')
            .populate('user', 'name email')
            .populate('provider', 'name email');
        
        res.status(201).json({ 
            success: true, 
            message: negotiationId ? 'Booking created from negotiation successfully' : 'Booking created successfully',
            booking: populatedBooking 
        });
    } catch (error) {
        console.error('Booking creation error:', {
            error: error.message,
            stack: error.stack,
            requestBody: req.body,
            userId: req.user?._id
        });
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

// Get negotiations for provider's services
exports.getProviderNegotiations = async (req, res) => {
    try {
        console.log('getProviderNegotiations called for provider:', req.user._id);
        
        // Import the Negotiation model
        const Negotiation = require('../models/negotiation');
        
        // First, let's check if there are any negotiations at all
        const allNegotiations = await Negotiation.find({}).populate('service client');
        console.log('Total negotiations in database:', allNegotiations.length);
        
        // Find all negotiations for services owned by this provider
        const negotiations = await Negotiation.find({ 
            provider: req.user._id,
            status: 'active'  // Only show active negotiations
        })
        .populate('service', 'title startingPrice minPrice maxPrice')
        .populate('client', 'name email')
        .sort({ createdAt: -1 });
        
        console.log(`Found ${negotiations.length} active negotiations for provider ${req.user._id}`);
        console.log('Negotiations:', negotiations);
        
        res.json({ 
            success: true, 
            negotiations: negotiations.map(negotiation => ({
                _id: negotiation._id,
                service: negotiation.service,
                customer: negotiation.client,
                originalPrice: negotiation.basePrice,
                requestedPrice: negotiation.currentOffer,
                message: negotiation.lastMessage || '',
                status: negotiation.status,
                createdAt: negotiation.createdAt,
                offers: negotiation.offers || []
            }))
        });
    } catch (error) {
        console.error('Error fetching negotiations:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching negotiations', 
            error: error.message 
        });
    }
};

// OLD NEGOTIATION BOOKING SYSTEM - REPLACED BY UNIFIED SYSTEM
// This function is no longer used - all booking now goes through createBooking
/*
exports.createBookingFromNegotiation = async (req, res) => {
    // This endpoint has been replaced by the unified createBooking function
    // All booking requests (regular and negotiation) now use POST /api/bookings
    res.status(410).json({
        success: false,
        message: 'This endpoint is deprecated. Please use POST /api/bookings with negotiationId parameter.',
        redirect: '/api/bookings'
    });
};
*/
