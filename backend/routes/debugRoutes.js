const express = require('express');
const router = express.Router();
const { addDebugService, getDebugServices } = require('../controllers/debugController');

router.post('/add-service', addDebugService);
router.get('/services', getDebugServices);

module.exports = router;
