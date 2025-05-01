const sheetDataModel = require('../models/sheetDataModel');
const propertyModel = require('../models/propertyModel'); // Assuming this is your property model
const AppError = require('../utils/appError');
const { ObjectId } = require('mongodb');
const portfolioModel = require('../models/portfolioModel');
const logger = require('../utils/logger'); // Assuming logger is set up in utils/logger.js
const axios = require('axios'); // Ensure axios is installed and imported

const getAuditSheetData = async ({ page, limit, search, sortBy, sortOrder, filters, role, connectedEntityIds }) => {
  try {
    const skip = (page - 1) * limit;
    logger.info('Building query for fetching sheet data', { page, limit, filters, role });

    // Build the query object
    const query = {};

    // NEW: Apply the nextAuditId filter regardless of role.
    if (filters?.nextAuditId) {
      let ids = [];
      if (Array.isArray(filters.nextAuditId)) {
        ids = filters.nextAuditId;
      } else {
        ids = filters.nextAuditId.split(',').map((id) => id.trim());
      }
      try {
        query._id = { $in: ids.map((id) => new ObjectId(id)) };
      } catch (error) {
        logger.error('Error parsing nextAuditId filter', { error: error.message });
        throw new AppError('Invalid nextAuditId filter', 400);
      }
    }

    // Handle search parameter
    if (search) {
      // Check if the search term looks like an ID
      const isIdSearch = /^[A-Za-z0-9-_]+$/.test(search);

      if (isIdSearch) {
        // ID search - check against booking_id, expedia_id, and agoda_id
        const idSearchConditions = [
          { 'booking.booking_id': search },
          { 'expedia.expedia_id': search },
          { 'agoda.agoda_id': search }
        ];

        if (role === 'admin') {
          query.$or = idSearchConditions;
        } else {
          // For non-admin, combine ID search with role-based restrictions
          if (role === 'portfolio') {
            query.$and = [
              { $or: idSearchConditions },
              { portfolio_name: { $in: connectedEntityIds } }
            ];
          } else if (role === 'sub-portfolio') {
            query.$and = [
              { $or: idSearchConditions },
              { sub_portfolio: { $in: connectedEntityIds } }
            ];
          } else if (role === 'property') {
            query.$and = [
              { $or: idSearchConditions },
              { property_name: { $in: connectedEntityIds } }
            ];
          }
        }
      } else {
        // Property name search
        const matchingPortfolios = await portfolioModel.find({ name: { $regex: search, $options: 'i' } });
        const matchingPortfolioIds = matchingPortfolios.map((portfolio) => portfolio._id);
        const matchingProperties = await propertyModel.find({
          name: { $regex: search, $options: 'i' },
        });
        const matchingPropertyIds = matchingProperties.map((property) => property._id);

        if (role === 'admin') {
          query.$or = [
            { portfolio_name: { $in: matchingPortfolioIds } },
            { property_name: { $in: matchingPropertyIds } }
          ];
        } else {
          // For non-admin, combine property search with role-based restrictions
          if (role === 'portfolio') {
            query.$and = [
              {
                $or: [
                  { portfolio_name: { $in: matchingPortfolioIds } },
                  { property_name: { $in: matchingPropertyIds } }
                ]
              },
              { portfolio_name: { $in: connectedEntityIds } }
            ];
          } else if (role === 'sub-portfolio') {
            query.$and = [
              {
                $or: [
                  { portfolio_name: { $in: matchingPortfolioIds } },
                  { property_name: { $in: matchingPropertyIds } }
                ]
              },
              { sub_portfolio: { $in: connectedEntityIds } }
            ];
          } else if (role === 'property') {
            query.$and = [
              {
                $or: [
                  { portfolio_name: { $in: matchingPortfolioIds } },
                  { property_name: { $in: matchingPropertyIds } }
                ]
              },
              { property_name: { $in: connectedEntityIds } }
            ];
          }
        }
      }
    } else {
      // If no search, apply role-based restrictions
      if (role !== 'admin') {
        if (role === 'portfolio') {
          query.portfolio_name = { $in: connectedEntityIds };
        } else if (role === 'sub-portfolio') {
          query.sub_portfolio = { $in: connectedEntityIds };
        } else if (role === 'property') {
          query.property_name = { $in: connectedEntityIds };
        }
      }
    }

    // Apply filters
    if (filters?.portfolio) {
      try {
        query.portfolio_name = new ObjectId(filters?.portfolio);
      } catch (error) {
        logger.error('Error parsing portfolio filter', { error: error.message });
        throw new AppError('Invalid portfolio filter', 400);
      }
    }
    if (filters?.sub_portfolio) {
      try {
        query.sub_portfolio = new ObjectId(filters?.sub_portfolio);
      } catch (error) {
        logger.error('Error parsing sub_portfolio filter', { error: error.message });
        throw new AppError('Invalid sub-portfolio filter', 400);
      }
    }
    if (filters?.property) {
      try {
        query.property_name = new ObjectId(filters?.property);
      } catch (error) {
        logger.error('Error parsing property filter', { error: error.message });
        throw new AppError('Invalid property filter', 400);
      }
    }
    if (filters?.posting_type) {
      query.posting_type = filters.posting_type;
    }
    if (filters?.startDate && filters?.endDate) {
      query.from = {
        $gte: new Date(filters.startDate),
        $lt: new Date(filters.endDate),
      };
    }

    // Sorting
    const sortOptions = {};
    if (sortBy && sortOrder) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // console.log('Final query:', JSON.stringify(query, null, 2));
    // Fetch data with pagination, filtering, and sorting
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

const deleteSheetDataService = async (id, role, connectedEntityIds) => {
  // Find the sheet data by ID
  const sheetData = await sheetDataModel.findById(id);
  if (!sheetData) {
    throw new Error('Sheet data not found');
  }

  const { unique_id } = sheetData;

  // Delete the row from Google Sheets via the API
  try {
    await deleteRow(unique_id);
  } catch (error) {
    console.error('Error deleting row from Google Sheets:', error.message);
    throw new Error('Failed to delete row from Google Sheets');
  }

  // After the row is deleted from Google Sheets, remove the sheet data from your model
  await sheetDataModel.findByIdAndDelete(id);

  return 'Sheet data deleted successfully';
};

async function deleteRow(uniqueId) {
  const scriptUrl = process.env.SHEET_SCRIPT_URL; // Replace with your Web App URL

  // console.log('Script URL: ', process.env.SHEET_SCRIPT_URL);
  try {
    const response = await axios.post(scriptUrl, { uniqueId });
    console.log('Google Apps Script Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error calling Google Apps Script API:', error.message);
    throw error; // Re-throwing error so the calling function can handle it
  }
}

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

// Function to process updates
const updateAuditFiles = async (data) => {
  const updatePromises = data.map(async ({ id, uploadedUrl }) => {
    try {
      const updatedSheet = await sheetDataModel.findByIdAndUpdate(
        id,
        { audit_uploaded_file: uploadedUrl },
        { new: true, runValidators: true },
      );

      if (!updatedSheet) {
        throw new Error(`Sheet with ID ${id} not found.`);
      }

      return { status: 'fulfilled', id, updatedSheet };
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

const uploadContactService = async (data) => {
  const updatePromises = data.map(async ({ id, uploadedUrl }) => {
    try {
      const updatedSheet = await sheetDataModel.findByIdAndUpdate(
        id,
        { contracts: uploadedUrl },
        { new: true, runValidators: true },
      );

      if (!updatedSheet) {
        throw new Error(`Sheet with ID ${id} not found.`);
      }

      return { status: 'fulfilled', id, updatedSheet };
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
  getAuditSheetData,
  getSingleAuditDataService,
  deleteSheetDataService,
  updateAuditDataService,
  updateAuditFiles,
  uploadContactService,
};
