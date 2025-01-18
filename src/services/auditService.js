const sheetDataModel = require('../models/sheetDataModel');
const propertyModel = require('../models/propertyModel'); // Assuming this is your property model
const AppError = require('../utils/appError');
const { ObjectId } = require('mongodb');
const portfolioModel = require('../models/portfolioModel');
const logger = require('../utils/logger'); // Assuming logger is set up in utils/logger.js

const getAuditSheetData = async ({ page, limit, search, sortBy, sortOrder, filters, role, connectedEntityIds }) => {
  try {
    const skip = (page - 1) * limit; // Calculate the number of documents to skip for pagination
    logger.info('Building query for fetching sheet data', { page, limit, filters, role });
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
          logger.error('Error parsing sub_portfolio filter', { error: error.message });
          throw new AppError('Invalid sub-portfolio filter', 400);
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
          logger.error('Error parsing property filter', { error: error.message });
          throw new AppError('Invalid property filter', 400);
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
    logger.info('Query executed successfully', { total });
    return { data, total };
  } catch (error) {
    throw new Error(`Error fetching data: ${error.message}`);
  }
};

//with download option
// const getAuditSheetData = async ({
//   page,
//   limit,
//   search,
//   sortBy,
//   sortOrder,
//   filters,
//   role,
//   connectedEntityIds,
//   isDownload = false,
// }) => {
//   try {
//     const skip = (page - 1) * limit; // Calculate the number of documents to skip for pagination

//     // Build the query
//     const query = {};
//     // Admin role can view all data without restriction
//     if (role === 'admin') {
//       // Admin can search by portfolio name
//       if (search) {
//         const matchingPortfolios = await portfolioModel.find({ name: { $regex: search, $options: 'i' } });
//         const matchingPortfolioIds = matchingPortfolios.map((portfolio) => portfolio._id);
//         query.portfolio_name = { $in: matchingPortfolioIds };
//       }

//       // apply sub_portfolio filter
//       if (filters?.sub_portfolio) {
//         try {
//           query.sub_portfolio = new ObjectId(filters?.sub_portfolio);
//         } catch (error) {
//           console.error('Error fetching portfolio:', error);
//           throw new AppError(error.message);
//         }
//       }

//       if (filters?.startDate && filters?.endDate) {
//         query.from = {
//           $gte: new Date(filters.startDate),
//           $lt: new Date(filters.endDate),
//         };
//       }

//       // apply portfolio filter
//       if (filters?.property) {
//         try {
//           query.property_name = new ObjectId(filters?.property);
//         } catch (error) {
//           console.error('Error fetching portfolio:', error.message);
//           throw new AppError(error); // Ensure proper error handling
//         }
//       }

//       // Admin can apply posting_type filter
//       if (filters?.posting_type) {
//         query.posting_type = filters.posting_type;
//       }
//     } else {
//       // Non-admin roles should filter based on connectedEntityIds

//       if (role === 'portfolio') {
//         query.portfolio_name = { $in: connectedEntityIds };
//       } else if (role === 'sub-portfolio') {
//         query.sub_portfolio = { $in: connectedEntityIds };
//       } else if (role === 'property') {
//         query.property_name = { $in: connectedEntityIds };
//       }

//       // Apply search filter if provided (for non-admin roles)
//       if (search) {
//         const matchingPortfolios = await portfolioModel.find({ name: { $regex: search, $options: 'i' } });
//         const matchingPortfolioIds = matchingPortfolios.map((portfolio) => portfolio._id);

//         if (role === 'portfolio') {
//           query.portfolio_name = { $in: matchingPortfolioIds.filter((id) => connectedEntityIds.includes(id)) };
//         } else if (role === 'sub-portfolio') {
//           query.sub_portfolio = { $in: connectedEntityIds };
//           query.portfolio_name = { $in: matchingPortfolioIds };
//         } else if (role === 'property') {
//           query.property_name = { $in: connectedEntityIds };
//           query.portfolio_name = { $in: matchingPortfolioIds };
//         }
//       }
//     }

//     // Sorting
//     const sortOptions = {};
//     if (sortBy && sortOrder) {
//       sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
//     }

//     // Fetch data with pagination, search, filtering, and sorting
//     const data = await sheetDataModel
//       .find(query)
//       .populate('portfolio_name', 'name')
//       .populate('sub_portfolio', 'name')
//       .populate('property_name', 'name')
//       .sort(sortOptions)
//       .skip(skip)
//       .limit(limit);

//     // Count total documents for the query
//     const total = await sheetDataModel.countDocuments(query);

//     if (isDownload) {
//       // If it's a download request, generate the Excel file and return it
//       const excelJS = require('exceljs');
//       const workbook = new excelJS.Workbook();
//       const worksheet = workbook.addWorksheet('Audit Sheet');

//       worksheet.columns = [
//         { header: 'Portfolio Name', key: 'portfolio_name', width: 30 },
//         { header: 'Sub Portfolio', key: 'sub_portfolio', width: 30 },
//         { header: 'Property Name', key: 'property_name', width: 30 },
//         { header: 'Posting Type', key: 'posting_type', width: 20 },
//         { header: 'From', key: 'from', width: 20 },
//         { header: 'To', key: 'to', width: 20 },
//         // Add more columns as needed
//       ];

//       data.forEach((item) => {
//         worksheet.addRow({
//           portfolio_name: item.portfolio_name?.name,
//           sub_portfolio: item.sub_portfolio?.name,
//           property_name: item.property_name?.name,
//           posting_type: item.posting_type,
//           from: item.from,
//           to: item.to,
//           // Add more fields as necessary
//         });
//       });

