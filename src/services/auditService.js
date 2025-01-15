const sheetDataModel = require('../models/sheetDataModel');
const propertyModel = require('../models/propertyModel'); // Assuming this is your property model
const AppError = require('../utils/appError');
const { ObjectId } = require('mongodb');
const portfolioModel = require('../models/portfolioModel');

const getAuditSheetData = async ({ page, limit, search, sortBy, sortOrder, filters, role, connectedEntityIds }) => {
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

      // apply sub_portfolio filter
      if (filters?.sub_portfolio) {
        try {
          query.sub_portfolio = new ObjectId(filters?.sub_portfolio);
        } catch (error) {
          console.error('Error fetching portfolio:', error);
          throw new AppError(error.message);
        }
      }

      if (filters?.startDate && filters?.endDate) {
        query.from = {
          $gte: new Date(filters.startDate),
          $lt: new Date(filters.endDate),
        };
      }

      // apply portfolio filter
      if (filters?.property) {
        try {
          // console.log('filters.portfolio:', filters.portfolio);
          query.property_name = new ObjectId(filters?.property);
        } catch (error) {
          console.error('Error fetching portfolio:', error.message);
          throw new AppError(error); // Ensure proper error handling
        }
      }

      // Admin can apply posting_type filter
      if (filters?.posting_type) {
        query.posting_type = filters.posting_type;
      }
      console.log('query', query);
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
        // Find matching portfolios based on the search term
        const matchingPortfolios = await portfolioModel.find({ name: { $regex: search, $options: 'i' } });
        const matchingPortfolioIds = matchingPortfolios.map((portfolio) => portfolio._id);

        // Ensure search results are scoped by role and connectedEntityIds
        if (role === 'portfolio') {
          // Only return portfolios in the search and user's connectedEntityIds
          query.portfolio_name = { $in: matchingPortfolioIds.filter((id) => connectedEntityIds.includes(id)) };
        } else if (role === 'sub-portfolio') {
          // Only return sub-portfolios connected to the user
          query.sub_portfolio = { $in: connectedEntityIds };

          // Filter sub-portfolios by portfolios from the search
          query.portfolio_name = { $in: matchingPortfolioIds };
        } else if (role === 'property') {
          // Ensure properties belong to the user's connectedEntityIds
          query.property_name = { $in: connectedEntityIds };

          // Additionally, filter by portfolios from the search
          query.portfolio_name = { $in: matchingPortfolioIds };
        }
      }

      if (filters?.startDate && filters?.endDate) {
        if (role === 'portfolio') {
          query.from = {
            $gte: new Date(filters.startDate),
            $lt: new Date(filters.endDate),
          }; // Only return portfolios in the search and user's connectedEntityIds
          query.portfolio_name = { $in: connectedEntityIds };
        } else if (role === 'sub-portfolio') {
          query.from = {
            $gte: new Date(filters.startDate),
            $lt: new Date(filters.endDate),
          };
          // Only return sub-portfolios connected to the user
          query.sub_portfolio = { $in: connectedEntityIds };
        } else if (role === 'property') {
          // Ensure properties belong to the user's connectedEntityIds
          query.property_name = { $in: connectedEntityIds };

          // Additionally, filter by portfolios from the search
          query.from = {
            $gte: new Date(filters.startDate),
            $lt: new Date(filters.endDate),
          };
        }
      }

      // Apply other filters (sub_portfolio, posting_type)
      if (filters?.sub_portfolio) {
        try {
          if (role === 'portfolio') {
            query.sub_portfolio = new ObjectId(filters?.sub_portfolio);
            // Only return portfolios in the search and user's connectedEntityIds
            query.portfolio_name = { $in: connectedEntityIds };
          } else if (role === 'sub-portfolio') {
            query.sub_portfolio = new ObjectId(filters?.sub_portfolio);

            // Only return sub-portfolios connected to the user
            query.sub_portfolio = { $in: connectedEntityIds };
          } else if (role === 'property') {
            // Ensure properties belong to the user's connectedEntityIds
            query.property_name = { $in: connectedEntityIds };

            // Additionally, filter by portfolios from the search
            query.sub_portfolio = new ObjectId(filters?.sub_portfolio);
          }
        } catch (error) {
          console.error('Error fetching portfolio:', error);
          throw new AppError(error.message);
        }
      }

      // apply portfolio filter
      if (filters?.property) {
        try {
          // console.log('filters.portfolio:', filters.portfolio);
          query.portfolio_name = new ObjectId(filters?.portfolio);
          if (role === 'portfolio') {
            query.property_name = new ObjectId(filters?.property);
            // Only return portfolios in the search and user's connectedEntityIds
            query.portfolio_name = { $in: connectedEntityIds };
          } else if (role === 'sub-portfolio') {
            query.property_name = new ObjectId(filters?.property);
            // Only return sub-portfolios connected to the user
            query.sub_portfolio = { $in: connectedEntityIds };
          } else if (role === 'property') {
            // Ensure properties belong to the user's connectedEntityIds
            query.property_name = { $in: connectedEntityIds };

            // Additionally, filter by portfolios from the search
            query.property_name = new ObjectId(filters?.property);
          }
        } catch (error) {
          console.error('Error fetching property:', error.message);
          throw new AppError(error); // Ensure proper error handling
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
  getAuditSheetData,
};
