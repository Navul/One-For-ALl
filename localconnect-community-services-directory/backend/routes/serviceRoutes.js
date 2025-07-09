const express = require('express');
const ServiceController = require('../controllers/serviceController');

const router = express.Router();
const serviceController = new ServiceController();

function setRoutes(app) {
    router.get('/services', serviceController.getAllServices.bind(serviceController));
    router.post('/services', serviceController.createService.bind(serviceController));
    router.post('/services/:id/book', serviceController.bookService.bind(serviceController));

    app.use('/api', router);
}

module.exports = setRoutes;