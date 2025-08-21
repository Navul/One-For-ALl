const express = require('express');
const router = express.Router();
const {
    startNegotiation,
    makeCounterOffer,
    acceptOffer,
    declineOffer,
    getUserNegotiations,
    getNegotiationDetails,
    cancelNegotiation,
    deleteNegotiation
} = require('../controllers/negotiationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Start a new negotiation
router.post('/start', startNegotiation);

// Get user's negotiations
router.get('/', getUserNegotiations);

// Get specific negotiation details
router.get('/:negotiationId', getNegotiationDetails);

// Make a counter offer
router.post('/:negotiationId/counter-offer', makeCounterOffer);

// Accept an offer
router.post('/:negotiationId/accept', acceptOffer);

// Decline an offer
router.post('/:negotiationId/decline', declineOffer);

// Cancel a negotiation
router.post('/:negotiationId/cancel', cancelNegotiation);

// Delete a negotiation (only completed or cancelled)
router.delete('/:negotiationId', deleteNegotiation);

module.exports = router;
