const express = require('express');
const tourController = require('../controllers/tourController');
const router = express.Router();

router.route('/').post(tourController.createTour).get(tourController.getAllTour);

module.exports = router;
