const express = require('express');
const ServiceController = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

function setRoutes(app) {
    router.get('/services', ServiceController.getAllServices);
    router.post('/services', protect, ServiceController.createService);
    router.get('/services/my-services', protect, ServiceController.getMyServices);
    router.post('/services/:id/book', protect, ServiceController.bookService);

    app.use('/api', router);
}

module.exports = setRoutes;