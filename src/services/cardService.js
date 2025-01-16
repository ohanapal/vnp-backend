const sheetDataModel = require('../models/sheetDataModel'); // Replace with the correct path to your model
const portfolioModel = require('../models/portfolioModel'); // Replace with the correct path to your model
const AppError = require('../utils/appError');
const moment = require('moment');

// const calculateMetrics = async (role, connectedEntityIds, selectedPortfolio, startDate, endDate) => {
//   try {
//     let query = {};

//     // Add date range filtering if provided
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);

//       query.$and = [{ from: { $gte: start } }, { to: { $lte: end } }];
//     }

//     if (role !== 'admin') {
//       // Ensure connectedEntityIds is provided for non-admin roles
//       if (!connectedEntityIds || connectedEntityIds.length === 0) {
//         throw new AppError('No connected entity IDs provided for this role.', 403);
//       }

//       // Match connectedEntityIds with the appropriate field based on the role
//       const entityQuery = [];
//       if (role === 'portfolio') {
//         entityQuery.push({ portfolio_name: { $in: connectedEntityIds } });
//       }
//       if (role === 'sub-portfolio') {
//         entityQuery.push({ sub_portfolio: { $in: connectedEntityIds } });
//       }
//       if (role === 'property') {
//         entityQuery.push({ property_name: { $in: connectedEntityIds } });
//       }

//       if (entityQuery.length > 0) {
//         query.$or = entityQuery; // Match any of the entity criteria
//       }
//     } else {
//       // For admin, include selectedPortfolio filtering
//       if (selectedPortfolio && selectedPortfolio !== 'all') {
//         const portfolio = await portfolioModel.findOne({ name: selectedPortfolio });
//         if (!portfolio) {
//           throw new AppError(`Portfolio with name "${selectedPortfolio}" not found.`, 404);
//         }
//         query.portfolio_name = portfolio._id;
//       }
//     }

//     // Fetch matching documents from sheetDataModel based on the query
//     const documents = await sheetDataModel.find(query, {
//       'expedia.amount_collectable': 1,
//       'booking.amount_collectable': 1,
//       'agoda.amount_collectable': 1,
//       'expedia.amount_confirmed': 1,
//       'booking.amount_confirmed': 1,
//       'agoda.amount_confirmed': 1,
//       from: 1,
//       to: 1,
//     });

//     const totals = {
//       ExpediaValue: 0,
//       BookingValue: 0,
//       AgodaValue: 0,
//       ExpediaConfirmedValue: 0,
//       BookingConfirmedValue: 0,
//       AgodaConfirmedValue: 0,
//       PortfolioCount: documents.length,
//     };

//     const parseCurrency = (value) => {
//       if (!value) return 0;
//       const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
//       const parsedValue = parseFloat(cleanedValue);
//       return isNaN(parsedValue) ? 0 : parsedValue;
//     };

//     documents.forEach((doc) => {
//       const expediaValue = parseCurrency(doc?.expedia?.amount_collectable);
//       const bookingValue = parseCurrency(doc?.booking?.amount_collectable);
//       const agodaValue = parseCurrency(doc?.agoda?.amount_collectable);
//       const expediaConfirmed = parseCurrency(doc?.expedia?.amount_confirmed);
//       const bookingConfirmed = parseCurrency(doc?.booking?.amount_confirmed);
//       const agodaConfirmed = parseCurrency(doc?.agoda?.amount_confirmed);

//       totals.ExpediaValue += expediaValue;
//       totals.BookingValue += bookingValue;
//       totals.AgodaValue += agodaValue;
//       totals.ExpediaConfirmedValue += expediaConfirmed;
//       totals.BookingConfirmedValue += bookingConfirmed;
//       totals.AgodaConfirmedValue += agodaConfirmed;
//     });

//     const totalReported = totals.ExpediaValue + totals.BookingValue + totals.AgodaValue;
//     const totalConfirmed = totals.ExpediaConfirmedValue + totals.BookingConfirmedValue + totals.AgodaConfirmedValue;

//     return {
//       reportedAmounts: {
//         expedia: parseFloat(totals.ExpediaValue.toFixed(2)),
//         booking: parseFloat(totals.BookingValue.toFixed(2)),
//         agoda: parseFloat(totals.AgodaValue.toFixed(2)),
//         total: parseFloat(totalReported.toFixed(2)),
//       },
//       confirmedAmounts: {
//         expedia: parseFloat(totals.ExpediaConfirmedValue.toFixed(2)),
//         booking: parseFloat(totals.BookingConfirmedValue.toFixed(2)),
//         agoda: parseFloat(totals.AgodaConfirmedValue.toFixed(2)),
//         total: parseFloat(totalConfirmed.toFixed(2)),
//       },
//       totalBookings: totals.PortfolioCount,
//     };

//   } catch (error) {
//     console.error('Error in calculateMetrics:', error);
//     throw new AppError('Failed to calculate metrics.', 500);
//   }
// };


const calculateMetrics = async (role, connectedEntityIds, selectedPortfolio, startDate, endDate) => {
  try {
    let query = {};

    // Add date range filtering if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      query.$and = [{ from: { $gte: start } }, { to: { $lte: end } }];
    }

    if (role !== 'admin') {
      // Ensure connectedEntityIds is provided for non-admin roles
      if (!connectedEntityIds || connectedEntityIds.length === 0) {
        throw new AppError('No connected entity IDs provided for this role.', 403);
      }

      // Match connectedEntityIds with the appropriate field based on the role
      const entityQuery = [];
      if (role === 'portfolio') {
        entityQuery.push({ portfolio_name: { $in: connectedEntityIds } });
      }
      if (role === 'sub-portfolio') {
        entityQuery.push({ sub_portfolio: { $in: connectedEntityIds } });
      }
      if (role === 'property') {
        entityQuery.push({ property_name: { $in: connectedEntityIds } });
      }

      if (entityQuery.length > 0) {
        query.$or = entityQuery; // Match any of the entity criteria
      }
    } else {
      // For admin, include selectedPortfolio filtering
      if (selectedPortfolio && selectedPortfolio !== 'all') {
        const portfolio = await portfolioModel.findOne({ name: selectedPortfolio });
        if (!portfolio) {
          throw new AppError(`Portfolio with name "${selectedPortfolio}" not found.`, 404);
        }
        query.portfolio_name = portfolio._id;
      }
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

    const totals = {
      ExpediaValue: 0,
      BookingValue: 0,
      AgodaValue: 0,
      ExpediaConfirmedValue: 0,
      BookingConfirmedValue: 0,
      AgodaConfirmedValue: 0,
      PortfolioCount: documents.length,
    };

    const parseCurrency = (value) => {
      if (!value) return 0;
      const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      return isNaN(parsedValue) ? 0 : parsedValue;
    };

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

    const formatToTwoDecimals = (value) => parseFloat(value.toFixed(2));

    return {
      reportedAmounts: {
        expedia: formatToTwoDecimals(totals.ExpediaValue),
        booking: formatToTwoDecimals(totals.BookingValue),
        agoda: formatToTwoDecimals(totals.AgodaValue),
        total: formatToTwoDecimals(totalReported),
      },
      confirmedAmounts: {
        expedia: formatToTwoDecimals(totals.ExpediaConfirmedValue),
        booking: formatToTwoDecimals(totals.BookingConfirmedValue),
        agoda: formatToTwoDecimals(totals.AgodaConfirmedValue),
        total: formatToTwoDecimals(totalConfirmed),
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
