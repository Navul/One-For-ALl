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
            'http://localhost:3001'
        ],
        credentials: true
    }
});

const PORT = process.env.PORT || 5000;

// Log the MONGO_URI for debugging
console.log('MONGO_URI:', process.env.MONGO_URI);

// Connect to MongoDB using connectDB
connectDB();

// --- Real-time instant services: global user presence tracking ---
const onlineUsers = {};

io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    // Helper to broadcast all online users to everyone
    function broadcastUsers() {
        io.emit('users:update', Object.values(onlineUsers));
    }

    // Receive user location and info (from frontend emit)
    socket.on('user:location', (data) => {
        // data: { lat, lng, category, role, name, ... }
        // You may want to add userId or socket.id for uniqueness
        onlineUsers[socket.id] = {
            id: socket.id,
            ...data
        };
        broadcastUsers();
    });

    // Remove user on disconnect
    socket.on('disconnect', () => {
        delete onlineUsers[socket.id];
        broadcastUsers();
        console.log('👤 User disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('io', io);

// CORS middleware
app.use(cors({
    origin: [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'http://localhost:3001',
        'null' // for file:// protocol
    ],
    credentials: true
}));

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

console.log('🚀 Loading routes...');
serviceRoutes(app);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/instant-services', instantServiceRoutes);
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