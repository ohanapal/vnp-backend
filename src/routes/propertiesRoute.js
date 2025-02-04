const express = require('express');
const {
  sheetDataController,
  updateSheetDataController,
  deleteSheetDataController,
  getSingleSheetData,
  getAllProperties,
  createPropertyController,
  deletePropertyController,
  updatePropertyController,
} = require('../controllers/propertiesController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define the route
router.get('/get-data', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), sheetDataController);
router.get('/delete-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), deleteSheetDataController);
router.get('/update-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), updateSheetDataController);
router.get('/single-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getSingleSheetData);
router.get('/get-properties', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getAllProperties);
router.post('/create', authMiddleware('admin'), createPropertyController);
router.put('/update/:id', authMiddleware('admin'), updatePropertyController);
router.delete('/delete/:id', authMiddleware('admin'), deletePropertyController);
module.exports = router;
