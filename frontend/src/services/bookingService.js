const API_BASE_URL = process.env.REACT_APP_API_URL;

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

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

        const response = await fetch(`${API_BASE_URL}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });

        console.log('📡 Unified booking response status:', response.status);
        
        if (!response.ok) {
            // Get error details like Health-and-Fitness-Center
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // If response is not JSON (like HTML error page), create a generic error
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            console.log('❌ Booking error response:', errorData);
            throw new Error(errorData.message || `Failed to create booking (${response.status})`);
        }

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
            const token = getAuthToken();
            const negotiationResponse = await fetch(`${API_BASE_URL}/api/negotiations/${negotiationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!negotiationResponse.ok) {
                throw new Error('Failed to fetch negotiation details');
            }
            
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
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/api/bookings/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to fetch bookings');
        }

        const data = await response.json();
        return data.bookings || [];
    } catch (error) {
        console.error('Error fetching bookings:', error);
        throw error;
    }
};

// Update booking status
export const updateBookingStatus = async (bookingId, status) => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update booking status');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating booking status:', error);
        throw error;
    }
};

// Rate a completed service
export const rateService = async (bookingId, rating, review = '') => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/rate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                rating: {
                    score: rating,
                    review,
                    createdAt: new Date()
                }
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to rate service');
        }

        return await response.json();
    } catch (error) {
        console.error('Error rating service:', error);
        throw error;
    }
};

// Get booking details by ID
export const getBookingById = async (bookingId) => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to fetch booking details');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching booking details:', error);
        throw error;
    }
};
