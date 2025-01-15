const sheetDataModel = require('../models/sheetDataModel');
const portfolioModel = require('../models/portfolioModel');
const subPortfolioModel = require('../models/subPortfolioModel'); // Import the SubPortfolio model
const propertyModel = require('../models/propertyModel'); // Assuming this is your property model
const AppError = require('../utils/appError');
const { ObjectId } = require('mongodb');

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
        const matchingProperty = await propertyModel.find({ name: { $regex: search, $options: 'i' } });
        const matchingPropertiesIds = matchingProperty.map((property) => property._id);
        query.property_name = { $in: matchingPropertiesIds };
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

      // apply portfolio filter
      if (filters?.portfolio) {
        try {
          // console.log('filters.portfolio:', filters.portfolio);
          query.portfolio_name = new ObjectId(filters?.portfolio);
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
        const matchingProperrty = await propertyModel.find({ name: { $regex: search, $options: 'i' } });
        const matchingPropertiesIds = matchingProperrty.map((property) => property._id);
        query.property_name = { $in: matchingPropertiesIds };
      }

      // Apply other filters (sub_portfolio, posting_type)
      if (filters?.sub_portfolio) {
        try {
          query.sub_portfolio = new ObjectId(filters?.sub_portfolio);
        } catch (error) {
          console.error('Error fetching portfolio:', error);
          throw new AppError(error.message);
        }
      }

      // apply portfolio filter
      if (filters?.portfolio) {
        try {
          // console.log('filters.portfolio:', filters.portfolio);
          query.portfolio_name = new ObjectId(filters?.portfolio);
        } catch (error) {
          console.error('Error fetching portfolio:', error.message);
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

const updateSheetDataService = async (id, data, role, connectedEntityIds) => {
  // Find the sheet data by ID
  const sheetData = await sheetDataModel.findById(id);
  if (!sheetData) {
    throw new Error('Sheet data not found');
  }

  // Admin can update any sheet data
  if (role === 'admin') {
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

      // Restrict all users (admin and non-admin) from changing portfolio_name, sub_portfolio, and property_name
      if (data.portfolio_name || data.sub_portfolio || data.property_name) {
        throw new Error('Those field are restricted for update:- portfolio_name, sub_portfolio, or property_name');
      }

      // Update the sheet data with the modified data
      return await sheetDataModel.findByIdAndUpdate(id, data, { new: true });
    } else {
      throw new AppError('You are not authorized to update this data');
    }
  }
};

const deleteSheetDataService = async (id, role, connectedEntityIds) => {
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

const getSingleSheetDataService = async (id, role, connectedEntityIds) => {
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

const getAllPropertiesName = async (role, connectedEntityIds, search = '') => {
  try {
    let query = {};
    let fieldToMatch = '';

    // Add regex-based search for property_name
    const searchQuery = search
      ? { name: { $regex: search, $options: 'i' } } // Case-insensitive regex match
      : {};

    switch (role) {
      case 'admin':
        // If role is admin, fetch all property names
        const allProperties = await sheetDataModel
          .find({}, 'property_name') // Fetch only the property_name field
          .populate({
            path: 'property_name',
            select: 'name',
            match: searchQuery, // Apply regex match
          });

        return Array.from(
          new Map(
            allProperties
              .filter((item) => item.property_name) // Filter out null results from the regex match
              .map((item) => [
                item.property_name._id.toString(), // Use _id as the unique key
                { _id: item.property_name._id, name: item.property_name.name },
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

    // Fetch and populate property names with search applied
    const matchedData = await sheetDataModel
      .find(query, 'property_name') // Fetch only the property_name field
      .populate({
        path: 'property_name',
        select: 'name',
        match: searchQuery, // Apply regex match
      });

    // Remove duplicates and return unique property names
    return Array.from(
      new Map(
        matchedData
          .filter((item) => item.property_name) // Filter out null results from the regex match
          .map((item) => [
            item.property_name._id.toString(), // Use _id as the unique key
            { _id: item.property_name._id, name: item.property_name.name },
          ]),
      ).values(),
    );
  } catch (error) {
    console.error('Error fetching properties:', error.message);
    throw error;
  }
};

const createProperty = async (data) => {
  const { name } = data;

  // Validation: Ensure the name is provided
  if (!name) {
    throw new AppError('Name is required');
  }

  // Check if a sub-portfolio with the same name already exists
  const existingProperty = await propertyModel.findOne({ name });
  if (existingProperty) {
    throw new AppError('property with this name already exists');
  }

  // Create the new sub-portfolio
  const newProperty = new propertyModel({
    name,
  });

  await newProperty.save();
  return newProperty;
};

const updateProperty = async (id, name) => {
  // Validate input
  if (!name) {
    throw new AppError('Name is required');
  }

  // Check if another sub-portfolio with the same name already exists
  const existingProperty = await propertyModel.findOne({ name });
  if (existingProperty) {
    throw new AppError('property with this name already exists');
  }

  // Find and update the sub-portfolio
  const updatedProperty = await propertyModel.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });

  if (!updatedProperty) {
    throw new AppError('property not found');
  }

  return updatedProperty;
};

const deleteProperty = async (id) => {
  // Find and delete the sub-portfolio
  const deletedProperty = await propertyModel.findByIdAndDelete(id);

  if (!deletedProperty) {
    throw new Error('property not found');
  }

  return deletedProperty;
};


module.exports = {
  getPortfolioSheetData,
  updateSheetDataService,
  deleteSheetDataService,
  getSingleSheetDataService,
  getAllPropertiesName,
  deleteProperty,
  updateProperty,
  createProperty,
};
