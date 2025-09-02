const User = require('../models/User');
const Service = require('../models/service');
const Booking = require('../models/booking');

// Admin middleware to verify admin role
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
};

// Get all services (admin only)
const getAllServices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const status = req.query.status || '';
        
        const skip = (page - 1) * limit;
        
        // Build filter query
        let filter = {};
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category) {
            filter.category = category;
        }
        
        if (status) {
            filter.status = status;
        }
        
        const services = await Service.find(filter)
            .populate('provider', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const totalServices = await Service.countDocuments(filter);
        
        res.json({
            services,
            totalPages: Math.ceil(totalServices / limit),
            currentPage: page,
            totalServices
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Error fetching services' });
    }
};

// Update service (admin only)
const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Don't allow changing the provider
        delete updates.provider;
        
        const service = await Service.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        ).populate('provider', 'name email');
        
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        res.json({
            message: 'Service updated successfully',
            service
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ message: 'Error updating service' });
    }
};

// Delete service (admin only)
const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        
        const service = await Service.findByIdAndDelete(id);
        
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ message: 'Error deleting service' });
    }
};

// Get service statistics (admin only)
const getServiceStats = async (req, res) => {
    try {
        const totalServices = await Service.countDocuments();
        const activeServices = await Service.countDocuments({ status: 'active' });
        const pendingServices = await Service.countDocuments({ status: 'pending' });
        const suspendedServices = await Service.countDocuments({ status: 'suspended' });
        
        // Get services by category
        const servicesByCategory = await Service.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        res.json({
            totalServices,
            activeServices,
            pendingServices,
            suspendedServices,
            servicesByCategory
        });
    } catch (error) {
        console.error('Error fetching service stats:', error);
        res.status(500).json({ message: 'Error fetching service statistics' });
    }
};

// Get admin dashboard stats
const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
        const totalProviders = await User.countDocuments({ 
            role: 'provider', 
            isDeleted: { $ne: true } 
        });
        const totalServices = await Service.countDocuments();
        const totalBookings = await Booking.countDocuments();
        
        // Active users (logged in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = await User.countDocuments({ 
            lastLoginAt: { $gte: thirtyDaysAgo },
            isDeleted: { $ne: true }
        });
        
        // Banned users
        const bannedUsers = await User.countDocuments({ 
            isBanned: true,
            isDeleted: { $ne: true }
        });

        res.json({
            success: true,
            data: {
                totalUsers,
                totalProviders,
                totalServices,
                totalBookings,
                activeUsers,
                bannedUsers
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin stats',
            error: error.message
        });
    }
};

// Get all users with detailed information
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, status, search } = req.query;
        const query = {};
        
        // Exclude soft-deleted users
        query.isDeleted = { $ne: true };
        
        // Filter by role
        if (role && role !== 'all') {
            query.role = role;
        }
        
        // Filter by status
        if (status === 'banned') {
            query.isBanned = true;
        } else if (status === 'active') {
            query.isBanned = { $ne: true };
        }
        
        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalUsers = await User.countDocuments(query);

        // Get additional stats for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const userObj = user.toObject();
            
            if (user.role === 'provider') {
                userObj.servicesCount = await Service.countDocuments({ provider: user._id });
                userObj.bookingsCount = await Booking.countDocuments({ provider: user._id });
            } else {
                userObj.bookingsCount = await Booking.countDocuments({ user: user._id });
            }
            
            return userObj;
        }));

        res.json({
            success: true,
            data: usersWithStats,
            pagination: {
                current: page,
                total: Math.ceil(totalUsers / limit),
                count: usersWithStats.length,
                totalRecords: totalUsers
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

// Get specific user details
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's services and bookings
        let services = [];
        let bookings = [];
        
        if (user.role === 'provider') {
            services = await Service.find({ provider: userId });
            bookings = await Booking.find({ provider: userId }).populate('service user');
        } else {
            bookings = await Booking.find({ user: userId }).populate('service provider');
        }

        res.json({
            success: true,
            data: {
                user: user.toObject(),
                services,
                bookings,
                stats: {
                    servicesCount: services.length,
                    bookingsCount: bookings.length
                }
            }
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details',
            error: error.message
        });
    }
};

// Ban a user
const banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, duration } = req.body; // duration in days, null for permanent
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow banning other admins
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot ban admin users'
            });
        }

        const banData = {
            isBanned: true,
            banReason: reason || 'Violation of terms of service',
            bannedAt: new Date(),
            bannedBy: req.user._id
        };

        if (duration) {
            const unbanDate = new Date();
            unbanDate.setDate(unbanDate.getDate() + duration);
            banData.banExpiresAt = unbanDate;
        }

        await User.findByIdAndUpdate(userId, banData);

        console.log(`Admin ${req.user.name} banned user ${user.name} (${user.email})`);

        res.json({
            success: true,
            message: `User ${user.name} has been banned successfully`
        });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to ban user',
            error: error.message
        });
    }
};

