const express = require('express');
const ServiceController = require('../controllers/serviceController');

const router = express.Router();

function setRoutes(app) {
    router.get('/services', ServiceController.getAllServices);
    router.post('/services', ServiceController.createService);
    router.post('/services/:id/book', ServiceController.bookService);

    app.use('/api', router);
}

module.exports = setRoutes;