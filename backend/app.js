// ...existing code...
const path = require('path');
console.log('Current working directory:', process.cwd());

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Dynamic CLIENT_URL configuration based on environment
let CLIENT_URL;
if (process.env.NODE_ENV === 'production') {
    // Production: Use Render URL
    CLIENT_URL = process.env.RENDER_EXTERNAL_URL || 'https://one-for-all-6lpg.onrender.com';
} else {
    // Development: Use localhost or environment variable
    CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
}

// Set the CLIENT_URL in process.env for consistency
process.env.CLIENT_URL = CLIENT_URL;

console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`🔗 Client URL: ${CLIENT_URL}`);

// Verify environment variables are loaded
console.log('MONGO_URI available:', process.env.MONGO_URI ? 'Yes' : 'No');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db'); // <-- Import your connectDB function

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
});

// Enable CORS for frontend before any routes or session middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// Add CORS debugging
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.url} - Origin: ${req.headers.origin} - ${new Date().toISOString()}`);
    next();
});

const PORT = process.env.PORT || 5000;

// Log the MONGO_URI for debugging
console.log('MONGO_URI:', process.env.MONGO_URI);

// Connect to MongoDB using connectDB
connectDB();

// --- Real-time instant services: global user presence tracking ---

const onlineUsers = {};
// In-memory store for open instant service requests
const openRequests = {}; // { requestId: { ...request, status, acceptedBy } }
const { v4: uuidv4 } = require('uuid');



// Chat controller for persistent chat
const chatController = require('./controllers/chatController');

// Make io globally available for notificationController
global.io = io;

io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    // Handle user authentication and identification
    socket.on('authenticate', ({ userId, token }) => {
        // You can add token verification here if needed
        socket.userId = userId;
        socket.join(`user_${userId}`); // Join user-specific room
        console.log(`🔐 User ${userId} authenticated on socket ${socket.id}`);
    });

    // Handle notification room joining
    socket.on('notification:join', ({ userId }) => {
        socket.userId = userId;
        socket.join(`user_${userId}`);
        socket.join(`notifications_${userId}`);
        console.log(`📩 User ${userId} joined notification room notifications_${userId}`);
        console.log(`📩 Socket ${socket.id} now has userId:`, socket.userId);
    });

    socket.on('notification:leave', ({ userId }) => {
        socket.leave(`user_${userId}`);
        socket.leave(`notifications_${userId}`);
        console.log(`📩 User ${userId} left notification room`);
    });

    // --- CHAT SYSTEM (persistent) ---
    // Join chat room for a booking
    socket.on('chat:join', ({ bookingId }) => {
        if (bookingId) {
            socket.join(`chat_${bookingId}`);
        }
    });

    // Leave chat room for a booking
    socket.on('chat:leave', ({ bookingId }) => {
        if (bookingId) {
            socket.leave(`chat_${bookingId}`);
        }
    });

    // Send a chat message (save to DB)
    socket.on('chat:message', async ({ bookingId, from, to, message }) => {
        console.log('[SOCKET] chat:message', { bookingId, from, to, message });
        if (!bookingId || !from || !to || !message) return;
        const msgData = {
            bookingId,
            from,
            to,
            message,
            timestamp: new Date()
        };
        try {
            const savedMsg = await chatController.saveMessage(msgData);
            console.log('[SOCKET] chat:message saved', savedMsg);
            io.to(`chat_${bookingId}`).emit('chat:message', savedMsg);
            
            // Create persistent notification for the recipient
            const { createNotification } = require('./controllers/notificationController');
            await createNotification({
                userId: to.id,
                title: 'New Message',
                message: `${from.name} sent you a message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
                type: 'chat',
                relatedId: bookingId,
                relatedModel: 'Booking',
                data: {
                    bookingId,
                    fromUser: from,
                    messageContent: message
                }
            });
            
            // Real-time notification to recipient using socket rooms
            console.log('[SOCKET] Emitting notification:chat to room:', `notifications_${to.id}`);
            io.to(`notifications_${to.id}`).emit('notification:chat', {
                type: 'chat',
                title: 'New Message',
                message: `${from.name} sent you a message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
                bookingId,
                from,
                timestamp: msgData.timestamp
            });
            
            // Also emit to individual user room as fallback
            console.log('[SOCKET] Also checking individual sockets for user:', to.id);
            Object.values(io.sockets.sockets).forEach((s) => {
                if (s.userId === to.id || s.id === to.id) {
                    console.log('[SOCKET] Found socket for user, emitting notification:', s.id);
                    s.emit('notification:chat', {
                        type: 'chat',
                        title: 'New Message',
                        message: `${from.name} sent you a message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
                        bookingId,
                        from,
                        timestamp: msgData.timestamp
                    });
                }
            });
        } catch (err) {
            console.error('Error saving chat message:', err);
        }
    });

    // Fetch chat history for a booking (from DB)
    socket.on('chat:history', async ({ bookingId }, callback) => {
        console.log('[SOCKET] chat:history', { bookingId });
        if (!bookingId) return callback([]);
        try {
            const history = await chatController.getChatHistory(bookingId);
            console.log('[SOCKET] chat:history result', history);
            callback(history);
        } catch (err) {
            callback([]);
        }
    });
    // Provider marks a request as completed
    socket.on('request:complete', ({ requestId }, callback) => {
        const req = openRequests[requestId];
        if (!req || req.status !== 'accepted') {
            if (callback) callback({ success: false, message: 'Request not found or not accepted.' });
            return;
        }
        req.status = 'completed';
        broadcastRequests();
        if (callback) callback({ success: true });
    });
    console.log('👤 User connected:', socket.id);

    // Helper to broadcast all online users to everyone
    function broadcastUsers() {
        io.emit('users:update', Object.values(onlineUsers));
    }

    // Receive user location and info (from frontend emit)
    socket.on('user:location', (data) => {
        // data: { lat, lng, category, role, name, ... }
        onlineUsers[socket.id] = {
            id: socket.id,
            ...data
        };
        broadcastUsers();
    });


    // --- INSTANT SERVICE REQUESTS LOGIC ---
    // Helper to broadcast all open requests to providers
    function broadcastRequests() {
        // For each provider, send open requests and accepted requests they accepted
        Object.values(io.sockets.sockets).forEach((s) => {
            const providerId = s.id;
            const requests = Object.values(openRequests).filter(r =>
                r.status === 'open' ||
                (r.status === 'accepted' && r.acceptedBy && r.acceptedBy.providerId === providerId)
            );
            console.log(`[broadcastRequests] To provider ${providerId}:`, JSON.stringify(requests, null, 2));
            s.emit('requests:update', requests);
        });
        // For clients, still emit all requests (for notification logic)
        const allRequests = Object.values(openRequests);
        console.log(`[broadcastRequests] To ALL clients:`, JSON.stringify(allRequests, null, 2));
        io.emit('requests:update', allRequests);
    }

    // Client posts a new instant service request
    socket.on('request:post', (data, callback) => {
        // data: { type, details, phone, lat, lng, clientId, clientName }
        if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length < 6) {
            if (callback) callback({ success: false, message: 'Phone number required.' });
            return;
        }
        const requestId = uuidv4();
        openRequests[requestId] = {
            id: requestId,
            type: data.type,
            details: data.details,
            phone: data.phone,
            lat: data.lat,
            lng: data.lng,
            clientId: data.clientId,
            clientName: data.clientName,
            status: 'open',
            acceptedBy: null,
            createdAt: Date.now()
        };
        broadcastRequests();
        if (callback) callback({ success: true, id: requestId });
    });

    // Provider accepts a request (first come, first serve)
    socket.on('request:accept', ({ requestId, providerId, providerName }, callback) => {
        const req = openRequests[requestId];
        if (!req || req.status !== 'open') {
            if (callback) callback({ success: false, message: 'Request already accepted or not found.' });
            return;
        }
        req.status = 'accepted';
        req.acceptedBy = { providerId, providerName };
        broadcastRequests();
        // Notify client who posted the request
        io.to(req.clientId).emit('request:accepted', { ...req });
        if (callback) callback({ success: true });
    });

    // Send open and accepted-by-me requests to new provider connections
    socket.on('requests:get', () => {
        const providerId = socket.id;
        const requests = Object.values(openRequests).filter(r =>
            r.status === 'open' ||
            (r.status === 'accepted' && r.acceptedBy && r.acceptedBy.providerId === providerId)
        );
        socket.emit('requests:update', requests);
    });

    // Handle disconnects
    socket.on('disconnect', () => {
        console.log('👤 User disconnected:', socket.id);
        delete onlineUsers[socket.id];
        broadcastUsers();
    });
});

