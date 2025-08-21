const path = require('path');
console.log('Current working directory:', process.cwd());

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Verify environment variables are loaded
console.log('MONGO_URI available:', process.env.MONGO_URI ? 'Yes' : 'No');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const connectDB = require('./config/db'); // <-- Import your connectDB function

const app = express();
const PORT = process.env.PORT || 5000;

// Log the MONGO_URI for debugging
console.log('MONGO_URI:', process.env.MONGO_URI);

// Connect to MongoDB using connectDB
connectDB();

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

console.log('🚀 Loading routes...');
serviceRoutes(app);
app.use('/api/auth', authRoutes);
console.log('📋 Booking routes loaded');
app.use('/api/bookings', bookingRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/notifications', notificationRoutes);
console.log('✅ All routes loaded successfully');

// Add a simple test endpoint to verify the server is working
app.get('/test', (req, res) => {
    res.json({ success: true, message: 'Server is working!' });
});

// Add a test endpoint specifically for booking routes
app.post('/api/bookings/test-post', (req, res) => {
    res.json({ success: true, message: 'POST endpoint is working!' });
});

// app.use('/api/notifications', notificationRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});