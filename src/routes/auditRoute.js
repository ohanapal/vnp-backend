const express = require('express');
const {
  sheetDataController,
  updateSheetDataController,
  deleteSheetDataController,
  getSingleSheetData,
} = require('../controllers/auditController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define the route
router.get('/get-data', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), sheetDataController);
// router.get('/delete-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), deleteSheetDataController);
// router.get('/update-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), updateSheetDataController);
// router.get('/single-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getSingleSheetData);

module.exports = router;
