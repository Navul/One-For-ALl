import React, { useState, useEffect, useCallback } from 'react';
import locationService from '../services/locationService';

const LocationPermission = ({ 
    onLocationGranted, 
    onLocationDenied, 
    autoRequest = false,
    showToggle = true 
}) => {
    const [permissionStatus, setPermissionStatus] = useState('unknown'); // unknown, granted, denied, prompt
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [locationEnabled, setLocationEnabled] = useState(false);

    const requestLocation = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const position = await locationService.getCurrentPosition();
            setPermissionStatus('granted');
            setLocationEnabled(true);
            
            if (onLocationGranted) {
                onLocationGranted(position);
            }
        } catch (err) {
            setError(err.message);
            setPermissionStatus('denied');
            
            if (onLocationDenied) {
                onLocationDenied(err);
            }
        } finally {
            setIsLoading(false);
        }
    }, [onLocationGranted, onLocationDenied]);

    useEffect(() => {
        checkPermissionStatus();
        if (autoRequest) {
            requestLocation();
        }
    }, [autoRequest, requestLocation]);

    const checkPermissionStatus = async () => {
        if (!navigator.geolocation) {
            setPermissionStatus('not-supported');
            return;
        }

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            setPermissionStatus(permission.state);
            
            permission.addEventListener('change', () => {
                setPermissionStatus(permission.state);
            });
        } catch (err) {
            // Fallback for browsers that don't support permissions API
            setPermissionStatus('unknown');
        }
    };

    const handleLocationToggle = async (enabled) => {
        if (enabled) {
            await requestLocation();
        } else {
            setLocationEnabled(false);
            locationService.clearWatch();
        }
    };

    const renderPermissionPrompt = () => {
        switch (permissionStatus) {
            case 'not-supported':
                return (
                    <div className="location-permission-card error">
                        <div className="icon">❌</div>
                        <h3>Location Not Supported</h3>
                        <p>Your browser doesn't support location services.</p>
                    </div>
                );

            case 'denied':
                return (
                    <div className="location-permission-card warning">
                        <div className="icon">🚫</div>
                        <h3>Location Access Denied</h3>
                        <p>{error || 'Location access is required to find nearby services.'}</p>
                        <div className="location-help">
                            <p><strong>To enable location:</strong></p>
                            <ul>
                                <li>Click the location icon in your browser's address bar</li>
                                <li>Select "Allow" for location access</li>
                                <li>Refresh the page and try again</li>
                            </ul>
                        </div>
                        <button 
                            className="btn-primary" 
                            onClick={requestLocation}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Requesting...' : 'Try Again'}
                        </button>
                    </div>
                );

            case 'granted':
                return showToggle ? (
                    <div className="location-permission-card success">
                        <div className="icon">✅</div>
                        <h3>Location Access Enabled</h3>
                        <p>We can now show you nearby services.</p>
                        {showToggle && (
                            <label className="location-toggle">
                                <input
                                    type="checkbox"
                                    checked={locationEnabled}
                                    onChange={(e) => handleLocationToggle(e.target.checked)}
                                />
                                <span className="slider"></span>
                                Share my location for instant services
                            </label>
                        )}
                    </div>
                ) : null;

            default:
                return (
                    <div className="location-permission-card">
                        <div className="icon">📍</div>
                        <h3>Enable Location Services</h3>
                        <p>
                            Allow location access to find the nearest service providers 
                            and enable instant service bookings.
                        </p>
                        <div className="location-benefits">
                            <h4>Benefits:</h4>
                            <ul>
                                <li>🎯 Find nearby service providers</li>
                                <li>⚡ Book instant services</li>
                                <li>📍 Accurate service location</li>
                                <li>⏱️ Faster response times</li>
                            </ul>
                        </div>
                        <button 
                            className="btn-primary" 
                            onClick={requestLocation}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Getting Location...
                                </>
                            ) : (
                                'Enable Location'
                            )}
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="location-permission-container">
            {renderPermissionPrompt()}
            
            <style jsx>{`
                .location-permission-container {
                    margin: 20px 0;
                }

                .location-permission-card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    border: 2px solid #e9ecef;
                    margin-bottom: 20px;
                }

                .location-permission-card.success {
                    border-color: #28a745;
                    background: linear-gradient(135deg, #f8fff9 0%, #f0fff4 100%);
                }

                .location-permission-card.warning {
                    border-color: #ffc107;
                    background: linear-gradient(135deg, #fffdf5 0%, #fff9e6 100%);
                }

                .location-permission-card.error {
                    border-color: #dc3545;
                    background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
                }

                .icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .location-permission-card h3 {
                    margin: 0 0 12px 0;
                    color: #333;
                    font-size: 20px;
                }

                .location-permission-card p {
                    margin: 0 0 16px 0;
                    color: #666;
                    line-height: 1.5;
                }

                .location-benefits {
                    text-align: left;
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 8px;
                    margin: 16px 0;
                }

                .location-benefits h4 {
                    margin: 0 0 8px 0;
                    color: #495057;
                }

                .location-benefits ul {
                    margin: 0;
                    padding-left: 16px;
                }

                .location-benefits li {
                    margin: 4px 0;
                    color: #6c757d;
                }

                .location-help {
                    text-align: left;
                    background: #fff3cd;
                    padding: 12px;
                    border-radius: 6px;
                    margin: 12px 0;
                    border-left: 4px solid #ffc107;
                }

                .location-help ul {
                    margin: 8px 0 0 16px;
                    padding: 0;
                }

                .location-help li {
                    margin: 4px 0;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .location-toggle {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 16px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #495057;
                }

                .location-toggle input {
                    display: none;
                }

                .slider {
                    position: relative;
                    width: 48px;
                    height: 24px;
                    background: #ccc;
                    border-radius: 24px;
                    transition: 0.3s;
                }

                .slider:before {
                    content: '';
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    top: 2px;
                    left: 2px;
                    transition: 0.3s;
                }

                .location-toggle input:checked + .slider {
                    background: #007bff;
                }

                .location-toggle input:checked + .slider:before {
                    transform: translateX(24px);
                }
            `}</style>
        </div>
    );
};

export default LocationPermission;
