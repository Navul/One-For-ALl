import { getAuthToken, apiRequest, apiRequestJSON, ENDPOINTS } from '../utils/api';

// Start a new negotiation
export const startNegotiation = async (serviceId, initialOffer, message, location, scheduledDate, notes) => {
    try {
        const data = await apiRequestJSON(ENDPOINTS.START_NEGOTIATION, {
            method: 'POST',
            body: JSON.stringify({
                serviceId,
                initialOffer,
                message,
                location,
                scheduledDate,
                notes
            })
        });
        return data;
    } catch (error) {
        console.error('Error starting negotiation:', error);
        throw error;
    }
};

// Make a counter offer
export const makeCounterOffer = async (negotiationId, counterOffer, message) => {
    try {
        const data = await apiRequestJSON(`${ENDPOINTS.NEGOTIATIONS}/${negotiationId}/counter-offer`, {
            method: 'POST',
            body: JSON.stringify({
                counterOffer,
                message
            })
        });
        return data;
    } catch (error) {
        console.error('Error making counter offer:', error);
        throw error;
    }
};

// Accept an offer
export const acceptOffer = async (negotiationId) => {
    try {
        const data = await apiRequestJSON(`${ENDPOINTS.NEGOTIATIONS}/${negotiationId}/accept`, {
            method: 'POST'
        });
        return data;
    } catch (error) {
        console.error('Error accepting offer:', error);
        throw error;
    }
};

// Decline an offer
export const declineOffer = async (negotiationId, reason) => {
    try {
        const data = await apiRequestJSON(`${ENDPOINTS.NEGOTIATIONS}/${negotiationId}/decline`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        return data;
    } catch (error) {
        console.error('Error declining offer:', error);
        throw error;
    }
};

// Get user's negotiations
export const getUserNegotiations = async (status = 'all', type = 'all') => {
    try {
        const params = new URLSearchParams();
        if (status !== 'all') params.append('status', status);
        if (type !== 'all') params.append('type', type);

        const data = await apiRequestJSON(`${ENDPOINTS.NEGOTIATIONS}?${params.toString()}`);
        return data;
    } catch (error) {
        console.error('Error getting negotiations:', error);
        throw error;
    }
};

// Get specific negotiation details
export const getNegotiationDetails = async (negotiationId) => {
    try {
        const data = await apiRequestJSON(`${ENDPOINTS.NEGOTIATIONS}/${negotiationId}`);
        return data;
    } catch (error) {
        console.error('Error getting negotiation details:', error);
        throw error;
    }
};

// Cancel a negotiation
export const cancelNegotiation = async (negotiationId, reason) => {
    try {
        const data = await apiRequestJSON(`${ENDPOINTS.NEGOTIATIONS}/${negotiationId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        return data;
    } catch (error) {
        console.error('Error cancelling negotiation:', error);
        throw error;
    }
};

// Delete a negotiation (only completed or cancelled)
export const deleteNegotiation = async (negotiationId) => {
    try {
        console.log('🗑️ Deleting negotiation:', negotiationId);
        
        const response = await apiRequest(`${ENDPOINTS.NEGOTIATIONS}/${negotiationId}`, {
            method: 'DELETE'
        });

        console.log('📡 Delete response status:', response.status);
        const data = await response.json();
        console.log('📄 Delete response data:', data);
        
        return data;
    } catch (error) {
        console.error('❌ Error deleting negotiation:', error);
        throw error;
    }
};
