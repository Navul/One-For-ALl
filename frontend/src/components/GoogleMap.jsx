import React, { useState, useEffect, useRef } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';

const MapComponent = ({ 
    center, 
    zoom = 13, 
    services = [], 
    onLocationSelect, 
    showUserLocation = true,
    userLocation,
    height = '400px',
    className = '',
    style = {}
}) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const userMarkerRef = useRef(null);

    useEffect(() => {
        if (mapRef.current && !map) {
            const googleMap = new window.google.maps.Map(mapRef.current, {
                center: center || { lat: 0, lng: 0 },
                zoom,
                styles: [
                    // Custom map styling
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            setMap(googleMap);

            // Add click listener for location selection
            if (onLocationSelect) {
                googleMap.addListener('click', (event) => {
                    const lat = event.latLng.lat();
                    const lng = event.latLng.lng();
                    onLocationSelect({ latitude: lat, longitude: lng });
                });
            }
        }
    }, [mapRef, map, center, zoom, onLocationSelect]);

    // Update map center when center prop changes
    useEffect(() => {
        if (map && center) {
            map.setCenter(center);
        }
    }, [map, center]);

    // Add user location marker
    useEffect(() => {
        if (map && showUserLocation && userLocation) {
            if (userMarkerRef.current) {
                userMarkerRef.current.setMap(null);
            }

            userMarkerRef.current = new window.google.maps.Marker({
                position: userLocation,
                map: map,
                title: 'Your Location',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#4285f4" stroke="#ffffff" stroke-width="2"/>
                            <circle cx="12" cy="12" r="4" fill="#ffffff"/>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(24, 24),
                    anchor: new window.google.maps.Point(12, 12)
                }
            });
        }

        return () => {
            if (userMarkerRef.current) {
                userMarkerRef.current.setMap(null);
            }
        };
    }, [map, showUserLocation, userLocation]);

    // Add service markers
    useEffect(() => {
        if (map && services.length > 0) {
            // Clear existing markers
            markers.forEach(marker => marker.setMap(null));

            const newMarkers = services.map((service, index) => {
                if (!service.location || !service.location.coordinates) {
                    return null;
                }

                const [lng, lat] = service.location.coordinates;
                
                const marker = new window.google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: service.title,
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 2C10.477 2 6 6.477 6 12C6 20 16 30 16 30C16 30 26 20 26 12C26 6.477 21.523 2 16 2Z" 
                                      fill="${service.instantService ? '#ff4757' : '#2ecc71'}" 
                                      stroke="#ffffff" 
                                      stroke-width="2"/>
                                <circle cx="16" cy="12" r="4" fill="#ffffff"/>
                            </svg>
                        `),
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 30)
                    }
                });

                // Create info window
                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 10px; max-width: 250px;">
                            <h3 style="margin: 0 0 8px 0; color: #333;">${service.title}</h3>
                            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${service.description}</p>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-weight: bold; color: #2ecc71;">$${service.price}</span>
                                ${service.distance ? `<span style="color: #666; font-size: 12px;">${service.distance}km away</span>` : ''}
                            </div>
                            <div style="margin-bottom: 8px;">
                                <span style="background-color: ${service.instantService ? '#ff4757' : '#3498db'}; 
                                           color: white; padding: 2px 6px; border-radius: 12px; font-size: 12px;">
                                    ${service.instantService ? '⚡ Instant Service' : '📅 Regular Service'}
                                </span>
                            </div>
                            <p style="margin: 0; color: #666; font-size: 12px;">
                                Provider: ${service.provider?.name || 'Unknown'}
                            </p>
                            ${service.responseTime ? 
                                `<p style="margin: 4px 0 0 0; color: #e67e22; font-size: 12px; font-weight: bold;">
                                    ETA: ${service.responseTime}
                                 </p>` : ''}
                        </div>
                    `
                });

                marker.addListener('click', () => {
                    // Close all other info windows
                    markers.forEach(m => {
                        if (m.infoWindow) {
                            m.infoWindow.close();
                        }
                    });
                    infoWindow.open(map, marker);
                });

                marker.infoWindow = infoWindow;
                return marker;
            }).filter(marker => marker !== null);

            setMarkers(newMarkers);
        }

        return () => {
            markers.forEach(marker => marker.setMap(null));
        };
    }, [map, services, markers]);

    return (
        <div 
            ref={mapRef} 
            style={{ height, width: '100%', ...style }} 
            className={className}
        />
    );
};

const GoogleMapsWrapper = (props) => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
        return (
            <div style={{ 
                height: props.height || '400px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px'
            }}>
                <p>Google Maps API key not found. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file.</p>
            </div>
        );
    }

    return (
        <Wrapper apiKey={apiKey} libraries={['places', 'geometry']}>
            <MapComponent {...props} />
        </Wrapper>
    );
};

export default GoogleMapsWrapper;
