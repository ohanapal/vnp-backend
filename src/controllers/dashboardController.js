const { getRevenueMetrics, getStatusDistribution } = require('../services/dashboardService'); // Adjust the path to your services

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

module.exports = { revenue, distributionStatus };
