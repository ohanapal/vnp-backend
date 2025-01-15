const express = require('express');
const {
  getAllSubPortfolios,
  createSubPortfolioController,
  updateSubPortfolioController,
  deleteSubPortfolioController,
} = require('../controllers/subPortfolioController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define the route
router.get('/get-subportfolios', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getAllSubPortfolios);
router.post('/create', authMiddleware('admin'), createSubPortfolioController);
router.put('/update/:id', authMiddleware('admin'), updateSubPortfolioController);
router.delete('/delete/:id', authMiddleware('admin'), deleteSubPortfolioController);

module.exports = router;
