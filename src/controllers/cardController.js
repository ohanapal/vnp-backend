const { calculateMetrics } = require('../services/cardService');

const getMetrics = async (req, res) => {
  try {
    const { selectedPortfolio, startdate: startDate, enddate: endDate } = req.query;

    // If dates are not both provided, return all the data
    if ((startDate && !endDate) || (!startDate && endDate)) {
      return res.status(400).json({ error: 'Both startdate and enddate must be provided together.' });
    }

        const { role, connected_entity_id: connectedEntityIds } = req.user;

    const metrics = await calculateMetrics(role,connectedEntityIds, selectedPortfolio, startDate, endDate);
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error in getMetrics:', error);
    res.status(500).json({ error: error.message || 'An error occurred while calculating metrics.' });
  }
};

module.exports = {
  getMetrics,
};