// Session middleware
// Note: Using MemoryStore for development. For production, consider using connect-mongo or connect-redis
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
const fs = require('fs');

// Try multiple possible build paths for different deployment scenarios
const possibleBuildPaths = [
    path.join(__dirname, '../frontend/build'),           // Local development
    path.join(__dirname, '../../frontend/build'),        // Alternative structure
    path.join(process.cwd(), 'frontend/build'),          // From project root
    path.join(__dirname, '../build'),                    // If build is moved up
    path.join(process.cwd(), 'build')                    // Build in root
];

// Make buildPath globally available for the catch-all handler
let buildPath = null;
for (const tryPath of possibleBuildPaths) {
    if (fs.existsSync(tryPath) && fs.existsSync(path.join(tryPath, 'index.html'))) {
        buildPath = tryPath;
        break;
    }
}

console.log('Checking build paths:');
possibleBuildPaths.forEach(p => {
    const exists = fs.existsSync(p);
    const hasIndex = exists && fs.existsSync(path.join(p, 'index.html'));
    console.log(`  ${p}: exists=${exists}, has index.html=${hasIndex}`);
});

if (buildPath) {
    console.log('✅ Build directory found at:', buildPath);
    console.log('✅ index.html exists at:', path.join(buildPath, 'index.html'));
    
    app.use(express.static(buildPath, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
            console.log('📁 Serving file:', path.relative(buildPath, filePath));
            if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            } else if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css');
            } else if (filePath.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html');
            } else if (filePath.endsWith('.json')) {
                res.setHeader('Content-Type', 'application/json');
            }
        }
    }));
} else {
    console.log('❌ No build directory found in any of these locations:');
    possibleBuildPaths.forEach(p => console.log(`  ${p}`));
}

