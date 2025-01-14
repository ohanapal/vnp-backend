const express = require('express');
const { getMetrics } = require('../controllers/cardController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { revenue, distributionStatus, OTAPerformance, propertyPerformance } = require('../controllers/dashboardController');

const router = express.Router();

// Define the route
router.get('/card-metrics', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getMetrics);
router.get('/revenue-metrics', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), revenue);
router.get('/distribution-metrics', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), distributionStatus);
router.get('/ota-performance-metrics', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), OTAPerformance);

router.get(
  '/portfolio-performance-metrics',
  authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'),
  propertyPerformance,
);

module.exports = router;
