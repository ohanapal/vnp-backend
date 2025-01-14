const {
  getPortfolioSheetData,
  deleteSheetDataService,
  updateSheetDataService,
  getSingleSheetDataService,
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
      sub_portfolio,
      posting_type,
    } = req.query;

    // Build the filters object
    const filters = {};
    if (sub_portfolio) filters.sub_portfolio = sub_portfolio;
    if (posting_type) filters.posting_type = posting_type;

    const result = await getPortfolioSheetData({
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
module.exports = {
  sheetDataController,
  updateSheetDataController,
  deleteSheetDataController,
  getSingleSheetData,
};
