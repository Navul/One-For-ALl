const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

// Apply protection and admin check to all routes
router.use(protect);
router.use(requireAdmin);

// Admin Dashboard Stats
router.get('/stats', getAdminStats);

// User Management Routes
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);

// User Actions
router.put('/users/:userId/ban', banUser);
router.put('/users/:userId/unban', unbanUser);
router.delete('/users/:userId', deleteUser);
router.put('/users/:userId/role', changeUserRole);
router.put('/users/:userId/reset-password', resetUserPassword);

// Service Management Routes
router.get('/services', getAllServices);
router.get('/services/stats', getServiceStats);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

module.exports = router;
