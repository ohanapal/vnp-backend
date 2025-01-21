const express = require('express');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const {
  sheetDataController,
  updateAuditDataController,
  deleteAuditDataController,
  getSingleAuditData,
  updateAuditFiles,
} = require('../controllers/auditController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const uploadS3 = require('../utils/uploadS3');
const router = express.Router();

// Define the route
router.get('/get-data', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), sheetDataController);
router.get('/delete-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), deleteAuditDataController);
router.get('/update-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), updateAuditDataController);
router.get('/single-data/:id', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getSingleAuditData);
router.post('/upload', upload.single('file'), uploadS3.uploadFile);
router.get('/upload-audit-file', authMiddleware('admin'), updateAuditFiles);

module.exports = router;
