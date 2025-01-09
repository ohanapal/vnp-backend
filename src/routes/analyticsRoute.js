const express = require('express');
const { getMetrics } = require('../controllers/cardController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define the route
router.get('/card-metrics', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getMetrics);

module.exports = router;
