const sheetDataModel = require('../models/sheetDataModel');
const portfolioModel = require('../models/portfolioModel');

const getAllPortfoliosName = async (role, connectedEntityIds, search = '') => {
  try {
    let query = {};
    let fieldToMatch = '';

    // Add regex-based search for portfolio_name
    const searchQuery = search
      ? { name: { $regex: search, $options: 'i' } } // Case-insensitive regex match
      : {};

    switch (role) {
      case 'admin':
        // If role is admin, fetch all portfolio names
        const allPortfolios = await sheetDataModel
          .find({}, 'portfolio_name') // Fetch only the portfolio_name field
          .populate({
            path: 'portfolio_name',
            select: 'name',
            match: searchQuery, // Apply regex match
          });

        return Array.from(
          new Map(
            allPortfolios
              .filter((item) => item.portfolio_name) // Filter out null results from the regex match
              .map((item) => [
                item.portfolio_name._id.toString(), // Use _id as the unique key
                { _id: item.portfolio_name._id, name: item.portfolio_name.name },
              ]),
          ).values(),
        );

      case 'portfolio':
        fieldToMatch = 'portfolio_name';
        break;

      case 'sub-portfolio':
        fieldToMatch = 'sub_portfolio';
        break;

      case 'property':
        fieldToMatch = 'property_name';
        break;

      default:
        throw new Error('Invalid role');
    }

    // Build the query
    query[fieldToMatch] = { $in: connectedEntityIds };

    // Fetch and populate portfolio names with search applied
    const matchedData = await sheetDataModel
      .find(query, 'portfolio_name') // Fetch only the portfolio_name field
      .populate({
        path: 'portfolio_name',
        select: 'name',
        match: searchQuery, // Apply regex match
      });

    // Remove duplicates and return unique portfolio names
    return Array.from(
      new Map(
        matchedData
          .filter((item) => item.portfolio_name) // Filter out null results from the regex match
          .map((item) => [
            item.portfolio_name._id.toString(), // Use _id as the unique key
            { _id: item.portfolio_name._id, name: item.portfolio_name.name },
          ]),
      ).values(),
    );
  } catch (error) {
    console.error('Error fetching portfolios:', error.message);
    throw error;
  }
};

const createPortfolio = async (data) => {
  const { name } = data;

  // Validation: Ensure the name is provided
  if (!name) {
    throw new AppError('Name is required');
  }

  // Check if a sub-portfolio with the same name already exists
  const existingPortfolio = await portfolioModel.findOne({ name });
  if (existingPortfolio) {
    throw new AppError('portfolio with this name already exists');
  }

  // Create the new sub-portfolio
  const newPortfolio = new portfolioModel({
    name,
  });

  await newPortfolio.save();
  return newPortfolio;
};

const updatePortfolio = async (id, name) => {
  // Validate input
  if (!name) {
    throw new AppError('Name is required');
  }

  // Check if another sub-portfolio with the same name already exists
  const existingPortfolio = await portfolioModel.findOne({ name });
  if (existingPortfolio) {
    throw new AppError('portfolio with this name already exists');
  }

  // Find and update the sub-portfolio
  const updatedPortfolio = await portfolioModel.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });

  if (!updatedPortfolio) {
    throw new AppError('portfolio not found');
  }

  return updatedPortfolio;
};

const deletePortfolio = async (id) => {
  // Find and delete the sub-portfolio
  const deletedPortfolio = await portfolioModel.findByIdAndDelete(id);

  if (!deletedPortfolio) {
    throw new Error('portfolio not found');
  }

  return deletedPortfolio;
};

const uploadContractService = async (data) => {
  const updatePromises = data.map(async ({ id, uploadedUrl }) => {
    try {
      const updatedPortfolio = await portfolioModel.findByIdAndUpdate(
        id,
        { contracts: uploadedUrl },
        { new: true, runValidators: true },
      );

      if (!updatedPortfolio) {
        throw new Error(`Portfolio with ID ${id} not found.`);
      }

      return { status: 'fulfilled', id, updatedPortfolio };
    } catch (error) {
      return { status: 'rejected', id, error: error.message };
    }
  });

  // Use Promise.allSettled to ensure we capture all outcomes
  const results = await Promise.allSettled(updatePromises);

  // Parse results to separate successes and failures
  const successfulUpdates = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);

  const failedUpdates = results
    .filter((result) => result.status === 'rejected')
    .map((result) => ({
      id: result.reason?.id || 'Unknown',
      error: result.reason?.error || 'Unknown error',
    }));

  return { successfulUpdates, failedUpdates };
};

module.exports = {
  getAllPortfoliosName,
  createPortfolio,
  deletePortfolio,
  updatePortfolio,
  uploadContractService,
};
