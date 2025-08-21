const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional auth middleware - doesn't fail if no token, but validates if token is provided
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                // Verify token if provided
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Get user from token
                const user = await User.findById(decoded.id);
                
                if (user) {
                    req.user = user;
                }
            } catch (tokenError) {
                // Token is invalid, but that's okay for optional auth
                console.log('Invalid token provided for optional auth route:', tokenError.message);
            }
        }

        next();
    } catch (error) {
        // Don't fail the request for optional auth
        next();
    }
};

// Protect routes - verify JWT token and session
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from token
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token is no longer valid.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token is not valid.'
        });
    }
};

module.exports = { protect, optionalAuth };
