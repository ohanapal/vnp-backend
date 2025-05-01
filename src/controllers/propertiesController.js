const {
  getPropertySheetData,
  deleteSheetDataService,
  updateSheetDataService,
  getSingleSheetDataService,
  getAllPropertiesName,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadContactService,
} = require('../services/propertiesService');

const sheetDataController = async (req, res) => {
  const { role, connected_entity_id: connectedEntityIds } = req.user;
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      portfolio,
      sub_portfolio,
      posting_type,
      id,
    } = req.query;
    // console.log('query', req.query);
    // console.log('req, query', req.query);
   // const decodedPostingType = posting_type ? decodeURIComponent(posting_type.trim()) : undefined;

    // Build the filters object
    const filters = {};
    if (sub_portfolio) filters.sub_portfolio = sub_portfolio;
    if (posting_type) filters.posting_type = posting_type;
    if (portfolio) filters.portfolio = portfolio;
    if (id) filters.id = id;
    const result = await getPropertySheetData({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      sortBy,
      sortOrder,
      filters,
      role,
      connectedEntityIds,
    });

    res.status(200).json({
      success: true,
      message: 'Data fetched successfully',
      data: result.data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        totalItems: result.total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSheetDataController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const { role, connected_entity_id: connectedEntityIds } = req.user;

    // const user = req.user; // Assuming req.user contains role and connectedEntityIds

    // Call the service to update the sheet data
    const updatedData = await updateSheetDataService(id, data, role, connectedEntityIds);

    return res.status(200).json({
      success: true,
      message: 'Sheet data updated successfully',
      data: updatedData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSheetDataController = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, connected_entity_id: connectedEntityIds } = req.user;

    // Call the service to delete the sheet data
    const message = await deleteSheetDataService(id, role, connectedEntityIds);

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSingleSheetData = async (req, res) => {
  try {
    const { id } = req.params; // Get sheet ID from request parameters
    const { role, connected_entity_id: connectedEntityIds } = req.user; // Get user role and connected entity IDs from the authenticated user

    // console.log('from controller', role, connectedEntityIds);
    // Call the service to get single sheet data
    const sheetData = await getSingleSheetDataService(id, role, connectedEntityIds);

    // Send the sheet data as response
    return res.status(200).json(sheetData);
  } catch (error) {
    console.error(error);

    // Handle errors appropriately
    if (error.message === 'Sheet data not found') {
      return res.status(404).json({ error: 'Sheet data not found' });
    } else if (error.message === 'You are not authorized to access this data') {
      return res.status(403).json({ error: 'You are not authorized to access this data' });
    } else {
      return res.status(500).json({ error: 'Server error' });
    }
  }
};

const getAllProperties = async (req, res) => {
  const { role, connected_entity_id: connectedEntityIds } = req.user;
  try {
    const { search } = req.query;
    const allPortfolios = await getAllPropertiesName(role, connectedEntityIds, search);
    return res.status(200).json(allPortfolios);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createPropertyController = async (req, res) => {
  try {
    const newProperty = await createProperty(req.body);

    return res.status(201).json({
      success: true,
      message: 'property created successfully',
      data: newProperty,
    });
  } catch (error) {
    console.error('Error creating property:', error.message);

    if (error.message === 'Name is required' || error.message === 'property with this name already exists') {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: message.error });
  }
};

const updatePropertyController = async (req, res) => {
  try {
    const { id } = req.params; // ID from the URL parameter
    const { name } = req.body;

    // Call the service to update the property
    const updatedProperty = await updateProperty(id, name);

    return res.status(200).json({
      success: true,
      message: 'property updated successfully',
      data: updatedProperty,
    });
  } catch (error) {
    console.error('Error updating property:', error.message);

    // Determine error type
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

const deletePropertyController = async (req, res) => {
  try {
    const { id } = req.params; // ID from the URL parameter

    // Call the service to delete the property
    const deletedProperty = await deleteProperty(id);

    return res.status(200).json({
      success: true,
      message: 'property deleted successfully',
      data: deletedProperty,
    });
  } catch (error) {
    console.error('Error deleting property:', error.message);

    // Determine error type
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};



module.exports = {
  sheetDataController,
  updateSheetDataController,
  deleteSheetDataController,
  getSingleSheetData,
  getAllProperties,
  createPropertyController,
  deletePropertyController,
  updatePropertyController,
};
