import React, { useState, useEffect, useCallback } from 'react';
import locationService from '../services/locationService';
import GoogleMap from '../components/GoogleMap';
import LocationPermission from '../components/LocationPermission';

const InstantServices = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [instantServices, setInstantServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchRadius, setSearchRadius] = useState(10);
    const [selectedService, setSelectedService] = useState(null);
    const [bookingNotes, setBookingNotes] = useState('');
    const [urgencyLevel, setUrgencyLevel] = useState('normal');
    const [showBookingModal, setShowBookingModal] = useState(false);
    
    // Manual location input states
    const [showManualLocation, setShowManualLocation] = useState(false);
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');
    
    // Map click mode for location selection
    const [mapClickMode, setMapClickMode] = useState(false);

    const categories = [
        { id: 'all', name: 'All Services', icon: '🔍' },
        { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
        { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
        { id: 'electrical', name: 'Electrical', icon: '⚡' },
        { id: 'handyman', name: 'Handyman', icon: '🔨' },
        { id: 'automotive', name: 'Automotive', icon: '🚗' },
        { id: 'beauty', name: 'Beauty', icon: '💄' },
        { id: 'fitness', name: 'Fitness', icon: '💪' }
    ];

    const fetchInstantServices = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const options = {
                radius: searchRadius,
                instantOnly: true
            };

            if (selectedCategory !== 'all') {
                options.category = selectedCategory;
            }

            // Use user location if available, otherwise fetch all services
            let latitude = null, longitude = null;
            if (userLocation && userLocation.lat && userLocation.lng) {
                latitude = userLocation.lat;
                longitude = userLocation.lng;
                console.log('Using user location for search:', latitude, longitude);
            } else {
                console.log('No user location, fetching all available services');
            }

            const response = await locationService.getAvailableInstantServices(
                latitude,
                longitude,
                options
            );

            console.log('API Response:', response); // Debug log
            setInstantServices(response.services || []);
        } catch (err) {
            console.error('Error fetching instant services:', err);
            console.log('Current token:', localStorage.getItem('authToken')); // Debug log
            console.log('User location:', userLocation); // Debug log
            console.log('API call options:', { searchRadius, selectedCategory }); // Debug log
            
            if (err.message.includes('Token') || err.message.includes('Access denied') || err.message.includes('Authentication')) {
                // Try to clear bad token and reload page
                localStorage.removeItem('authToken');
                setError('Authentication issue detected. Please refresh the page to continue browsing without login.');
            } else {
                setError('Failed to load instant services: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [userLocation, searchRadius, selectedCategory]);

    useEffect(() => {
        // Always try to fetch services, whether we have user location or not
        fetchInstantServices();
    }, [selectedCategory, searchRadius, fetchInstantServices]);

    // Also fetch when user location becomes available
    useEffect(() => {
        if (userLocation) {
            fetchInstantServices();
        }
    }, [userLocation, fetchInstantServices]);

    const handleLocationGranted = (location) => {
        console.log('Location granted:', location); // Debug log
        setUserLocation({
            lat: location.latitude,
            lng: location.longitude
        });
        console.log('User location set to:', { lat: location.latitude, lng: location.longitude }); // Debug log
    };

    // Handle manual location input
    const handleManualLocation = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        
        if (isNaN(lat) || isNaN(lng)) {
            alert('Please enter valid numbers for latitude and longitude');
            return;
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            alert('Please enter valid coordinates:\nLatitude: -90 to 90\nLongitude: -180 to 180');
            return;
        }

        setUserLocation({
            lat: lat,
            lng: lng
        });
        
        console.log('Manual location set:', { lat, lng });
        setShowManualLocation(false);
        setManualLat('');
        setManualLng('');
        alert('Location set successfully!');
    };

    // Preset locations for quick selection
    const handlePresetLocation = (name, lat, lng) => {
        setUserLocation({ lat, lng });
        console.log(`Preset location set to ${name}:`, { lat, lng });
        setShowManualLocation(false);
        alert(`Location set to ${name}!`);
    };

    // Handle map click for location selection
    const handleMapClick = (location) => {
        if (mapClickMode) {
            setUserLocation({
                lat: location.latitude,
                lng: location.longitude
            });
            console.log('Map click location set:', { lat: location.latitude, lng: location.longitude });
            setMapClickMode(false);
            setShowManualLocation(false);
            alert(`Location set to: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
        }
    };

    const handleServiceBook = (service) => {
        setSelectedService(service);
        setShowBookingModal(true);
    };

    const handleBookingConfirm = async () => {
        if (!selectedService || !userLocation) return;

        // Check if user is logged in
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please log in to book services. You can browse services without logging in, but booking requires authentication.');
            return;
        }

        setLoading(true);
        try {
            const address = await locationService.getAddressFromCoordinates(
                userLocation.lat,
                userLocation.lng
            );

            const response = await locationService.requestInstantService(
                selectedService._id,
                userLocation.lat,
                userLocation.lng,
                address,
                bookingNotes,
                urgencyLevel
            );

            alert(`Instant service requested successfully! 
                   Booking ID: ${response.booking._id}
                   Provider will contact you shortly.`);

            setShowBookingModal(false);
            setSelectedService(null);
            setBookingNotes('');
            fetchInstantServices(); // Refresh services
        } catch (err) {
            setError('Failed to book service: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'emergency': return '#dc3545';
            case 'urgent': return '#fd7e14';
            default: return '#28a745';
        }
    };

    return (
        <div className="instant-services-container">
            <div className="header">
                <h1>⚡ Instant Services</h1>
                <p>{userLocation ? `Available services within ${searchRadius}km` : 'Available instant services'}</p>
                {userLocation ? (
                    <div className="location-status" style={{
                        backgroundColor: '#e8f5e8', 
                        padding: '8px 12px', 
                        borderRadius: '5px', 
                        margin: '10px 0',
                        color: '#2d5a2d',
                        fontSize: '14px'
                    }}>
                        📍 Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        {instantServices.length === 0 && !loading && (
                            <span style={{color: '#856404', fontStyle: 'italic'}}> - No services found in your area. Showing all available services below.</span>
                        )}
                        
                        {/* Change Location Button */}
                        <div style={{ marginTop: '8px' }}>
                            <button
                                onClick={() => setShowManualLocation(!showManualLocation)}
                                style={{
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    marginRight: '5px'
                                }}
                            >
                                📍 Change Location
                            </button>
                            <span style={{ fontSize: '11px', color: '#666' }}>
                                (PC location might be inaccurate)
                            </span>
                        </div>
                        
                        {/* Manual Location Input */}
                        {showManualLocation && (
                            <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '12px', color: '#495057', marginBottom: '5px', fontWeight: 'bold' }}>
                                    🎯 Set Accurate Location:
                                </div>
                                
                                {/* Map Click Option */}
                                <div style={{ marginBottom: '8px' }}>
                                    <button
                                        onClick={() => {
                                            setMapClickMode(true);
                                            setShowManualLocation(false);
                                        }}
                                        style={{
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            padding: '5px 10px',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            width: '100%',
                                            marginBottom: '5px'
                                        }}
                                    >
                                        🎯 Click on Map to Set Location
                                    </button>
                                    <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
                                        Most accurate - just click where you are on the map!
                                    </div>
                                </div>
                                
                                <div style={{ borderTop: '1px solid #ddd', paddingTop: '8px', marginBottom: '8px' }}></div>
                                
                                <div style={{ marginBottom: '8px' }}>
                                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>Quick Presets:</div>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        <button onClick={() => handlePresetLocation('Savar', 23.8459, 90.2577)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '2px', fontSize: '10px', cursor: 'pointer' }}>
                                            Savar ⭐
                                        </button>
                                        <button onClick={() => handlePresetLocation('Dhanmondi', 23.7461, 90.3742)} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '2px', fontSize: '10px', cursor: 'pointer' }}>
                                            Dhanmondi
                                        </button>
                                        <button onClick={() => handlePresetLocation('Gulshan', 23.7925, 90.4077)} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '2px', fontSize: '10px', cursor: 'pointer' }}>
                                            Gulshan
                                        </button>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        placeholder="Latitude"
                                        value={manualLat}
                                        onChange={(e) => setManualLat(e.target.value)}
                                        style={{
                                            padding: '3px 5px',
                                            border: '1px solid #ccc',
                                            borderRadius: '2px',
                                            fontSize: '11px',
                                            width: '80px'
                                        }}
                                    />
                                    <input
                                        type="number"
                                        step="0.000001"
                                        placeholder="Longitude"
                                        value={manualLng}
                                        onChange={(e) => setManualLng(e.target.value)}
                                        style={{
                                            padding: '3px 5px',
                                            border: '1px solid #ccc',
                                            borderRadius: '2px',
                                            fontSize: '11px',
                                            width: '80px'
                                        }}
                                    />
                                    <button onClick={handleManualLocation} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '3px 6px', borderRadius: '2px', cursor: 'pointer', fontSize: '10px' }}>
                                        Set
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="location-status" style={{
                        backgroundColor: '#fff8dc', 
                        padding: '8px 12px', 
                        borderRadius: '5px', 
                        margin: '10px 0',
                        color: '#856404',
                        fontSize: '14px'
                    }}>
                        📍 Location access not granted. Showing all available services. 
                        <LocationPermission 
                            onLocationGranted={handleLocationGranted}
                            autoRequest={false}
                            showToggle={true}
                        />
                        
                        {/* Manual Location Input for PC users */}
                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f4f8', borderRadius: '5px', border: '1px solid #b3d9ff' }}>
                            <div style={{ marginBottom: '8px', color: '#0066cc', fontWeight: 'bold' }}>
                                🖥️ PC Location Setup (No GPS Required)
                            </div>
                            
                            {!showManualLocation ? (
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                                        💡 PCs don't have GPS like phones. Set your location manually:
                                    </div>
                                    <button
                                        onClick={() => setShowManualLocation(true)}
                                        style={{
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                    >
                                        📍 Set Manual Location
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {/* Map Click Option */}
                                    <div style={{ marginBottom: '10px' }}>
                                        <button
                                            onClick={() => {
                                                setMapClickMode(true);
                                                setShowManualLocation(false);
                                            }}
                                            style={{
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 12px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                width: '100%',
                                                marginBottom: '5px'
                                            }}
                                        >
                                            🎯 Click on Map to Set Location
                                        </button>
                                        <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
                                            Most accurate method - just click where you are on the map below!
                                        </div>
                                    </div>
                                    
                                    <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginBottom: '10px' }}></div>
                                    
                                    <div style={{ marginBottom: '10px' }}>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                                            🎯 Quick Presets:
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                            <button onClick={() => handlePresetLocation('Savar', 23.8459, 90.2577)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>
                                                Savar ⭐
                                            </button>
                                            <button onClick={() => handlePresetLocation('Dhaka (Dhanmondi)', 23.7461, 90.3742)} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>
                                                Dhanmondi
                                            </button>
                                            <button onClick={() => handlePresetLocation('Dhaka (Gulshan)', 23.7925, 90.4077)} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>
                                                Gulshan
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            placeholder="Latitude (e.g., 23.8459)"
                                            value={manualLat}
                                            onChange={(e) => setManualLat(e.target.value)}
                                            style={{
                                                padding: '4px 6px',
                                                border: '1px solid #ccc',
                                                borderRadius: '3px',
                                                fontSize: '12px',
                                                width: '140px'
                                            }}
                                        />
                                        <input
                                            type="number"
                                            step="0.000001"
                                            placeholder="Longitude (e.g., 90.2577)"
                                            value={manualLng}
                                            onChange={(e) => setManualLng(e.target.value)}
                                            style={{
                                                padding: '4px 6px',
                                                border: '1px solid #ccc',
                                                borderRadius: '3px',
                                                fontSize: '12px',
                                                width: '140px'
                                            }}
                                        />
                                        <button
                                            onClick={handleManualLocation}
                                            style={{
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                padding: '4px 8px',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Set
                                        </button>
                                        <button
                                            onClick={() => setShowManualLocation(false)}
                                            style={{
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                padding: '4px 8px',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    
                                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                                        💡 Find coordinates: Right-click on Google Maps → "What's here?"
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-group">
                    <label>Category:</label>
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="filter-select"
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Search Radius:</label>
                    <select 
                        value={searchRadius} 
                        onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                        className="filter-select"
                    >
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                        <option value={15}>15 km</option>
                        <option value={25}>25 km</option>
                    </select>
                </div>

                <button onClick={fetchInstantServices} className="refresh-btn" disabled={loading}>
                    {loading ? '🔄' : '🔍'} {loading ? 'Searching...' : 'Refresh'}
                </button>
                
                {/* Debug button for testing */}
                <button 
                    onClick={() => {
                        console.log('=== DEBUG INFO ===');
                        console.log('User location:', userLocation);
                        console.log('Token:', localStorage.getItem('authToken'));
                        console.log('Selected category:', selectedCategory);
                        console.log('Search radius:', searchRadius);
                        console.log('Services count:', instantServices.length);
                        console.log('Services:', instantServices);
                        console.log('Error:', error);
                        console.log('Loading:', loading);
                        
                        // Test direct API call
                        console.log('Testing direct API call...');
                        fetch('/api/location/instant/available')
                            .then(r => {
                                console.log('API Response status:', r.status);
                                return r.json();
                            })
                            .then(data => console.log('Direct API test result:', data))
                            .catch(e => console.error('Direct API test error:', e));
                    }}
                    style={{
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginLeft: '10px',
                        fontSize: '12px'
                    }}
                >
                    🐛 Debug
                </button>
            </div>

            {error && (
                <div className="error-message" style={{
                    backgroundColor: '#f8d7da', 
                    color: '#721c24', 
                    padding: '12px', 
                    borderRadius: '5px',
                    margin: '10px 0',
                    border: '1px solid #f5c6cb'
                }}>
                    <strong>ℹ️ {error}</strong>
                    {error.includes('Authentication') && (
                        <div style={{marginTop: '8px', fontSize: '14px'}}>
                            <p>• You can browse services without logging in</p>
                            <p>• Login is only required for booking services</p>
                            <button 
                                onClick={() => {setError(''); window.location.reload();}} 
                                style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    marginTop: '5px'
                                }}
                            >
                                Refresh Page
                            </button>
                        </div>
                    )}
                    {error.includes('log in') && (
                        <div className="login-prompt">
                            <a href="/login" className="login-link">Go to Login Page</a> | 
                            <a href="/signup" className="login-link">Sign Up</a>
                        </div>
                    )}
                </div>
            )}

            <div className="content-grid">
                {/* Map Section */}
                <div className="map-section">
                    {/* Map Click Instructions */}
                    {mapClickMode && (
                        <div style={{
                            backgroundColor: '#d4edda',
                            border: '1px solid #c3e6cb',
                            borderRadius: '5px',
                            padding: '10px',
                            marginBottom: '10px',
                            color: '#155724',
                            textAlign: 'center'
                        }}>
                            🎯 <strong>Click on the map to set your location!</strong>
                            <div style={{ fontSize: '12px', marginTop: '5px' }}>
                                Click anywhere on the map to mark your exact location
                                <button 
                                    onClick={() => setMapClickMode(false)}
                                    style={{
                                        marginLeft: '10px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <GoogleMap
                        center={userLocation || (instantServices.length > 0 ? {
                            lat: instantServices[0].location?.coordinates?.[1] || 0,
                            lng: instantServices[0].location?.coordinates?.[0] || 0
                        } : { lat: 23.8459, lng: 90.2577 })}
                        services={instantServices}
                        height="400px"
                        showUserLocation={!!userLocation}
                        userLocation={userLocation}
                        onLocationSelect={handleMapClick}
                        style={{
                            cursor: mapClickMode ? 'crosshair' : 'default',
                            border: mapClickMode ? '3px solid #28a745' : '1px solid #ddd'
                        }}
                    />
                </div>

                {/* Services List */}
                <div className="services-section">
                    <h3>Available Instant Services ({instantServices.length})</h3>
                    
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner-large"></div>
                            <p>Finding instant services...</p>
                        </div>
                    ) : instantServices.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">😔</div>
                            <h4>No instant services available</h4>
                            <p>Try expanding your search radius or selecting a different category.</p>
                        </div>
                    ) : (
                        <div className="services-grid">
                            {instantServices.map(service => (
                                <div key={service._id} className="service-card instant">
                                    <div className="service-header">
                                        <h4>{service.title}</h4>
                                        <span className="instant-badge">⚡ INSTANT</span>
                                    </div>
                                    
                                    <p className="service-description">{service.description}</p>
                                    
                                    <div className="service-details">
                                        <div className="detail-row">
                                            <span className="label">Price:</span>
                                            <span className="value price">{formatPrice(service.price)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Distance:</span>
                                            <span className="value">{service.distance}km away</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Response Time:</span>
                                            <span className="value response-time">{service.responseTime}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Provider:</span>
                                            <span className="value">{service.provider.name}</span>
                                        </div>
                                        {service.rating?.averageRating > 0 && (
                                            <div className="detail-row">
                                                <span className="label">Rating:</span>
                                                <span className="value rating">
                                                    ⭐ {service.rating.averageRating.toFixed(1)} 
                                                    ({service.rating.totalReviews} reviews)
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        className="book-btn instant"
                                        onClick={() => handleServiceBook(service)}
                                        disabled={loading}
                                    >
                                        ⚡ Book Instantly
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && selectedService && (
                <div className="modal-overlay">
                    <div className="booking-modal">
                        <div className="modal-header">
                            <h3>⚡ Book Instant Service</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowBookingModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-content">
                            <div className="service-summary">
                                <h4>{selectedService.title}</h4>
                                <p>Provider: {selectedService.provider.name}</p>
                                <p>Price: {formatPrice(selectedService.price)}</p>
                                <p>Response Time: {selectedService.responseTime}</p>
                            </div>

                            <div className="form-group">
                                <label>Urgency Level:</label>
                                <div className="urgency-options">
                                    {['normal', 'urgent', 'emergency'].map(level => (
                                        <label key={level} className="urgency-option">
                                            <input
                                                type="radio"
                                                name="urgency"
                                                value={level}
                                                checked={urgencyLevel === level}
                                                onChange={(e) => setUrgencyLevel(e.target.value)}
                                            />
                                            <span 
                                                className="urgency-label"
                                                style={{ borderColor: getUrgencyColor(level) }}
                                            >
                                                {level === 'normal' && '🟢 Normal'}
                                                {level === 'urgent' && '🟡 Urgent'}
                                                {level === 'emergency' && '🔴 Emergency'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Additional Notes (Optional):</label>
                                <textarea
                                    value={bookingNotes}
                                    onChange={(e) => setBookingNotes(e.target.value)}
                                    placeholder="Describe your specific needs, access instructions, or any other relevant details..."
                                    rows={3}
                                    className="notes-textarea"
                                />
                            </div>

                            <div className="modal-actions">
                                <button 
                                    className="cancel-btn"
                                    onClick={() => setShowBookingModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="confirm-btn"
                                    onClick={handleBookingConfirm}
                                    disabled={loading}
                                >
                                    {loading ? 'Booking...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .instant-services-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .header h1 {
                    color: #333;
                    margin-bottom: 10px;
                }

                .header p {
                    color: #666;
                    font-size: 16px;
                }

                .filters-section {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .filter-group label {
                    font-weight: 500;
                    color: #333;
                    font-size: 14px;
                }

                .filter-select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }

                .refresh-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }

                .refresh-btn:hover:not(:disabled) {
                    background: #0056b3;
                }

                .refresh-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .error-message {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    border-left: 4px solid #dc3545;
                }

                .login-prompt {
                    margin-top: 10px;
                    font-size: 14px;
                }

                .login-link {
                    color: #0056b3;
                    text-decoration: none;
                    margin: 0 5px;
                    font-weight: 500;
                }

                .login-link:hover {
                    text-decoration: underline;
                }

                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-top: 20px;
                }

                @media (max-width: 768px) {
                    .content-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .map-section, .services-section {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }

                .services-section h3 {
                    margin: 0 0 20px 0;
                    color: #333;
                }

                .loading-state {
                    text-align: center;
                    padding: 40px 20px;
                }

                .spinner-large {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #007bff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                }

                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .empty-state h4 {
                    margin: 0 0 8px 0;
                    color: #333;
                }

                .empty-state p {
                    color: #666;
                    margin: 0;
                }

                .services-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .service-card {
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    padding: 16px;
                    transition: all 0.2s ease;
                }

                .service-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }

                .service-card.instant {
                    border-left: 4px solid #ff4757;
                    background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
                }

                .service-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .service-header h4 {
                    margin: 0;
                    color: #333;
                }

                .instant-badge {
                    background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .service-description {
                    color: #666;
                    margin: 0 0 16px 0;
                    font-size: 14px;
                    line-height: 1.4;
                }

                .service-details {
                    margin-bottom: 16px;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }

                .detail-row .label {
                    color: #666;
                    font-size: 13px;
                }

                .detail-row .value {
                    font-weight: 500;
                    color: #333;
                    font-size: 13px;
                }

                .detail-row .value.price {
                    color: #28a745;
                    font-weight: bold;
                }

                .detail-row .value.response-time {
                    color: #ff4757;
                    font-weight: bold;
                }

                .detail-row .value.rating {
                    color: #ffc107;
                }

                .book-btn {
                    width: 100%;
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .book-btn.instant {
                    background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
                    color: white;
                }

                .book-btn.instant:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
                }

                .book-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .booking-modal {
                    background: white;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #e9ecef;
                }

                .modal-header h3 {
                    margin: 0;
                    color: #333;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .close-btn:hover {
                    color: #333;
                }

                .modal-content {
                    padding: 20px;
                }

                .service-summary {
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .service-summary h4 {
                    margin: 0 0 8px 0;
                    color: #333;
                }

                .service-summary p {
                    margin: 4px 0;
                    color: #666;
                    font-size: 14px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #333;
                }

                .urgency-options {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .urgency-option {
                    cursor: pointer;
                }

                .urgency-option input {
                    display: none;
                }

                .urgency-label {
                    display: inline-block;
                    padding: 8px 16px;
                    border: 2px solid #ddd;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .urgency-option input:checked + .urgency-label {
                    background: rgba(0, 123, 255, 0.1);
                }

                .notes-textarea {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    resize: vertical;
                    font-family: inherit;
                    font-size: 14px;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 24px;
                }

                .cancel-btn, .confirm-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                }

                .cancel-btn {
                    background: #6c757d;
                    color: white;
                }

                .cancel-btn:hover {
                    background: #545b62;
                }

                .confirm-btn {
                    background: #007bff;
                    color: white;
                }

                .confirm-btn:hover:not(:disabled) {
                    background: #0056b3;
                }

                .confirm-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default InstantServices;
