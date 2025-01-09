const express = require('express');
const { getMetrics } = require('../controllers/cardController');

const router = express.Router();

// Define the route
router.get('/card-metrics', getMetrics);

module.exports = router;