// Routes
const serviceRoutes = require('./routes/serviceRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const debugRoutes = require('./routes/debugRoutes');
const negotiationRoutes = require('./routes/negotiationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const instantServiceRoutes = require('./routes/instantServiceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');

console.log('🚀 Loading routes...');
serviceRoutes(app);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/instant-services', instantServiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
console.log('📋 Booking routes loaded');
console.log('💬 Chat routes loaded');
console.log('📍 Instant services routes loaded');
console.log('✅ All routes loaded successfully');

// Request logging middleware (moved after static files and routes)
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// Add a simple test endpoint to verify the server is working
app.get('/test', (req, res) => {
    res.json({ success: true, message: 'Server is working!' });
});

// Add CORS test endpoint
app.get('/api/cors-test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'CORS is working!', 
        origin: req.headers.origin,
        clientUrl: process.env.CLIENT_URL,
        timestamp: new Date().toISOString() 
    });
});

// Add notification test endpoint directly in app.js
app.get('/api/notifications/direct-test', (req, res) => {
    console.log('📩 Direct notification test endpoint hit!');
    res.json({ success: true, message: 'Direct notification endpoint working!', timestamp: new Date().toISOString() });
});

// Add a test endpoint specifically for booking routes
app.post('/api/bookings/test-post', (req, res) => {
    res.json({ success: true, message: 'POST endpoint is working!' });
});

// Test login route accessibility
app.get('/api/auth/test', (req, res) => {
    res.json({ success: true, message: 'Auth routes are accessible!' });
});

// Error handling middleware for API routes
app.use('/api', (req, res, next) => {
    // If we reach here, the API route wasn't found
    res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.use((req, res) => {
    // Only serve React for GET requests that don't start with /api/
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        if (buildPath) {
            const indexPath = path.join(buildPath, 'index.html');
            console.log('📄 Serving index.html for:', req.path, 'from:', indexPath);
            res.sendFile(indexPath);
        } else {
            console.log('❌ No build path available, cannot serve index.html');
            console.log('❌ buildPath variable is:', buildPath);
            console.log('❌ Re-checking build paths:');
            possibleBuildPaths.forEach(p => {
                const exists = fs.existsSync(p);
                const hasIndex = exists && fs.existsSync(path.join(p, 'index.html'));
                console.log(`  ${p}: exists=${exists}, has index.html=${hasIndex}`);
            });
            res.status(404).send('Frontend build not found - build path not configured');
        }
    } else {
        res.status(404).json({ error: 'Endpoint not found', method: req.method, path: req.path });
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on ${process.env.CLIENT_URL || 'http://localhost'}:${PORT}`);
    console.log('📡 Socket.IO enabled for real-time instant services');
});