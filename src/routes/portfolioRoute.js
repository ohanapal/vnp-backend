const express = require('express');
const {
  getAllPortfolios,
  createPortfolioController,
  updatePortfolioController,
  deletePortfolioController,
  uploadContractController,
} = require('../controllers/portfolioController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define the route
router.get('/get-portfolios', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getAllPortfolios);
router.post('/create', authMiddleware('admin'), createPortfolioController);
router.put('/update/:id', authMiddleware('admin'), updatePortfolioController);
router.delete('/delete/:id', authMiddleware('admin'), deletePortfolioController);
router.put('/upload-contract-file', authMiddleware('admin'), uploadContractController);

module.exports = router;