//       return workbook.xlsx.writeBuffer(); // Return the Excel file as a buffer
//     }

//     return { data, total };
//   } catch (error) {
//     throw new Error(`Error fetching data: ${error.message}`);
//   }
// };

const updateAuditDataService = async (id, data, role, connectedEntityIds) => {
  logger.info(`Finding sheet data with ID: ${id}`);
  // Find the sheet data by ID
  const sheetData = await sheetDataModel.findById(id);
  if (!sheetData) {
    logger.error(`Sheet data with ID: ${id} not found`);
    throw new AppError('Sheet data not found', 404);
  }

  // Admin can update any sheet data
  if (role === 'admin') {
    logger.info(`Admin updating sheet data with ID: ${id}`);
    return await sheetDataModel.findByIdAndUpdate(id, data, { new: true });
  } else {
    // Non-admin roles should only be able to update based on connectedEntityIds
    if (
      (role === 'portfolio' && connectedEntityIds.includes(sheetData.portfolio_name.toString())) ||
      (role === 'sub-portfolio' && connectedEntityIds.includes(sheetData.sub_portfolio.toString())) ||
      (role === 'property' && connectedEntityIds.includes(sheetData.property_name.toString()))
    ) {
      // Handle portfolio_name field - check if it exists, else create
      // if (data.portfolio_name) {
      //   let portfolio = await portfolioModel.findOne({ name: data.portfolio_name });
      //   if (!portfolio) {
      //     portfolio = new portfolioModel({ name: data.portfolio_name });
      //     await portfolio.save();
      //   }
      //   data.portfolio_name = portfolio._id; // Use the ID in the sheet data
      // }

      // // Handle sub_portfolio field - check if it exists, else create
      // if (data.sub_portfolio) {
      //   let subPortfolio = await subPortfolioModel.findOne({ name: data.sub_portfolio });
      //   if (!subPortfolio) {
      //     subPortfolio = new subPortfolioModel({ name: data.sub_portfolio });
      //     await subPortfolio.save();
      //   }
      //   data.sub_portfolio = subPortfolio._id; // Use the ID in the sheet data
      // }

      // // Handle property_name field - check if it exists, else create
      // if (data.property_name) {
      //   let property = await propertyModel.findOne({ name: data.property_name });
      //   if (!property) {
      //     property = new propertyModel({ name: data.property_name });
      //     await property.save();
      //   }
      //   data.property_name = property._id; // Use the ID in the sheet data
      // }

      logger.info(`User with role: ${role} authorized to update sheet data with ID: ${id}`);
      // Restrict all users (admin and non-admin) from changing portfolio_name, sub_portfolio, and property_name
      if (data.portfolio_name || data.sub_portfolio || data.property_name) {
        logger.error(`Unauthorized field update attempt for sheet data with ID: ${id}`);
        throw new AppError(
          'The following fields are restricted for update: portfolio_name, sub_portfolio, or property_name',
          403,
        );
      }
      logger.info(`Updating sheet data with ID: ${id} for role: ${role}`);
      // Update the sheet data with the modified data
      return await sheetDataModel.findByIdAndUpdate(id, data, { new: true });
    } else {
      logger.error(`User with role: ${role} not authorized to update sheet data with ID: ${id}`);
      throw new AppError('You are not authorized to update this data', 403);
    }
  }
};

const deleteAuditDataService = async (id, role, connectedEntityIds) => {
  // const { role, connectedEntityIds } = user;

  // Find the sheet data by ID
  const sheetData = await sheetDataModel.findById(id);
  if (!sheetData) {
    throw new Error('Sheet data not found');
  }

  // Admin can delete any sheet data
  if (role === 'admin') {
    await sheetDataModel.findByIdAndDelete(id);
    return 'Sheet data deleted successfully';
  } else {
    // Non-admin roles should only be able to delete based on connectedEntityIds
    if (
      (role === 'portfolio' && connectedEntityIds?.includes(sheetData.portfolio_name.toString())) ||
      (role === 'sub-portfolio' && connectedEntityIds?.includes(sheetData.sub_portfolio.toString())) ||
      (role === 'property' && connectedEntityIds?.includes(sheetData.property_name.toString()))
    ) {
      await sheetDataModel.findByIdAndDelete(id);
      return 'Sheet data deleted successfully';
    } else {
      throw new Error('You are not authorized to delete this data');
    }
  }
};

const getSingleAuditDataService = async (id, role, connectedEntityIds) => {
  const sheetData = await sheetDataModel.findById(id).populate('portfolio_name sub_portfolio property_name');

  // console.log('connectedEntityIds:', connectedEntityIds);
  // console.log('role:', role);

  if (!sheetData) {
    throw new Error('Sheet data not found');
  }

  // Admin can access any sheet data
  if (role === 'admin') {
    return sheetData;
  }

  // Non-admin roles should only be able to access data based on connectedEntityIds
  if (
    (role === 'portfolio' && connectedEntityIds?.includes(sheetData.portfolio_name._id.toString())) ||
    (role === 'sub-portfolio' && connectedEntityIds?.includes(sheetData.sub_portfolio._id.toString())) ||
    (role === 'property' && connectedEntityIds?.includes(sheetData.property_name._id.toString()))
  ) {
    return sheetData;
  } else {
    throw new Error('You are not authorized to access this data');
  }
};


module.exports = {
  getAuditSheetData,
  getSingleAuditDataService,
  deleteAuditDataService,
  updateAuditDataService,
};
