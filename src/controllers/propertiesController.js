const { getPortfolioSheetData } = require('../services/propertiesService');

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

module.exports = {
  sheetDataController,
};
