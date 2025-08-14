const { calculateMetrics } = require('../services/cardService');

const getMetrics = async (req, res) => {
  // console.log('getMetrics requested', req);
  try {
    const { selectedPortfolio, startdate, enddate, entity_id } = req.query;

    // console.log('getMetrics date', startdate, enddate);
    // If dates are not both provided, return all the data
    if ((startdate && !enddate) || (!startdate && enddate)) {
      return res.status(400).json({ error: 'Both startdate and enddate must be provided together.' });
    }

    const { role, connected_entity_id: connectedEntityIds } = req.user;

    const metrics = await calculateMetrics(role, connectedEntityIds, selectedPortfolio, startdate, enddate, entity_id);
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error in getMetrics:', error);
    res.status(500).json({ error: error.message || 'An error occurred while calculating metrics.' });
  }
};

module.exports = {
  getMetrics,
};
