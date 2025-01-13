const { getRevenueMetrics } = require('../services/dashboardService'); // Adjust the path to your services

const revenue = async (req, res) => {
  console.log('Revenue metrics requested');
  try {
    const { role, connected_entity_id: connectedEntityIds } = req.user;
    const response = await getRevenueMetrics(role, connectedEntityIds);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { revenue };
