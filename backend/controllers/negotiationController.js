const Negotiation = require('../models/negotiation');
const Service = require('../models/service');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Start a new negotiation
const startNegotiation = async (req, res) => {
    try {
        const { serviceId, initialOffer, message, location, scheduledDate, notes } = req.body;
        const clientId = req.user.id;

        // Get the service
        const service = await Service.findById(serviceId).populate('provider');
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Check if client is trying to negotiate with their own service
        if (service.provider._id.toString() === clientId) {
            return res.status(400).json({ message: 'Cannot negotiate with your own service' });
        }

        // Check if there's already an active negotiation for this service by this client
        const existingNegotiation = await Negotiation.findOne({
            service: serviceId,
            client: clientId,
            status: 'active'
        });

        if (existingNegotiation) {
            return res.status(400).json({ message: 'You already have an active negotiation for this service' });
        }

        // Validate initial offer (should be different from base price and within limits)
        if (initialOffer === service.price) {
            return res.status(400).json({ message: 'Initial offer should be different from the base price' });
        }

        // Price limits validation (30% range)
        const priceLimit = 0.3;
        const minPrice = Math.max(service.price * (1 - priceLimit), service.price * 0.5);
        const maxPrice = service.price * (1 + priceLimit);

        if (initialOffer < minPrice) {
            return res.status(400).json({ 
                message: `Offer too low. Minimum allowed: $${minPrice.toFixed(2)}` 
            });
        }

        if (initialOffer > maxPrice) {
            return res.status(400).json({ 
                message: `Offer too high. Maximum allowed: $${maxPrice.toFixed(2)}` 
            });
        }

        // Create new negotiation
        const negotiation = new Negotiation({
            service: serviceId,
            client: clientId,
            provider: service.provider._id,
            basePrice: service.price,
            currentOffer: initialOffer,
            location,
            scheduledDate,
            notes,
            offers: [{
                fromUser: clientId,
                toUser: service.provider._id,
                offeredPrice: initialOffer,
                message: message || `Initial offer of $${initialOffer}`,
                status: 'pending'
            }]
        });

        await negotiation.save();
        
        // Create notification for provider
        await createNotification({
            recipient: service.provider._id,
            sender: clientId,
            type: 'NEGOTIATION_STARTED',
            title: '🤝 New Price Negotiation!',
            message: `Someone wants to negotiate the price for your "${service.title}" service. Offered: $${initialOffer}`,
            data: {
                serviceId: serviceId,
                negotiationId: negotiation._id,
                offerAmount: initialOffer
            }
        });
        
        // Populate the negotiation for response
        const populatedNegotiation = await Negotiation.findById(negotiation._id)
            .populate('service', 'title price category')
            .populate('client', 'name email')
            .populate('provider', 'name email')
            .populate('offers.fromUser', 'name')
            .populate('offers.toUser', 'name');

        res.status(201).json({
            message: 'Negotiation started successfully',
            negotiation: populatedNegotiation
        });
    } catch (error) {
        console.error('Error starting negotiation:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Make a counter offer
const makeCounterOffer = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const { counterOffer, message } = req.body;
        const userId = req.user.id;

        const negotiation = await Negotiation.findById(negotiationId)
            .populate('service')
            .populate('client', 'name')
            .populate('provider', 'name');

        if (!negotiation) {
            return res.status(404).json({ message: 'Negotiation not found' });
        }

        // Check if user is part of this negotiation
        if (negotiation.client._id.toString() !== userId && negotiation.provider._id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to participate in this negotiation' });
        }

        // Check if negotiation is still active
        if (negotiation.status !== 'active') {
            return res.status(400).json({ message: 'Negotiation is no longer active' });
        }

        // Check if negotiation has expired
        if (new Date() > negotiation.expiresAt) {
            negotiation.status = 'expired';
            await negotiation.save();
            return res.status(400).json({ message: 'Negotiation has expired' });
        }

        // Price limits validation for counter offers
        const priceLimit = 0.3;
        const minPrice = Math.max(negotiation.basePrice * (1 - priceLimit), negotiation.basePrice * 0.5);
        const maxPrice = negotiation.basePrice * (1 + priceLimit);

        if (counterOffer < minPrice) {
            return res.status(400).json({ 
                message: `Counter offer too low. Minimum allowed: $${minPrice.toFixed(2)}` 
            });
        }

        if (counterOffer > maxPrice) {
            return res.status(400).json({ 
                message: `Counter offer too high. Maximum allowed: $${maxPrice.toFixed(2)}` 
            });
        }

        // Determine who is the recipient
        const toUser = userId === negotiation.client._id.toString() ? negotiation.provider._id : negotiation.client._id;

        // Add the counter offer
        negotiation.offers.push({
            fromUser: userId,
            toUser: toUser,
            offeredPrice: counterOffer,
            message: message || `Counter offer of $${counterOffer}`,
            status: 'pending'
        });

        negotiation.currentOffer = counterOffer;
        await negotiation.save();

        // Create notification for the recipient
        const recipientName = userId === negotiation.client._id.toString() ? negotiation.provider.name : negotiation.client.name;
        await createNotification({
            recipient: toUser,
            sender: userId,
            type: 'COUNTER_OFFER_RECEIVED',
            title: '💰 Counter Offer Received!',
            message: `${recipientName} made a counter offer of $${counterOffer} for "${negotiation.service.title}"`,
            data: {
                serviceId: negotiation.service._id,
                negotiationId: negotiationId,
                offerAmount: counterOffer
            }
        });

        // Populate for response
        const updatedNegotiation = await Negotiation.findById(negotiationId)
            .populate('service', 'title price category')
            .populate('client', 'name email')
            .populate('provider', 'name email')
            .populate('offers.fromUser', 'name')
            .populate('offers.toUser', 'name');

        res.json({
            message: 'Counter offer made successfully',
            negotiation: updatedNegotiation
        });
    } catch (error) {
        console.error('Error making counter offer:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Accept an offer
const acceptOffer = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const userId = req.user.id;

        const negotiation = await Negotiation.findById(negotiationId)
            .populate('service')
            .populate('client', 'name')
            .populate('provider', 'name');

        if (!negotiation) {
            return res.status(404).json({ message: 'Negotiation not found' });
        }

        // Check if user is part of this negotiation
        if (negotiation.client._id.toString() !== userId && negotiation.provider._id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to participate in this negotiation' });
        }

        // Check if negotiation is still active
        if (negotiation.status !== 'active') {
            return res.status(400).json({ message: 'Negotiation is no longer active' });
        }

        // Get the latest pending offer that was made TO this user
        const latestOffer = negotiation.offers
            .filter(offer => offer.toUser.toString() === userId && offer.status === 'pending')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (!latestOffer) {
            return res.status(400).json({ message: 'No pending offer to accept' });
        }

        // Mark the offer as accepted
        latestOffer.status = 'accepted';
        
        // Complete the negotiation
        negotiation.status = 'completed';
        negotiation.finalPrice = latestOffer.offeredPrice;
        negotiation.completedAt = new Date();

        await negotiation.save();

        // Create notification for the offer sender
        const otherUser = userId === negotiation.client._id.toString() ? negotiation.provider._id : negotiation.client._id;
        const acceptorName = userId === negotiation.client._id.toString() ? negotiation.client.name : negotiation.provider.name;
        
        await createNotification({
            recipient: otherUser,
            sender: userId,
            type: 'OFFER_ACCEPTED',
            title: '✅ Offer Accepted!',
            message: `Great news! ${acceptorName} accepted your offer of $${latestOffer.offeredPrice} for "${negotiation.service.title}"`,
            data: {
                serviceId: negotiation.service._id,
                negotiationId: negotiationId,
                offerAmount: latestOffer.offeredPrice
            }
        });

        // Populate for response
        const completedNegotiation = await Negotiation.findById(negotiationId)
            .populate('service', 'title price category')
            .populate('client', 'name email')
            .populate('provider', 'name email')
            .populate('offers.fromUser', 'name')
            .populate('offers.toUser', 'name');

        res.json({
            message: 'Offer accepted successfully! Negotiation completed.',
            negotiation: completedNegotiation
        });
    } catch (error) {
        console.error('Error accepting offer:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Decline an offer
const declineOffer = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const negotiation = await Negotiation.findById(negotiationId);

        if (!negotiation) {
            return res.status(404).json({ message: 'Negotiation not found' });
        }

        // Check if user is part of this negotiation
        if (negotiation.client.toString() !== userId && negotiation.provider.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to participate in this negotiation' });
        }

        // Get the latest pending offer that was made TO this user
        const latestOffer = negotiation.offers
            .filter(offer => offer.toUser.toString() === userId && offer.status === 'pending')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (!latestOffer) {
            return res.status(400).json({ message: 'No pending offer to decline' });
        }

        // Mark the offer as declined
        latestOffer.status = 'declined';
        
        // Add decline reason as a message
        if (reason) {
            const toUser = userId === negotiation.client.toString() ? negotiation.provider : negotiation.client;
            negotiation.offers.push({
                fromUser: userId,
                toUser: toUser,
                offeredPrice: latestOffer.offeredPrice,
                message: `Offer declined: ${reason}`,
                status: 'declined'
            });
        }

        await negotiation.save();

        // Populate for response
        const updatedNegotiation = await Negotiation.findById(negotiationId)
            .populate('service', 'title price category')
            .populate('client', 'name email')
            .populate('provider', 'name email')
            .populate('offers.fromUser', 'name')
            .populate('offers.toUser', 'name');

        res.json({
            message: 'Offer declined',
            negotiation: updatedNegotiation
        });
    } catch (error) {
        console.error('Error declining offer:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get user's negotiations (both as client and provider)
const getUserNegotiations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status = 'all', type = 'all' } = req.query;

        let query = {
            $or: [
                { client: userId },
                { provider: userId }
            ]
        };

        if (status !== 'all') {
            query.status = status;
        }

        const negotiations = await Negotiation.find(query)
            .populate('service', 'title price category')
            .populate('client', 'name email')
            .populate('provider', 'name email')
            .populate('offers.fromUser', 'name')
            .populate('offers.toUser', 'name')
            .sort({ createdAt: -1 });

        // Filter by type if specified
        let filteredNegotiations = negotiations;
        if (type === 'client') {
            filteredNegotiations = negotiations.filter(n => n.client._id.toString() === userId);
        } else if (type === 'provider') {
            filteredNegotiations = negotiations.filter(n => n.provider._id.toString() === userId);
        }

        res.json({
            negotiations: filteredNegotiations
        });
    } catch (error) {
        console.error('Error getting user negotiations:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get specific negotiation details
const getNegotiationDetails = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const userId = req.user.id;

        const negotiation = await Negotiation.findById(negotiationId)
            .populate('service', 'title description price category')
            .populate('client', 'name email')
            .populate('provider', 'name email')
            .populate('offers.fromUser', 'name')
            .populate('offers.toUser', 'name');

        if (!negotiation) {
            return res.status(404).json({ message: 'Negotiation not found' });
        }

        // Check if user is part of this negotiation
        if (negotiation.client._id.toString() !== userId && negotiation.provider._id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to view this negotiation' });
        }

        res.json({
            negotiation
        });
    } catch (error) {
        console.error('Error getting negotiation details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Cancel a negotiation
const cancelNegotiation = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const negotiation = await Negotiation.findById(negotiationId);

        if (!negotiation) {
            return res.status(404).json({ message: 'Negotiation not found' });
        }

        // Check if user is part of this negotiation
        if (negotiation.client.toString() !== userId && negotiation.provider.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to cancel this negotiation' });
        }

        // Check if negotiation can be cancelled
        if (negotiation.status === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel a completed negotiation' });
        }

        negotiation.status = 'cancelled';
        
        // Add cancellation reason
        if (reason) {
            const toUser = userId === negotiation.client.toString() ? negotiation.provider : negotiation.client;
            negotiation.offers.push({
                fromUser: userId,
                toUser: toUser,
                offeredPrice: negotiation.currentOffer,
                message: `Negotiation cancelled: ${reason}`,
                status: 'declined'
            });
        }

        await negotiation.save();

        res.json({
            message: 'Negotiation cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling negotiation:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a negotiation (only for completed, cancelled, or expired negotiations)
const deleteNegotiation = async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const userId = req.user.id;

        console.log('🗑️ Delete request - Negotiation ID:', negotiationId, 'User ID:', userId);

        const negotiation = await Negotiation.findById(negotiationId);

        if (!negotiation) {
            console.log('❌ Negotiation not found:', negotiationId);
            return res.status(404).json({ message: 'Negotiation not found' });
        }

        console.log('📋 Found negotiation:', {
            id: negotiation._id,
            status: negotiation.status,
            client: negotiation.client,
            provider: negotiation.provider
        });

        // Check if user is part of this negotiation
        if (negotiation.client.toString() !== userId && negotiation.provider.toString() !== userId) {
            console.log('🚫 Authorization failed - User not part of negotiation');
            return res.status(403).json({ message: 'Not authorized to delete this negotiation' });
        }

        // Only allow deletion of non-active negotiations
        if (negotiation.status === 'active') {
            console.log('⚠️ Cannot delete active negotiation');
            return res.status(400).json({ 
                message: 'Cannot delete active negotiations. Please cancel the negotiation first.' 
            });
        }

        console.log('✅ Deleting negotiation:', negotiationId);
        // Delete the negotiation
        await Negotiation.findByIdAndDelete(negotiationId);

        console.log('🎉 Negotiation deleted successfully');
        res.json({
            message: 'Negotiation deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting negotiation:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    startNegotiation,
    makeCounterOffer,
    acceptOffer,
    declineOffer,
    getUserNegotiations,
    getNegotiationDetails,
    cancelNegotiation,
    deleteNegotiation
};
