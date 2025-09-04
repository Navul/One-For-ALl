const API_BASE_URL = process.env.REACT_APP_API_URL;

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Start a new negotiation
export const startNegotiation = async (serviceId, initialOffer, message, location, scheduledDate, notes) => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/api/negotiations/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                serviceId,
                initialOffer,
                message,
                location,
                scheduledDate,
                notes
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to start negotiation');
        }

        return data;
    } catch (error) {
        console.error('Error starting negotiation:', error);
        throw error;
    }
};

// Make a counter offer
export const makeCounterOffer = async (negotiationId, counterOffer, message) => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/api/negotiations/${negotiationId}/counter-offer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                counterOffer,
                message
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to make counter offer');
        }

        return data;
    } catch (error) {
        console.error('Error making counter offer:', error);
        throw error;
    }
};

// Accept an offer
export const acceptOffer = async (negotiationId) => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/api/negotiations/${negotiationId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to accept offer');
        }

        return data;
    } catch (error) {
        console.error('Error accepting offer:', error);
        throw error;
    }
};

// Decline an offer
export const declineOffer = async (negotiationId, reason) => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/api/negotiations/${negotiationId}/decline`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                reason
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to decline offer');
        }

        return data;
    } catch (error) {
        console.error('Error declining offer:', error);
        throw error;
    }
};

// Get user's negotiations
export const getUserNegotiations = async (status = 'all', type = 'all') => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const params = new URLSearchParams();
        if (status !== 'all') params.append('status', status);
        if (type !== 'all') params.append('type', type);

        const response = await fetch(`${API_BASE_URL}/api/negotiations?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get negotiations');
        }

        return data;
    } catch (error) {
        console.error('Error getting negotiations:', error);
        throw error;
    }
};

// Get specific negotiation details
export const getNegotiationDetails = async (negotiationId) => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/api/negotiations/${negotiationId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get negotiation details');
        }

        return data;
    } catch (error) {
        console.error('Error getting negotiation details:', error);
        throw error;
    }
};

// Cancel a negotiation
export const cancelNegotiation = async (negotiationId, reason) => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/api/negotiations/${negotiationId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                reason
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to cancel negotiation');
        }

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
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const url = `${API_BASE_URL}/api/negotiations/${negotiationId}`;
        console.log('🌐 DELETE URL:', url);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📡 Delete response status:', response.status);
        const data = await response.json();
        console.log('📄 Delete response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete negotiation');
        }

        return data;
    } catch (error) {
        console.error('❌ Error deleting negotiation:', error);
        throw error;
    }
};
