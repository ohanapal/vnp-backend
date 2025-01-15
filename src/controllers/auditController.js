const { getAuditSheetData } = require('../services/auditService');
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
      endDate
    } = req.query;
    // console.log('query', req.query);

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
