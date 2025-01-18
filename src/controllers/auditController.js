const { getAuditSheetData } = require('../services/auditService');
const logger = require('../utils/logger'); // Assuming logger is set up in utils/logger.js
const AppError = require('../utils/appError');

const sheetDataController = async (req, res) => {
  const { role, connected_entity_id: connectedEntityIds } = req.user;
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      property,
      sub_portfolio,
      posting_type,
      startDate,
      endDate,
    } = req.query;
    // console.log('query', req.query);
    logger.info('Received request to fetch sheet data', { user: req.user, query: req.query });
    // Build the filters object
    const filters = {};
    if (sub_portfolio) filters.sub_portfolio = sub_portfolio;
    if (posting_type) filters.posting_type = posting_type;
    if (property) filters.property = property;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await getAuditSheetData({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      sortBy,
      sortOrder,
      filters,
      role,
      connectedEntityIds,
    });
    logger.info('Sheet data fetched successfully', { totalItems: result.length });
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
    logger.error('Error fetching sheet data', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAuditDataController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const { role, connected_entity_id: connectedEntityIds } = req.user;

    // const user = req.user; // Assuming req.user contains role and connectedEntityIds
    logger.info(`Update request received for sheet data with ID: ${id} by user with role: ${role}`);
    // Call the service to update the sheet data
    const updatedData = await updateSheetDataService(id, data, role, connectedEntityIds);
    logger.info(`Sheet data with ID: ${id} updated successfully by user with role: ${role}`);
    return res.status(200).json({
      success: true,
      message: 'Sheet data updated successfully',
      data: updatedData,
    });
  } catch (error) {
    logger.error(`Error updating sheet data with ID: ${req.params.id} - ${error.message}`);

    // Use AppError for consistent error response
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteAuditDataController = async (req, res) => {
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

const getSingleAuditData = async (req, res) => {
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
module.exports = {
  sheetDataController,
  getSingleAuditData,
  deleteAuditDataController,
  updateAuditDataController,
};
