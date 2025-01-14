const express = require('express');
const { sheetDataController } = require('../controllers/propertiesController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define the route
router.get('/get-data', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), sheetDataController);

module.exports = router;
