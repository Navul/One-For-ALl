const express = require('express');
const ServiceController = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

function setRoutes(app) {
    router.get('/services', ServiceController.getAllServices);
    router.get('/services/categories', ServiceController.getCategories);
    router.get('/services/category/:category', ServiceController.getServicesByCategory);
    router.post('/services', protect, ServiceController.createService);
    router.get('/services/my-services', protect, ServiceController.getMyServices);
    router.get('/services/all-my-services', protect, ServiceController.getAllMyServices);
    router.put('/services/:id/toggle-availability', protect, ServiceController.toggleServiceAvailability);
    router.put('/services/:id', protect, ServiceController.updateService);
    router.delete('/services/:id', protect, ServiceController.deleteService);
    router.post('/services/:id/book', protect, ServiceController.bookService);

    app.use('/api', router);
}

module.exports = setRoutes;