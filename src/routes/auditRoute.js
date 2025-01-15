const express = require('express');
const {
  sheetDataController,
  updateAuditDataController,
  deleteAuditDataController,
  getSingleAuditData,
} = require('../controllers/auditController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define the route
router.get('/get-data', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), sheetDataController);
router.get('/delete-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), deleteAuditDataController);
router.get('/update-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), updateAuditDataController);
router.get('/single-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getSingleAuditData);

module.exports = router;
