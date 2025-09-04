// Location service for handling geolocation and maps functionality

class LocationService {
    constructor() {
        this.watchId = null;
        this.currentPosition = null;
    }

    // Get current position
    getCurrentPosition(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            const defaultOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
                ...options
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentPosition = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    };
                    resolve(this.currentPosition);
                },
                (error) => {
                    let errorMessage = 'Unable to get location';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access denied by user';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out';
                            break;
                        default:
                            errorMessage = 'Unknown location error';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                defaultOptions
            );
        });
    }

    // Watch position changes
    watchPosition(callback, options = {}) {
        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by this browser');
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 30000,
            ...options
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };
                callback(this.currentPosition);
            },
            (error) => {
                console.error('Watch position error:', error);
            },
            defaultOptions
        );

        return this.watchId;
    }

    // Stop watching position
    clearWatch() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    // Calculate distance between two points (in kilometers)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in kilometers
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }

    // Convert degrees to radians
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Format distance for display
    formatDistance(distance) {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        }
        return `${distance}km`;
    }

    // Get address from coordinates (reverse geocoding)
    async getAddressFromCoordinates(latitude, longitude) {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                return data.results[0].formatted_address;
            }
            return 'Address not found';
        } catch (error) {
            console.error('Error getting address:', error);
            return 'Address not available';
        }
    }

    // Get coordinates from address (geocoding)
    async getCoordinatesFromAddress(address) {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                return {
                    latitude: location.lat,
                    longitude: location.lng
                };
            }
            throw new Error('Address not found');
        } catch (error) {
            console.error('Error getting coordinates:', error);
            throw error;
        }
    }

    // API calls for location-related endpoints
    async updateUserLocation(latitude, longitude, address) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/location/user/location`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    latitude,
                    longitude,
                    address
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update location');
            }
            return data;
        } catch (error) {
            console.error('Error updating user location:', error);
            throw error;
        }
    }

    async toggleLocationSharing(enabled) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/location/user/location/toggle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ enabled })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to toggle location sharing');
            }
            return data;
        } catch (error) {
            console.error('Error toggling location sharing:', error);
            throw error;
        }
    }

    async getNearbyServices(latitude, longitude, options = {}) {
        try {
            const token = localStorage.getItem('authToken');
            const params = new URLSearchParams({
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                ...options
            });

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/location/services/nearby?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get nearby services');
            }
            return data;
        } catch (error) {
            console.error('Error getting nearby services:', error);
            throw error;
        }
    }

    async getAvailableInstantServices(latitude, longitude, options = {}) {
        try {
            const token = localStorage.getItem('authToken');
            const params = new URLSearchParams({
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                ...options
            });

            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Only add auth header if token exists and is not empty
            if (token && token.trim() !== '') {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/location/instant/available?${params}`, {
                headers
            });

            const data = await response.json();
            if (!response.ok) {
                // If it's a token error, try removing the bad token and retrying without auth
                if (data.message && data.message.includes('Token') && token) {
                    localStorage.removeItem('authToken');
                    // Retry without token
                    const retryResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/location/instant/available?${params}`, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const retryData = await retryResponse.json();
                    if (!retryResponse.ok) {
                        throw new Error(retryData.message || 'Failed to get available instant services');
                    }
                    return retryData;
                }
                throw new Error(data.message || 'Failed to get available instant services');
            }
            return data;
        } catch (error) {
            console.error('Error getting available instant services:', error);
            throw error;
        }
    }

    async requestInstantService(serviceId, latitude, longitude, address, notes = '', urgency = 'normal') {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/location/instant/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    serviceId,
                    latitude,
                    longitude,
                    address,
                    notes,
                    urgency
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to request instant service');
            }
            return data;
        } catch (error) {
            console.error('Error requesting instant service:', error);
            throw error;
        }
    }
}

const locationService = new LocationService();
export default locationService;
