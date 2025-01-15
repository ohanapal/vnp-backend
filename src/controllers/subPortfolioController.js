const {
  getAllSubPortfoliosName,
  createSubPortfolio,
  updateSubPortfolio,
  deleteSubPortfolio,
} = require('../services/subPortfolioService');

const getAllSubPortfolios = async (req, res) => {
  const { role, connected_entity_id: connectedEntityIds } = req.user;
  try {
    const { search } = req.query;
    const allPortfolios = await getAllSubPortfoliosName(role, connectedEntityIds, search);
    return res.status(200).json(allPortfolios);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// controllers/subPortfolioController.js

const createSubPortfolioController = async (req, res) => {
  try {
    const newSubPortfolio = await createSubPortfolio(req.body);

    return res.status(201).json({
      success: true,
      message: 'Sub-portfolio created successfully',
      data: newSubPortfolio,
    });
  } catch (error) {
    console.error('Error creating sub-portfolio:', error.message);

    if (error.message === 'Name is required' || error.message === 'Sub-portfolio with this name already exists') {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateSubPortfolioController = async (req, res) => {
  try {
    const { id } = req.params; // ID from the URL parameter
    const { name } = req.body;

    // Call the service to update the sub-portfolio
    const updatedSubPortfolio = await updateSubPortfolio(id, name);

    return res.status(200).json({
      success: true,
      message: 'Sub-portfolio updated successfully',
      data: updatedSubPortfolio,
    });
  } catch (error) {
    console.error('Error updating sub-portfolio:', error.message);

    // Determine error type
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

const deleteSubPortfolioController = async (req, res) => {
  try {
    const { id } = req.params; // ID from the URL parameter

    // Call the service to delete the sub-portfolio
    const deletedSubPortfolio = await deleteSubPortfolio(id);

    return res.status(200).json({
      success: true,
      message: 'Sub-portfolio deleted successfully',
      data: deletedSubPortfolio,
    });
  } catch (error) {
    console.error('Error deleting sub-portfolio:', error.message);

    // Determine error type
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllSubPortfolios,
  createSubPortfolioController,
  updateSubPortfolioController,
  deleteSubPortfolioController,
};
