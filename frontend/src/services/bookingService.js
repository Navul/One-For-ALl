import { API_BASE_URL, getAuthToken, apiRequest, apiRequestJSON, ENDPOINTS } from '../utils/api';

// Unified booking function - handles both regular and negotiation bookings
export const createBooking = async (serviceId, scheduledDate, location, notes = '', negotiationId = null) => {
    try {
        console.log('🎯 FRONTEND: createBooking called with:', { 
            serviceId, 
            scheduledDate, 
            location, 
            notes, 
            negotiationId 
        });
        
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        
        // Decode token to get user ID like in Health-and-Fitness-Center
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const userId = decodedToken.id || decodedToken._id;
        
        const url = `${API_BASE_URL}/api/bookings`;
        console.log('🌐 FRONTEND: Making request to URL:', url);
        console.log('🔑 FRONTEND: API_BASE_URL:', API_BASE_URL);
        console.log('👤 FRONTEND: User ID from token:', userId);

        const requestData = {
            serviceId,
            date: scheduledDate,
            location,
            notes,
            userId // Add user ID to request like Health-and-Fitness-Center
        };

        // Add negotiation ID if booking from negotiation
        if (negotiationId) {
            requestData.negotiationId = negotiationId;
            console.log('🤝 Booking from negotiation');
        }

        console.log('📤 Sending unified booking data:', requestData);

        const response = await apiRequest(ENDPOINTS.BOOKINGS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });

        console.log('📡 Unified booking response status:', response.status);
        
        const data = await response.json();
        console.log('✅ Unified booking created successfully:', data);
        return data;
    } catch (error) {
        console.error('❌ Error creating unified booking:', error);
        throw error;
    }
};

// Legacy function for negotiation bookings - now uses unified system
export const createBookingFromNegotiation = async (negotiationId, scheduledDate, location, notes = '', serviceId) => {
    try {
        console.log('� Using unified booking system for negotiation');
        
        // If serviceId is not provided, we need to get it from the negotiation
        if (!serviceId) {
            // Get negotiation details to extract serviceId
            const negotiationResponse = await apiRequest(`${ENDPOINTS.NEGOTIATIONS}/${negotiationId}`);
            const negotiationData = await negotiationResponse.json();
            serviceId = negotiationData.service?._id || negotiationData.service;
        }
        
        // Use unified booking function
        return await createBooking(serviceId, scheduledDate, location, notes, negotiationId);
    } catch (error) {
        console.error('❌ Error creating booking from negotiation:', error);
        throw error;
    }
};

// Get user's bookings
export const getUserBookings = async () => {
    try {
        const response = await apiRequestJSON(ENDPOINTS.USER_BOOKINGS);
        return response.bookings || [];
    } catch (error) {
        console.error('Error fetching bookings:', error);
        throw error;
    }
};

// Update booking status
export const updateBookingStatus = async (bookingId, status) => {
    try {
        const data = await apiRequestJSON(`${ENDPOINTS.BOOKINGS}/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        return data;
    } catch (error) {
        console.error('Error updating booking status:', error);
        throw error;
    }
};

// Rate a completed service
export const rateService = async (bookingId, rating, review = '') => {
    try {
        const data = await apiRequestJSON(`${ENDPOINTS.BOOKINGS}/${bookingId}/rate`, {
            method: 'PUT',
            body: JSON.stringify({ 
                rating: {
                    score: rating,
                    review,
                    createdAt: new Date()
                }
            })
        });
        return data;
    } catch (error) {
        console.error('Error rating service:', error);
        throw error;
    }
};

// Get booking details by ID
export const getBookingById = async (bookingId) => {
    try {
        return await apiRequestJSON(`${ENDPOINTS.BOOKINGS}/${bookingId}`);
    } catch (error) {
        console.error('Error fetching booking details:', error);
        throw error;
    }
};
