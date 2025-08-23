import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import GoogleMap from '../components/GoogleMap';
import LocationPermission from '../components/LocationPermission';
// All hooks and logic must be inside the component. No code here.

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:5000';
const InstantServices = ({ userRole = 'client' }) => {
    const [userLocation, setUserLocation] = useState(null);
    // Real-time user/provider state
    const [onlineUsers, setOnlineUsers] = useState([]); // All users/providers in real time
    const [socketConnected, setSocketConnected] = useState(false);
    const socketRef = useRef(null);

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

    // Emit user location and info to server in real time
    useEffect(() => {
        if (socketRef.current && socketConnected && userLocation) {
            socketRef.current.emit('user:location', {
                lat: userLocation.lat,
                lng: userLocation.lng,
                category: selectedCategory,
                // Optionally add more info: role, name, etc.
            });
        }
    }, [userLocation, selectedCategory, socketConnected]);

    // Stub for handleMapClick to prevent undefined error
    const handleMapClick = (coords) => {
        if (coords && coords.latitude && coords.longitude) {
            setUserLocation({ lat: coords.latitude, lng: coords.longitude });
            setMapClickMode(false);
        }
    };

    // Socket.IO connection and listeners
    useEffect(() => {
        socketRef.current = io(SOCKET_SERVER_URL, {
            transports: ['websocket'],
            reconnection: true,
        });

        socketRef.current.on('connect', () => {
            setSocketConnected(true);
        });
        socketRef.current.on('disconnect', () => {
            setSocketConnected(false);
        });
        socketRef.current.on('users:update', (users) => {
            setOnlineUsers(users);
        });
        socketRef.current.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Filtering helpers
    function getDistanceKm(lat1, lng1, lat2, lng2) {
        if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
        const toRad = (v) => (v * Math.PI) / 180;
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    const filteredUsers = onlineUsers.filter((user) => {
        // Only show opposite role
        if (userRole === 'provider' && user.role === 'provider') return false;
        if (userRole === 'client' && user.role === 'client') return false;
        // Filter by category
        if (selectedCategory !== 'all' && user.category && user.category !== selectedCategory) return false;
        // Filter by proximity if userLocation is set
        if (userLocation && user.lat && user.lng) {
            const dist = getDistanceKm(userLocation.lat, userLocation.lng, user.lat, user.lng);
            if (dist > searchRadius) return false;
        }
        return true;
    });

    // Manual location setter
    const handleManualLocation = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        if (!isNaN(lat) && !isNaN(lng)) {
            setUserLocation({ lat, lng });
            setShowManualLocation(false);
        }
    };

    return (
        <div className="instant-services-container">
            {/* ...existing header, location, and filter UI code... */}
            {/* Area range and manual location controls in a floating box at bottom right */}
            <div style={{
                position: 'fixed',
                right: 32,
                bottom: 32,
                zIndex: 1000,
                background: '#f8f9fa',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                padding: '18px 24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                maxWidth: '90vw',
                minWidth: '320px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="radius-range" style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>
                        Area Range:
                    </label>
                    <input
                        id="radius-range"
                        type="range"
                        min={1}
                        max={50}
                        value={searchRadius}
                        onChange={e => setSearchRadius(Number(e.target.value))}
                        style={{ width: '120px' }}
                    />
                    <input
                        type="number"
                        min={1}
                        max={50}
                        value={searchRadius}
                        onChange={e => setSearchRadius(Number(e.target.value))}
                        style={{ width: '50px', marginLeft: '5px', padding: '2px 4px', borderRadius: '3px', border: '1px solid #ccc' }}
                    />
                    <span style={{ fontSize: '14px', color: '#333' }}>km</span>
                </div>
                <div style={{ borderLeft: '1px solid #e0e0e0', height: '32px', margin: '0 18px' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => setShowManualLocation((v) => !v)}
                        style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            marginRight: '10px'
                        }}
                    >
                        📍 Set Location by Latitude/Longitude
                    </button>
                    {showManualLocation && (
                        <span style={{ marginLeft: '10px' }}>
                            <input
                                type="number"
                                step="0.000001"
                                placeholder="Latitude"
                                value={manualLat}
                                onChange={e => setManualLat(e.target.value)}
                                style={{ marginRight: '5px', padding: '4px', borderRadius: '3px', border: '1px solid #ccc', width: '120px' }}
                            />
                            <input
                                type="number"
                                step="0.000001"
                                placeholder="Longitude"
                                value={manualLng}
                                onChange={e => setManualLng(e.target.value)}
                                style={{ marginRight: '5px', padding: '4px', borderRadius: '3px', border: '1px solid #ccc', width: '120px' }}
                            />
                            <button
                                onClick={handleManualLocation}
                                style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Set Location
                            </button>
                        </span>
                    )}
                </div>
            </div>
            {error && (
                <div style={{ background: '#ffeaea', color: '#b71c1c', padding: '8px', borderRadius: '5px', marginBottom: '10px', border: '1px solid #ffcdd2' }}>
                    <b>Error:</b> {error}
                </div>
            )}
            {loading && (
                <div style={{ background: '#e3f2fd', color: '#1976d2', padding: '8px', borderRadius: '5px', marginBottom: '10px', border: '1px solid #90caf9' }}>
                    Loading real-time data...
                </div>
            )}
            {/* Add extra margin below controls to separate from map */}
            <div style={{ height: 18 }} />
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
                        center={userLocation || { lat: 23.8459, lng: 90.2577 }}
                        height="400px"
                        showUserLocation={!!userLocation}
                        userLocation={userLocation}
                        onLocationSelect={handleMapClick}
                        style={{
                            cursor: mapClickMode ? 'crosshair' : 'default',
                            border: mapClickMode ? '3px solid #28a745' : '1px solid #ddd'
                        }}
                        onlineUsers={filteredUsers}
                        currentUserLocation={userLocation}
                    />
                </div>
                {/* Real-time user/provider sidebar list */}
                <div className="services-section">
                    <h3>
                        {userRole === 'provider' ? 'Live Clients Nearby' : 'Live Providers Nearby'}
                    </h3>
                    <div style={{ fontSize: '12px', color: socketConnected ? 'green' : 'red', marginBottom: '8px' }}>
                        {socketConnected ? 'Connected to live server' : 'Offline'}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {loading ? (
                            <li style={{ color: '#888' }}>Loading users/providers...</li>
                        ) : filteredUsers.length === 0 ? (
                            <li style={{ color: '#888' }}>No users/providers online</li>
                        ) : filteredUsers.map((user) => {
                            let distance = null;
                            if (userLocation && user.lat && user.lng) {
                                distance = getDistanceKm(userLocation.lat, userLocation.lng, user.lat, user.lng);
                            }
                            return (
                                <li key={user.id} style={{ marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{user.name || 'User'} </span>
                                    <span style={{ color: '#666', fontSize: '11px' }}>({user.role || 'unknown'})</span>
                                    <br />
                                    <span style={{ fontSize: '11px', color: '#555' }}>
                                        Lat: {user.lat?.toFixed(4)}, Lng: {user.lng?.toFixed(4)}
                                    </span>
                                    {user.category && (
                                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#007bff' }}>
                                            {user.category}
                                        </span>
                                    )}
                                    {distance !== null && (
                                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#28a745' }}>
                                            {distance.toFixed(2)} km
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            {/* ...existing styles... */}
        </div>
    );
};

export default InstantServices;
