import React, { useState, useEffect } from 'react';
import locationService from '../services/locationService';
import GoogleMap from './GoogleMap';

const ProviderLocationManager = ({ onLocationUpdate }) => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [instantServiceEnabled, setInstantServiceEnabled] = useState(false);
    const [serviceRadius, setServiceRadius] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Check if provider already has location enabled
        checkCurrentSettings();
    }, []);

    const checkCurrentSettings = async () => {
        try {
            // You would get this from your user API
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.location?.isLocationEnabled) {
                setLocationEnabled(true);
                setCurrentLocation({
                    lat: userData.location.coordinates[1],
                    lng: userData.location.coordinates[0]
                });
            }
            if (userData.instantServiceAvailable) {
                setInstantServiceEnabled(true);
            }
            if (userData.serviceRadius) {
                setServiceRadius(userData.serviceRadius);
            }
        } catch (err) {
            console.error('Error checking current settings:', err);
        }
    };

    const handleEnableLocation = async () => {
        setLoading(true);
        setError('');

        try {
            const position = await locationService.getCurrentPosition();
            
            // Update location on backend
            const response = await locationService.updateUserLocation(
                position.latitude,
                position.longitude,
                await locationService.getAddressFromCoordinates(position.latitude, position.longitude)
            );

            setCurrentLocation({
                lat: position.latitude,
                lng: position.longitude
            });
            setLocationEnabled(true);
            setSuccess('Location enabled successfully!');

            if (onLocationUpdate) {
                onLocationUpdate(position);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLocationSharing = async (enabled) => {
        setLoading(true);
        setError('');

        try {
            await locationService.toggleLocationSharing(enabled);
            setLocationEnabled(enabled);
            
            if (!enabled) {
                setCurrentLocation(null);
                setInstantServiceEnabled(false);
                await toggleInstantService(false);
            }

            setSuccess(`Location sharing ${enabled ? 'enabled' : 'disabled'}!`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleInstantService = async (enabled) => {
        if (enabled && !locationEnabled) {
            setError('Please enable location sharing first');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/location/instant/provider/toggle', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ available: enabled })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update instant service setting');
            }

            setInstantServiceEnabled(enabled);
            setSuccess(`Instant service ${enabled ? 'enabled' : 'disabled'}!`);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateServiceRadius = async (radius) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ serviceRadius: radius })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update service radius');
            }

            setServiceRadius(radius);
            setSuccess('Service radius updated!');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="provider-location-manager">
            <div className="location-header">
                <h3>📍 Location & Instant Services</h3>
                <p>Manage your location settings and instant service availability</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    ❌ {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    ✅ {success}
                </div>
            )}

            <div className="location-controls">
                {!locationEnabled ? (
                    <div className="enable-location-section">
                        <div className="info-card">
                            <h4>Enable Location Services</h4>
                            <p>Allow customers to find you for instant services</p>
                            <ul>
                                <li>📍 Appear in nearby searches</li>
                                <li>⚡ Offer instant services</li>
                                <li>🎯 Get location-based bookings</li>
                                <li>📈 Increase visibility</li>
                            </ul>
                        </div>
                        
                        <button 
                            className="enable-btn"
                            onClick={handleEnableLocation}
                            disabled={loading}
                        >
                            {loading ? 'Enabling...' : 'Enable Location Services'}
                        </button>
                    </div>
                ) : (
                    <div className="location-settings">
                        <div className="setting-group">
                            <div className="setting-header">
                                <h4>Location Sharing</h4>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={locationEnabled}
                                        onChange={(e) => handleToggleLocationSharing(e.target.checked)}
                                        disabled={loading}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <p>Allow customers to see your location for service requests</p>
                        </div>

                        <div className="setting-group">
                            <div className="setting-header">
                                <h4>⚡ Instant Services</h4>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={instantServiceEnabled}
                                        onChange={(e) => toggleInstantService(e.target.checked)}
                                        disabled={loading || !locationEnabled}
                                    />
                                    <span className="slider instant"></span>
                                </label>
                            </div>
                            <p>Accept immediate service requests from nearby customers</p>
                        </div>

                        <div className="setting-group">
                            <h4>Service Radius</h4>
                            <p>Maximum distance you're willing to travel for services</p>
                            <div className="radius-control">
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={serviceRadius}
                                    onChange={(e) => setServiceRadius(parseInt(e.target.value))}
                                    onMouseUp={(e) => updateServiceRadius(parseInt(e.target.value))}
                                    className="radius-slider"
                                />
                                <div className="radius-display">
                                    <span className="radius-value">{serviceRadius} km</span>
                                </div>
                            </div>
                        </div>

                        {currentLocation && (
                            <div className="current-location">
                                <h4>Your Service Area</h4>
                                <div className="map-container">
                                    <GoogleMap
                                        center={currentLocation}
                                        services={[]}
                                        height="300px"
                                        showUserLocation={true}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .provider-location-manager {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    margin-bottom: 24px;
                }

                .location-header {
                    text-align: center;
                    margin-bottom: 24px;
                }

                .location-header h3 {
                    margin: 0 0 8px 0;
                    color: #333;
                    font-size: 1.5rem;
                }

                .location-header p {
                    margin: 0;
                    color: #666;
                }

                .alert {
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-weight: 500;
                }

                .alert-error {
                    background: #fee;
                    color: #c53030;
                    border-left: 4px solid #c53030;
                }

                .alert-success {
                    background: #f0fff4;
                    color: #22543d;
                    border-left: 4px solid #22543d;
                }

                .enable-location-section {
                    text-align: center;
                }

                .info-card {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    text-align: left;
                }

                .info-card h4 {
                    margin: 0 0 12px 0;
                    color: #333;
                }

                .info-card p {
                    margin: 0 0 16px 0;
                    color: #666;
                }

                .info-card ul {
                    margin: 0;
                    padding-left: 20px;
                }

                .info-card li {
                    margin: 8px 0;
                    color: #555;
                }

                .enable-btn {
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                    color: white;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .enable-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
                }

                .enable-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .location-settings {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .setting-group {
                    border-bottom: 1px solid #e9ecef;
                    padding-bottom: 20px;
                }

                .setting-group:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }

                .setting-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .setting-header h4 {
                    margin: 0;
                    color: #333;
                    font-size: 1.1rem;
                }

                .setting-group p {
                    margin: 0;
                    color: #666;
                    font-size: 14px;
                }

                .toggle-switch {
                    position: relative;
                    width: 60px;
                    height: 30px;
                    display: inline-block;
                }

                .toggle-switch input {
                    display: none;
                }

                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    border-radius: 30px;
                    transition: 0.3s;
                }

                .slider:before {
                    position: absolute;
                    content: "";
                    height: 24px;
                    width: 24px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    border-radius: 50%;
                    transition: 0.3s;
                }

                .toggle-switch input:checked + .slider {
                    background-color: #007bff;
                }

                .toggle-switch input:checked + .slider.instant {
                    background-color: #ff4757;
                }

                .toggle-switch input:checked + .slider:before {
                    transform: translateX(30px);
                }

                .radius-control {
                    margin-top: 12px;
                }

                .radius-slider {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: #e9ecef;
                    outline: none;
                    cursor: pointer;
                }

                .radius-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #007bff;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                }

                .radius-slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #007bff;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                }

                .radius-display {
                    text-align: center;
                    margin-top: 8px;
                }

                .radius-value {
                    background: #007bff;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                }

                .current-location h4 {
                    margin: 0 0 16px 0;
                    color: #333;
                }

                .map-container {
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #e9ecef;
                }
            `}</style>
        </div>
    );
};

export default ProviderLocationManager;
