const sheetDataModel = require('../models/sheetDataModel'); // Replace with the correct path to your model
const portfolioModel = require('../models/portfolioModel'); // Replace with the correct path to your model
const AppError = require('../utils/appError');
const moment = require('moment');

const calculateMetrics = async (selectedPortfolio, startDate, endDate) => {
  try {
    let query = {};

    // Add portfolio filter if selectedPortfolio is provided
    if (selectedPortfolio && selectedPortfolio !== 'all') {
      const portfolio = await portfolioModel.findOne({ name: selectedPortfolio });
      if (!portfolio) {
        throw new AppError(`Portfolio with name "${selectedPortfolio}" not found.`, 404);
      }
      query.portfolio_name = portfolio._id;
    }

    // If startDate and endDate are provided, filter by date range
    if (startDate && endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      query.$and = [{ from: { $gte: start } }, { to: { $lte: end } }];
    }

    // Fetch matching documents from sheetDataModel based on the query
    const documents = await sheetDataModel.find(query, {
      'expedia.amount_collectable': 1,
      'booking.amount_collectable': 1,
      'agoda.amount_collectable': 1,
      'expedia.amount_confirmed': 1,
      'booking.amount_confirmed': 1,
      'agoda.amount_confirmed': 1,
      from: 1,
      to: 1,
    });

    // console.log('Documents:', documents);

    const totals = {
      ExpediaValue: 0,
      BookingValue: 0,
      AgodaValue: 0,
      ExpediaConfirmedValue: 0,
      BookingConfirmedValue: 0,
      AgodaConfirmedValue: 0,
      PortfolioCount: documents.length,
    };

    // Helper function to parse and clean currency values
    const parseCurrency = (value) => {
      if (!value) return 0;
      const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      return isNaN(parsedValue) ? 0 : parsedValue;
    };

    // Process documents and calculate totals
    documents.forEach((doc) => {
      const expediaValue = parseCurrency(doc?.expedia?.amount_collectable);
      const bookingValue = parseCurrency(doc?.booking?.amount_collectable);
      const agodaValue = parseCurrency(doc?.agoda?.amount_collectable);
      const expediaConfirmed = parseCurrency(doc?.expedia?.amount_confirmed);
      const bookingConfirmed = parseCurrency(doc?.booking?.amount_confirmed);
      const agodaConfirmed = parseCurrency(doc?.agoda?.amount_confirmed);

      totals.ExpediaValue += expediaValue;
      totals.BookingValue += bookingValue;
      totals.AgodaValue += agodaValue;
      totals.ExpediaConfirmedValue += expediaConfirmed;
      totals.BookingConfirmedValue += bookingConfirmed;
      totals.AgodaConfirmedValue += agodaConfirmed;
    });

    const totalReported = totals.ExpediaValue + totals.BookingValue + totals.AgodaValue;
    const totalConfirmed = totals.ExpediaConfirmedValue + totals.BookingConfirmedValue + totals.AgodaConfirmedValue;

    return {
      reportedAmounts: {
        expedia: totals.ExpediaValue,
        booking: totals.BookingValue,
        agoda: totals.AgodaValue,
        total: totalReported,
      },
      confirmedAmounts: {
        expedia: totals.ExpediaConfirmedValue,
        booking: totals.BookingConfirmedValue,
        agoda: totals.AgodaConfirmedValue,
        total: totalConfirmed,
      },
      totalBookings: totals.PortfolioCount,
    };
  } catch (error) {
    console.error('Error in calculateMetrics:', error);
    throw new AppError('Failed to calculate metrics.', 500);
  }
};

module.exports = {
  calculateMetrics,
};
