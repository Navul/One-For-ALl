// ...existing code...
const path = require('path');
console.log('Current working directory:', process.cwd());

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

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
        origin: [
            process.env.CLIENT_URL || 'http://localhost:3000',
            'http://localhost:3001',
            'https://one-for-all-6lpg.onrender.com'
        ],
        credentials: true
    }
});

// Enable CORS for frontend before any routes or session middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://one-for-all-6lpg.onrender.com'
  ],
  credentials: true
}));

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
            // Real-time notification to recipient (if online)
            Object.values(io.sockets.sockets).forEach((s) => {
                if (s.userId === to.id || s.id === to.id) {
                    s.emit('notification:chat', {
                        type: 'chat',
                        bookingId,
                        from,
                        message,
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

// Request logging middleware
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

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
console.log('📋 Booking routes loaded');
console.log('📍 Instant services routes loaded');
console.log('✅ All routes loaded successfully');

// Add a simple test endpoint to verify the server is working
app.get('/test', (req, res) => {
    res.json({ success: true, message: 'Server is working!' });
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

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log('📡 Socket.IO enabled for real-time instant services');
});