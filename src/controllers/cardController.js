const { calculateMetrics } = require('../services/cardService');

const getMetrics = async (req, res) => {
  // console.log('getMetrics requested', req);
  try {
    const { selectedPortfolio, startdate, enddate, entity_id, multiplePropertyOwner } = req.query;

    console.log('card-metrics request', {
      selectedPortfolio,
      startdate,
      enddate,
      entity_id,
      multiplePropertyOwner,
      role: req.user?.role,
      connectedEntityIdsCount: Array.isArray(req.user?.connected_entity_id) ? req.user.connected_entity_id.length : 0,
    });

    // console.log('getMetrics date', startdate, enddate);
    // If dates are not both provided, return all the data
    if ((startdate && !enddate) || (!startdate && enddate)) {
      return res.status(400).json({ error: 'Both startdate and enddate must be provided together.' });
    }

    const { role, connected_entity_id: connectedEntityIds } = req.user;

    const metrics = await calculateMetrics(
      role,
      connectedEntityIds,
      selectedPortfolio,
      startdate,
      enddate,
      entity_id,
      multiplePropertyOwner === 'true',
    );
    console.log('card-metrics response summary', {
      collectableTotal: metrics?.collectableAmounts?.total,
      confirmedTotal: metrics?.confirmedAmounts?.total,
      totalAudits: metrics?.totalAudits,
    });
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error in getMetrics:', error);
    res.status(500).json({ error: error.message || 'An error occurred while calculating metrics.' });
  }
};

module.exports = {
  getMetrics,
};
