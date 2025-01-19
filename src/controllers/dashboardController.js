const {
  getRevenueMetrics,
  getStatusDistribution,
  getOTAPerformance,
  getPropertyPerformance,
  getPortfolioPerformance,
} = require('../services/dashboardService'); // Adjust the path to your services

const revenue = async (req, res) => {
  console.log('Revenue metrics requested');
  try {
    const { role, connected_entity_id: connectedEntityIds } = req.user;
    const { startDate, endDate, propertyName } = req.query;

    const response = await getRevenueMetrics(role, connectedEntityIds, startDate, endDate, propertyName);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const distributionStatus = async (req, res) => {
  const { startDate, endDate } = req.query;
  const { role, connected_entity_id: connectedEntityIds } = req.user;

  try {
    const response = await getStatusDistribution(role, connectedEntityIds, startDate, endDate);
    res.json(response);
  } catch (error) {
    console.error('Error fetching OTA distribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const OTAPerformance = async (req, res) => {
  const { startDate, endDate } = req.query;
  const { role, connected_entity_id: connectedEntityIds } = req.user;

  try {
    const { otaData, propertyData } = await getOTAPerformance(role, connectedEntityIds, startDate, endDate);
    res.json({ otaData, propertyData });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const propertyPerformance = async (req, res) => {
  const { startDate, endDate, sub_portfolio, posting_type } = req.query;
  const { role, connected_entity_id: connectedEntityIds } = req.user;

  try {
    // Decode posting_type to handle cases like "OTA+" sent in encoded form
    const decodedPostingType = posting_type ? decodeURIComponent(posting_type.trim()) : undefined;
    const propertyData = await getPropertyPerformance(
      role,
      connectedEntityIds,
      startDate,
      endDate,
      sub_portfolio,
      decodedPostingType,
    );
    res.json(propertyData);
  } catch (error) {
    console.error('Error fetching property performance metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const portfolioPerformanceController = async (req, res) => {
  const { startDate, endDate, page, limit, sortBy, sortOrder } = req.query;
  const { role, connected_entity_id: connectedEntityIds } = req.user;

  try {
    const portfolioData = await getPortfolioPerformance(
      role,
      connectedEntityIds,
      startDate,
      endDate,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10,
      sortBy || 'portfolioName', // Default to propertyName
      sortOrder || 'asc', // Default to ascending order
    );
    res.json(portfolioData);
  } catch (error) {
    console.error('Error fetching portfolio performance metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { revenue, distributionStatus, OTAPerformance, propertyPerformance, portfolioPerformanceController };
