const { getAllPortfoliosName, createPortfolio, updatePortfolio, deletePortfolio } = require('../services/portfolioService');

const getAllPortfolios = async (req, res) => {
  const { role, connected_entity_id: connectedEntityIds } = req.user;
  try {
    const { search } = req.query;
    const allPortfolios = await getAllPortfoliosName(role, connectedEntityIds, search);
    return res.status(200).json(allPortfolios);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createPortfolioController = async (req, res) => {
  try {
    const newPortfolio = await createPortfolio(req.body);

    return res.status(201).json({
      success: true,
      message: 'portfolio created successfully',
      data: newPortfolio,
    });
  } catch (error) {
    console.error('Error creating sub-portfolio:', error.message);

    if (error.message === 'Name is required' || error.message === 'portfolio with this name already exists') {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updatePortfolioController = async (req, res) => {
  try {
    const { id } = req.params; // ID from the URL parameter
    const { name } = req.body;

    // Call the service to update the sub-portfolio
    const updatedPortfolio = await updatePortfolio(id, name);

    return res.status(200).json({
      success: true,
      message: 'portfolio updated successfully',
      data: updatedPortfolio,
    });
  } catch (error) {
    console.error('Error updating portfolio:', error.message);

    // Determine error type
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

const deletePortfolioController = async (req, res) => {
  try {
    const { id } = req.params; // ID from the URL parameter

    // Call the service to delete the sub-portfolio
    const deletedPortfolio = await deletePortfolio(id);

    return res.status(200).json({
      success: true,
      message: 'portfolio deleted successfully',
      data: deletedPortfolio,
    });
  } catch (error) {
    console.error('Error deleting portfolio:', error.message);

    // Determine error type
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPortfolios,
  createPortfolioController,
  updatePortfolioController,
  deletePortfolioController,
};