// Unban a user
const unbanUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await User.findByIdAndUpdate(userId, {
            $unset: {
                isBanned: '',
                banReason: '',
                bannedAt: '',
                bannedBy: '',
                banExpiresAt: ''
            }
        });

        console.log(`Admin ${req.user.name} unbanned user ${user.name} (${user.email})`);

        res.json({
            success: true,
            message: `User ${user.name} has been unbanned successfully`
        });
    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unban user',
            error: error.message
        });
    }
};

// Delete a user (soft delete)
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { permanent = false } = req.body; // Changed from req.query to req.body
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow deleting other admins
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }

        if (permanent === true || permanent === 'true') {
            // Hard delete - remove completely
            await User.findByIdAndDelete(userId);
            
            // Also delete user's services and bookings
            if (user.role === 'provider') {
                await Service.deleteMany({ provider: userId });
            }
            await Booking.deleteMany({ 
                $or: [{ user: userId }, { provider: userId }] 
            });
            
            console.log(`Admin ${req.user.name} permanently deleted user ${user.name} (${user.email})`);
        } else {
            // Soft delete - mark as deleted
            await User.findByIdAndUpdate(userId, {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: req.user._id,
                email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
            });
            
            console.log(`Admin ${req.user.name} soft deleted user ${user.name} (${user.email})`);
        }

        res.json({
            success: true,
            message: `User ${user.name} has been deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
};

// Change user role
const changeUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newRole } = req.body;
        
        if (!['user', 'provider'].includes(newRole)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Only user and provider roles can be assigned.'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow changing admin roles
        if (user.role === 'admin' || newRole === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify admin roles'
            });
        }

        await User.findByIdAndUpdate(userId, { role: newRole });

        console.log(`Admin ${req.user.name} changed role of ${user.name} from ${user.role} to ${newRole}`);

        res.json({
            success: true,
            message: `User role changed to ${newRole} successfully`
        });
    } catch (error) {
        console.error('Error changing user role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change user role',
            error: error.message
        });
    }
};

// Reset user password
const resetUserPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow resetting admin passwords
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot reset admin passwords'
            });
        }

        // Hash the new password
        const bcrypt = require('bcrypt');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await User.findByIdAndUpdate(userId, { 
            password: hashedPassword,
            passwordResetAt: new Date(),
            passwordResetBy: req.user._id
        });

        console.log(`Admin ${req.user.name} reset password for user ${user.name} (${user.email})`);

        res.json({
            success: true,
            message: 'User password has been reset successfully'
        });
    } catch (error) {
        console.error('Error resetting user password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset user password',
            error: error.message
        });
    }
};

module.exports = {
    requireAdmin,
    getAdminStats,
    getAllUsers,
    getUserById,
    banUser,
    unbanUser,
    deleteUser,
    changeUserRole,
    resetUserPassword,
    getAllServices,
    updateService,
    deleteService,
    getServiceStats
};
