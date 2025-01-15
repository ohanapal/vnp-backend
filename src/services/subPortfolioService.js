const sheetDataModel = require('../models/sheetDataModel');
const SubPortfolio = require('../models/subPortfolioModel');
const AppError = require('../utils/appError');

const getAllSubPortfoliosName = async (role, connectedEntityIds, search = '') => {
  try {
    let query = {};
    let fieldToMatch = '';

    // Add regex-based search for sub_portfolio name
    const searchQuery = search
      ? { name: { $regex: search, $options: 'i' } } // Case-insensitive regex match
      : {};

    switch (role) {
      case 'admin':
        // If role is admin, fetch all sub-portfolio names
        const allSubPortfolios = await sheetDataModel
          .find({}, 'sub_portfolio') // Fetch only the sub_portfolio field
          .populate({
            path: 'sub_portfolio',
            select: 'name',
            match: searchQuery, // Apply regex match
          });

        return Array.from(
          new Map(
            allSubPortfolios
              .filter((item) => item.sub_portfolio) // Filter out null results from the regex match
              .map((item) => [
                item.sub_portfolio._id.toString(), // Use _id as the unique key
                { _id: item.sub_portfolio._id, name: item.sub_portfolio.name },
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

    // Fetch and populate sub-portfolio names with search applied
    const matchedData = await sheetDataModel
      .find(query, 'sub_portfolio') // Fetch only the sub_portfolio field
      .populate({
        path: 'sub_portfolio',
        select: 'name',
        match: searchQuery, // Apply regex match
      });

    // Remove duplicates and return unique sub-portfolio names
    return Array.from(
      new Map(
        matchedData
          .filter((item) => item.sub_portfolio) // Filter out null results from the regex match
          .map((item) => [
            item.sub_portfolio._id.toString(), // Use _id as the unique key
            { _id: item.sub_portfolio._id, name: item.sub_portfolio.name },
          ]),
      ).values(),
    );
  } catch (error) {
    console.error('Error fetching sub-portfolios:', error.message);
    throw error;
  }
};

const createSubPortfolio = async (data) => {
  const { name } = data;

  // Validation: Ensure the name is provided
  if (!name) {
    throw new AppError('Name is required');
  }

  // Check if a sub-portfolio with the same name already exists
  const existingSubPortfolio = await SubPortfolio.findOne({ name });
  if (existingSubPortfolio) {
    throw new AppError('Sub-portfolio with this name already exists');
  }

  // Create the new sub-portfolio
  const newSubPortfolio = new SubPortfolio({
    name,
  });

  await newSubPortfolio.save();
  return newSubPortfolio;
};

const updateSubPortfolio = async (id, name) => {
  // Validate input
  if (!name) {
    throw new AppError('Name is required');
  }

  // Check if another sub-portfolio with the same name already exists
  const existingSubPortfolio = await SubPortfolio.findOne({ name });
  if (existingSubPortfolio) {
    throw new AppError('Sub-portfolio with this name already exists');
  }

  // Find and update the sub-portfolio
  const updatedSubPortfolio = await SubPortfolio.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });

  if (!updatedSubPortfolio) {
    throw new AppError('Sub-portfolio not found');
  }

  return updatedSubPortfolio;
};

const deleteSubPortfolio = async (id) => {
  // Find and delete the sub-portfolio
  const deletedSubPortfolio = await SubPortfolio.findByIdAndDelete(id);

  if (!deletedSubPortfolio) {
    throw new Error('Sub-portfolio not found');
  }

  return deletedSubPortfolio;
};

module.exports = {
  getAllSubPortfoliosName,
  createSubPortfolio,
  updateSubPortfolio,
  deleteSubPortfolio,
};
