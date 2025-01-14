const sheetDataModel = require('../models/sheetDataModel');
const portfolioModel = require('../models/portfolioModel');
const subPortfolioModel = require('../models/subPortfolioModel'); // Import the SubPortfolio model

const getPortfolioSheetData = async ({ page, limit, search, sortBy, sortOrder, filters, role, connectedEntityIds }) => {
  try {
    const skip = (page - 1) * limit; // Calculate the number of documents to skip for pagination

    // Build the query
    const query = {};
    // console.log('connectedEntityIds:', connectedEntityIds);


    // Admin role can view all data without restriction
    if (role === 'admin') {
      // Admin can search by portfolio name
      if (search) {
        const matchingPortfolios = await portfolioModel.find({ name: { $regex: search, $options: 'i' } });
        const matchingPortfolioIds = matchingPortfolios.map((portfolio) => portfolio._id);
        query.portfolio_name = { $in: matchingPortfolioIds };
      }

      // Admin can apply sub_portfolio filter
      if (filters?.sub_portfolio) {
        const matchingSubPortfolio = await subPortfolioModel.findOne({ name: filters.sub_portfolio });
        if (matchingSubPortfolio) {
          query.sub_portfolio = matchingSubPortfolio._id;
        } else {
          throw new Error(`SubPortfolio with name '${filters.sub_portfolio}' not found.`);
        }
      }

      // Admin can apply posting_type filter
      if (filters?.posting_type) {
        query.posting_type = filters.posting_type;
      }
    } else {
      // Non-admin roles should filter based on connectedEntityIds

      if (role === 'portfolio') {
        // Filter for portfolio data based on connectedEntityIds
        query.portfolio_name = { $in: connectedEntityIds };
      } else if (role === 'sub-portfolio') {
        // Filter for sub-portfolio data based on connectedEntityIds
        query.sub_portfolio = { $in: connectedEntityIds };
      } else if (role === 'property') {
        // Filter for property data based on connectedEntityIds
        query.property_name = { $in: connectedEntityIds };
      }

      // Apply search filter if provided (for non-admin roles)
      if (search) {
        const matchingPortfolios = await portfolioModel.find({ name: { $regex: search, $options: 'i' } });
        const matchingPortfolioIds = matchingPortfolios.map((portfolio) => portfolio._id);
        query.portfolio_name = { $in: matchingPortfolioIds };
      }

      // Apply other filters (sub_portfolio, posting_type)
      if (filters?.sub_portfolio) {
        const matchingSubPortfolio = await subPortfolioModel.findOne({ name: filters.sub_portfolio });
        if (matchingSubPortfolio) {
          query.sub_portfolio = matchingSubPortfolio._id;
        } else {
          throw new Error(`SubPortfolio with name '${filters.sub_portfolio}' not found.`);
        }
      }

      if (filters?.posting_type) {
        query.posting_type = filters.posting_type;
      }
    }

    // Sorting
    const sortOptions = {};
    if (sortBy && sortOrder) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // console.log('query', query);

    // Fetch data with pagination, search, filtering, and sorting
    const data = await sheetDataModel
      .find(query)
      .populate('portfolio_name', 'name')
      .populate('sub_portfolio', 'name')
      .populate('property_name', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Count total documents for the query
    const total = await sheetDataModel.countDocuments(query);

    return { data, total };
  } catch (error) {
    throw new Error(`Error fetching data: ${error.message}`);
  }
};

module.exports = {
  getPortfolioSheetData,
};
