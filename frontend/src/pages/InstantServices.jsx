import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import GoogleMap from '../components/GoogleMap';
import LocationPermission from '../components/LocationPermission';
import './InstantServices.css';
// All hooks and logic must be inside the component. No code here.

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL;
const InstantServices = ({ userRole = 'client' }) => {
    // Provider: Real-time open requests
    const [openRequests, setOpenRequests] = useState([]);
    const [acceptingRequestId, setAcceptingRequestId] = useState(null);
    const [acceptError, setAcceptError] = useState('');
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

    // Instant Service Request (Client)
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestType, setRequestType] = useState('general');
    const [requestNotes, setRequestNotes] = useState('');
    const [requestPhone, setRequestPhone] = useState('');
    const [requestSubmitting, setRequestSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [acceptedNotification, setAcceptedNotification] = useState(false);
    // Post a new instant service request (client)
    const handlePostRequest = () => {
        if (!userLocation) {
            setError('Set your location before posting a request.');
            return;
        }
        if (!requestPhone || requestPhone.trim().length < 6) {
            setError('Please enter a valid phone number.');
            return;
        }
        
        // Ensure details are provided or use default based on service type
        const details = requestNotes && requestNotes.trim() 
            ? requestNotes.trim() 
            : `I need ${requestType} service`;
        
        setRequestSubmitting(true);
        socketRef.current.emit('request:post', {
            type: requestType,
            details: details,
            phone: requestPhone,
            lat: userLocation.lat,
            lng: userLocation.lng,
            clientId: socketRef.current.id,
            clientName: window.localStorage.getItem('username') || 'Client',
        }, (res) => {
            setRequestSubmitting(false);
            if (res && res.success) {
                setRequestSuccess(true);
                setShowRequestModal(false);
                setRequestNotes('');
                setRequestPhone('');
            } else {
                setError(res?.message || 'Failed to post request.');
            }
        });
    };
    // Map click mode for location selection
    const [mapClickMode, setMapClickMode] = useState(false);

    // Emit user location and info to server in real time
    useEffect(() => {
        if (socketRef.current && socketConnected && userLocation) {
            socketRef.current.emit('user:location', {
                lat: userLocation.lat,
                lng: userLocation.lng,
                category: selectedCategory,
                role: userRole,
                name: window.localStorage.getItem('username') || userRole.charAt(0).toUpperCase() + userRole.slice(1)
            });
        }
    }, [userLocation, selectedCategory, socketConnected, userRole]);

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
            // Providers: fetch open requests on connect
            if (userRole === 'provider') {
                socketRef.current.emit('requests:get');
            }
        });
        socketRef.current.on('disconnect', () => {
            setSocketConnected(false);
        });
        socketRef.current.on('users:update', (users) => {
            setOnlineUsers(users);
        });
        // Listen for real-time open requests (providers and clients)
        socketRef.current.on('requests:update', (requests) => {
            setOpenRequests(requests);
            // If user is a client, check if their request was accepted
            if (userRole === 'client') {
                const myReq = requests.find(r => r.clientId === socketRef.current.id && r.status === 'accepted');
                if (myReq) {
                    setAcceptedNotification(true);
                }
            }
        });
        socketRef.current.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [userRole]);
    // Provider: Accept a request
    const handleAcceptRequest = (requestId) => {
        setAcceptingRequestId(requestId);
        setAcceptError('');
        socketRef.current.emit('request:accept', {
            requestId,
            providerId: socketRef.current.id,
            providerName: window.localStorage.getItem('username') || 'Provider',
        }, (res) => {
            setAcceptingRequestId(null);
            if (!res || !res.success) {
                setAcceptError(res && res.message ? res.message : 'Failed to accept request.');
            }
        });
    };

    // Provider: Mark a request as completed
    const handleCompleteRequest = (requestId) => {
        socketRef.current.emit('request:complete', { requestId }, (res) => {
            // Optionally handle response
        });
    };

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
        <div className="instant-services-page">
            <div className="instant-services-container">
                {/* Header */}
                <div className="instant-services-header">
                    <div className="header-content">
                        <h1>Live Providers Nearby</h1>
                        <p>Connect with service providers in real-time</p>
                        <div className={`connection-status ${socketConnected ? 'connected' : 'disconnected'}`}>
                            <span className="status-indicator"></span>
                            {socketConnected ? 'Connected' : 'Connecting...'}
                        </div>
                    </div>
                </div>

                {/* Client: Request Instant Service Button */}
                {userRole === 'client' && (
                    <div className="floating-action">
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="request-service-btn"
                        >
                            📍 Request Instant Service
                        </button>
                    </div>
                )}

                {/* Request Modal */}
                {showRequestModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Request Instant Service</h3>
                                <button 
                                    className="modal-close"
                                    onClick={() => setShowRequestModal(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Service Type:</label>
                                    <select 
                                        value={requestType} 
                                        onChange={e => setRequestType(e.target.value)} 
                                        className="modern-select"
                                    >
                                        <option value="general">General</option>
                                        <option value="plumbing">Plumbing</option>
                                        <option value="electrical">Electrical</option>
                                        <option value="cleaning">Cleaning</option>
                                        <option value="delivery">Delivery</option>
                                        <option value="personal">Personal Care</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Phone Number:</label>
                                    <input
                                        type="tel"
                                        value={requestPhone}
                                        onChange={e => setRequestPhone(e.target.value)}
                                        placeholder="Enter your phone number"
                                        className="modern-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Details/Notes:</label>
                                    <textarea 
                                        value={requestNotes} 
                                        onChange={e => setRequestNotes(e.target.value)} 
                                        rows={3} 
                                        className="modern-textarea"
                                        placeholder="Describe what you need..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Location:</label>
                                    <div className="location-display">
                                        {userLocation ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : 'Not set'}
                                    </div>
                                </div>
                                {requestSuccess && (
                                    <div className="success-message">
                                        Request posted successfully!
                                    </div>
                                )}
                                {acceptedNotification && userRole === 'client' && (
                                    <div className="accepted-notification">
                                        🎉 Your request has been accepted! You will be contacted by the provider soon.
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    onClick={() => setShowRequestModal(false)} 
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handlePostRequest} 
                                    disabled={requestSubmitting} 
                                    className="btn-primary"
                                >
                                    {requestSubmitting ? (
                                        <>
                                            <span className="loading-spinner"></span>
                                            Posting...
                                        </>
                                    ) : 'Post Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                    )}

                {/* Location Setup */}
                {!userLocation && (
                    <div className="location-setup-card">
                        <div className="location-icon">📍</div>
                        <h3>Set Your Location</h3>
                        <p>We need your location to show nearby providers and calculate distances.</p>
                        <LocationPermission onLocationUpdate={setUserLocation} />
                        <div className="location-alternatives">
                            <button 
                                className="alt-location-btn"
                                onClick={() => setShowManualLocation(!showManualLocation)}
                            >
                                📝 Enter Manually
                            </button>
                        </div>
                    </div>
                )}

                {/* Manual Location Input */}
                {showManualLocation && (
                    <div className="manual-location-card">
                        <h4>📍 Enter Location Manually</h4>
                        <div className="coordinate-inputs">
                            <input
                                type="number"
                                placeholder="Latitude"
                                value={manualLat}
                                onChange={e => setManualLat(e.target.value)}
                                className="coordinate-input"
                                step="any"
                            />
                            <input
                                type="number"
                                placeholder="Longitude"
                                value={manualLng}
                                onChange={e => setManualLng(e.target.value)}
                                className="coordinate-input"
                                step="any"
                            />
                            <button 
                                onClick={() => {
                                    if (manualLat && manualLng) {
                                        setUserLocation({ lat: parseFloat(manualLat), lng: parseFloat(manualLng) });
                                        setShowManualLocation(false);
                                    }
                                }}
                                className="set-location-btn"
                            >
                                Set Location
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {/* Controls Section */}
                {userLocation && (
                    <div className="controls-section">
                        <div className="location-info-card">
                            <div className="location-badge">
                                <span className="location-dot"></span>
                                Location Set
                            </div>
                            <div className="coordinates">
                                📍 {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                            </div>
                            <button 
                                onClick={() => setUserLocation(null)}
                                className="change-location-btn"
                            >
                                Change Location
                            </button>
                        </div>
                        
                        <div className="filters-card">
                            <div className="filter-group">
                                <label>Service Category</label>
                                <select 
                                    value={selectedCategory} 
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="modern-select"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="plumbing">Plumbing</option>
                                    <option value="electrical">Electrical</option>
                                    <option value="cleaning">Cleaning</option>
                                    <option value="delivery">Delivery</option>
                                    <option value="personal">Personal Care</option>
                                    <option value="emergency">Emergency</option>
                                </select>
                            </div>
                            
                            <div className="filter-group">
                                <label>Search Radius</label>
                                <div className="radius-control">
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={searchRadius}
                                        onChange={e => setSearchRadius(parseInt(e.target.value))}
                                        className="radius-slider"
                                    />
                                    <div className="radius-display">{searchRadius}km</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                {userLocation && (
                    <div className="main-content">
                        {/* Map Section */}
                        <div className="map-section">
                            <div className="map-container">
                                <GoogleMap
                                    userLocation={userLocation}
                                    onLocationSelect={(lat, lng) => setUserLocation({ lat, lng })}
                                    className={`map-container ${mapClickMode ? 'map-click-mode' : ''}`}
                                    onlineUsers={filteredUsers}
                                    currentUserLocation={userLocation}
                                />
                            </div>
                        </div>

                        {/* Sidebar Section */}
                        <div className="sidebar-section">
                            <div className="sidebar-header">
                                <h3>{userRole === 'provider' ? 'Live Clients Nearby' : 'Live Providers Nearby'}</h3>
                                <div className={`connection-status ${socketConnected ? 'connected' : 'disconnected'}`}>
                                    <span className="status-indicator"></span>
                                    {socketConnected ? 'Live' : 'Offline'}
                                </div>
                                <div className="provider-count">
                                    {filteredUsers.length} {userRole === 'provider' ? 'clients' : 'providers'} online
                                </div>
                            </div>
                            
                            <div className="providers-list">
                                {loading ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">⏳</div>
                                        <h4>Loading...</h4>
                                        <p>Finding nearby providers...</p>
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">🔍</div>
                                        <h4>No Providers Found</h4>
                                        <p>Try adjusting your search radius or category filter</p>
                                    </div>
                                ) : (
                                    filteredUsers.map((user) => {
                                        let distance = null;
                                        if (userLocation && user.lat && user.lng) {
                                            distance = getDistanceKm(userLocation.lat, userLocation.lng, user.lat, user.lng);
                                        }
                                        return (
                                            <div key={user.id} className="provider-card">
                                                <div className="provider-header">
                                                    <div className="provider-avatar">
                                                        {(user.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="provider-info">
                                                        <h4>{user.name || 'User'}</h4>
                                                        <div className="provider-role">{user.role || 'provider'}</div>
                                                    </div>
                                                </div>
                                                <div className="provider-details">
                                                    {user.category && (
                                                        <span className="category-badge">{user.category}</span>
                                                    )}
                                                    {distance !== null && (
                                                        <span className="distance-badge">{distance.toFixed(1)} km away</span>
                                                    )}
                                                </div>
                                                <div className="provider-actions">
                                                    <button className="contact-btn">
                                                        📞 Contact
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

            {/* Client: Active Requests box */}
            {userRole === 'client' && (
                <div style={{ margin: '24px 0 0 0', padding: '18px 0', borderBottom: '1px solid #eee' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', color: '#2a3eb1' }}>Active Requests</h3>
                    {openRequests.filter(r => r.clientId === socketRef.current?.id && r.status !== 'completed').length === 0 ? (
                        <div style={{ color: '#888', fontSize: '15px', marginTop: 8 }}>No active requests.</div>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {openRequests.filter(r => r.clientId === socketRef.current?.id && r.status !== 'completed').map(req => (
                                <li key={req.id} style={{
                                    background: '#f8f9fa', border: '1px solid #d1d5db', borderRadius: '8px',
                                    margin: '12px 0', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6
                                }}>
                                    <div><b>Type:</b> {req.type}</div>
                                    <div><b>Details:</b> {req.details}</div>
                                    <div><b>Status:</b> {req.status === 'accepted' ? <span style={{color:'#28a745'}}>Accepted</span> : <span style={{color:'#f0ad4e'}}>Pending</span>}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            {userRole === 'provider' && (
                <div style={{ margin: '24px 0 0 0', padding: '18px 0', borderBottom: '1px solid #eee' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', color: '#2a3eb1' }}>Live Service Requests</h3>
                    {acceptError && <div style={{ color: 'red', marginBottom: 8 }}>{acceptError}</div>}
                    {openRequests.filter(r => r.status !== 'completed').length === 0 ? (
                        <div style={{ color: '#888', fontSize: '15px', marginTop: 8 }}>No open/accepted requests nearby.</div>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {openRequests.filter(r => r.status !== 'completed').map(req => {
                                const isAcceptedByMe = req.status === 'accepted' && req.acceptedBy && req.acceptedBy.providerId === socketRef.current?.id;
                                return (
                                    <li key={req.id} style={{
                                        background: '#f8f9fa', border: '1px solid #d1d5db', borderRadius: '8px',
                                        margin: '12px 0', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6
                                    }}>
                                        <div><b>Type:</b> {req.type}</div>
                                        <div><b>Details:</b> {req.details}</div>
                                        <div><b>Location:</b> {req.lat.toFixed(5)}, {req.lng.toFixed(5)}</div>
                                        <div><b>Client:</b> {req.clientName}</div>
                                        <div><b>Phone:</b> {req.phone}</div>
                                        <div><b>Status:</b> {req.status && req.status.toLowerCase() === 'accepted' ? <span style={{color:'#28a745'}}>Accepted</span> : req.status && req.status.toLowerCase() === 'completed' ? <span style={{color:'#007bff'}}>Completed</span> : <span style={{color:'#f0ad4e'}}>Pending</span>}</div>
                                        {req.status === 'open' && (
                                            <button
                                                onClick={() => handleAcceptRequest(req.id)}
                                                disabled={acceptingRequestId === req.id}
                                                style={{
                                                    marginTop: 8,
                                                    background: '#28a745', color: 'white', border: 'none', borderRadius: '5px',
                                                    padding: '8px 18px', fontWeight: 'bold', fontSize: '15px', cursor: acceptingRequestId === req.id ? 'not-allowed' : 'pointer',
                                                    opacity: acceptingRequestId === req.id ? 0.7 : 1
                                                }}
                                            >
                                                {acceptingRequestId === req.id ? 'Accepting...' : 'Accept Request'}
                                            </button>
                                        )}
                                        {isAcceptedByMe && (
                                            <button
                                                onClick={() => handleCompleteRequest(req.id)}
                                                style={{
                                                    marginTop: 8,
                                                    background: '#007bff', color: 'white', border: 'none', borderRadius: '5px',
                                                    padding: '8px 18px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer'
                                                }}
                                            >
                                                Mark as Completed
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
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
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '16px',
                maxWidth: '90vw',
                minWidth: '320px'
            }}>
                {/* User role indicator */}
                <div style={{
                    marginBottom: '8px',
                    alignSelf: 'flex-end',
                    background: userRole === 'provider' ? '#e3fcec' : '#e3e7fc',
                    color: userRole === 'provider' ? '#218838' : '#2a3eb1',
                    borderRadius: '6px',
                    padding: '4px 14px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}>
                    Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </div>
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
        </div>
    </div>
    );
};

export default InstantServices;
