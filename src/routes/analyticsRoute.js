const express = require('express');
const { getMetrics } = require('../controllers/cardController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { revenue, distributionStatus } = require('../controllers/dashboardController');

const router = express.Router();

// Define the route
router.get('/card-metrics', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getMetrics);
router.get('/revenue-metrics', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), revenue);
router.get('/distribution-metrics', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), distributionStatus);

module.exports = router;
