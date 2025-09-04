// Centralized API configuration and helper functions
import { getToken, removeToken } from './auth';

// API Base URLs with environment variable fallback
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:5000';

// Centralized token handling - standardized to use 'token' key
export const getAuthToken = () => {
    return getToken(); // Use auth.js utility for consistency
};

// Get authentication headers
export const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    };
};

// API helper function for making authenticated requests
export const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, finalOptions);
        
        // Handle authentication errors
        if (response.status === 401) {
            removeToken(); // Clear invalid token
            throw new Error('Authentication required');
        }
        
        return response;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};

// Helper for JSON API requests
export const apiRequestJSON = async (endpoint, options = {}) => {
    const response = await apiRequest(endpoint, options);
    
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.message || `API Error (${response.status})`);
    }
    
    return await response.json();
};

// Common API endpoints
export const ENDPOINTS = {
    // Auth
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    
    // Services
    SERVICES: '/api/services',
    MY_SERVICES: '/api/services/my-services',
    ALL_MY_SERVICES: '/api/services/all-my-services',
    SERVICE_CATEGORIES: '/api/services/categories',
    
    // Bookings
    BOOKINGS: '/api/bookings',
    USER_BOOKINGS: '/api/bookings/user',
    PROVIDER_BOOKINGS: '/api/bookings/provider',
    
    // Negotiations
    NEGOTIATIONS: '/api/negotiations',
    START_NEGOTIATION: '/api/negotiations/start',
    
    // Notifications
    NOTIFICATIONS: '/api/notifications',
    
    // Location
    USER_LOCATION: '/api/location/user/location',
    NEARBY_SERVICES: '/api/location/services/nearby',
    
    // Instant Services
    INSTANT_SERVICES: '/api/instant-services',
    
    // Admin
    ADMIN: '/api/admin'
};