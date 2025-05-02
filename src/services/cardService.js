const sheetDataModel = require('../models/sheetDataModel'); // Replace with the correct path to your model
const portfolioModel = require('../models/portfolioModel'); // Replace with the correct path to your model
const AppError = require('../utils/appError');
const moment = require('moment');
const PropertyModel = require('../models/propertyModel');

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

// const calculateMetrics = async (role, connectedEntityIds, selectedPortfolio, startDate, endDate) => {
//   try {
//     let query = {};

//     // Add date range filtering if provided
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       console.log('Adding date range', start, end);

//       query = {
//         $and: [
//           { from: { $lte: end } }, // Database range starts before the query range ends
//           { to: { $gte: start } }, // Database range ends after the query range starts
//         ],
//       };
//     }

//     if (role !== 'admin') {
//       if (!connectedEntityIds || connectedEntityIds.length === 0) {
//         throw new AppError('No connected entity IDs provided for this role.', 403);
//       }

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
//         query.$or = entityQuery;
//       }
//     } else {
//       if (selectedPortfolio && selectedPortfolio !== 'all') {
//         const portfolio = await portfolioModel.findOne({ name: selectedPortfolio });
//         if (!portfolio) {
//           throw new AppError(`Portfolio with name "${selectedPortfolio}" not found.`, 404);
//         }
//         query.portfolio_name = portfolio._id;
//       }
//     }

//     // Fetch matching documents from sheetDataModel
//     const documents = await sheetDataModel.find(query, {
//       'expedia.amount_collectable': 1,
//       'booking.amount_collectable': 1,
//       'agoda.amount_collectable': 1,
//       'expedia.amount_confirmed': 1,
//       'booking.amount_confirmed': 1,
//       'agoda.amount_confirmed': 1,
//       from: 1,
//       to: 1,
//       next_audit_date: 1, // Include next_audit_date in results
//       _id: 1, // Include _id in results
//     });

//     const totals = {
//       ExpediaValue: 0,
//       BookingValue: 0,
//       AgodaValue: 0,
//       ExpediaConfirmedValue: 0,
//       BookingConfirmedValue: 0,
//       AgodaConfirmedValue: 0,
//       PortfolioCount: documents.length,
//       NextAuditDateCount: 0, // To store count of documents with future next_audit_date
//       NextAuditDateIds: [], // To store ids of documents with future next_audit_date
//     };

//     const parseCurrency = (value) => {
//       if (!value) return 0;
//       const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
//       const parsedValue = parseFloat(cleanedValue);
//       return isNaN(parsedValue) ? 0 : parsedValue;
//     };

//     // Get today's date for comparison
//     const today = new Date();

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

//       // Check if the next_audit_date is greater than today
//       if (doc.next_audit_date && new Date(doc.next_audit_date) > today) {
//         totals.NextAuditDateCount += 1; // Increment if next_audit_date is in the future
//         totals.NextAuditDateIds.push(doc._id); // Add document _id to the list
//       }
//     });

//     const totalReported = totals.ExpediaValue + totals.BookingValue + totals.AgodaValue;
//     const totalConfirmed = totals.ExpediaConfirmedValue + totals.BookingConfirmedValue + totals.AgodaConfirmedValue;

//     const formatToTwoDecimals = (value) => parseFloat(value.toFixed(2));

//     const result = {
//       collectableAmounts: {
//         expedia: formatToTwoDecimals(totals.ExpediaValue),
//         booking: formatToTwoDecimals(totals.BookingValue),
//         agoda: formatToTwoDecimals(totals.AgodaValue),
//         total: formatToTwoDecimals(totalReported),
//       },
//       confirmedAmounts: {
//         expedia: formatToTwoDecimals(totals.ExpediaConfirmedValue),
//         booking: formatToTwoDecimals(totals.BookingConfirmedValue),
//         agoda: formatToTwoDecimals(totals.AgodaConfirmedValue),
//         total: formatToTwoDecimals(totalConfirmed),
//       },
//       totalAudits: totals.PortfolioCount,
//     };

//     // Add logic for next_audit_date based on role
//     if (role === 'property') {
//       // For property, show next_audit_date if it's greater than today
//       const futureAudit = documents.find((doc) => new Date(doc.next_audit_date) > today);
//       if (futureAudit) {
//         result.nextAuditDate = futureAudit.next_audit_date;
//       } else {
//         result.nextAuditDate = null; // No future audit date
//       }
//     } else if (role === 'portfolio' || role === 'sub-portfolio') {
//       // For portfolio and sub-portfolio, show how many have a next_audit_date greater than today
//       result.nextAuditDateCount = totals.NextAuditDateCount;
//       result.nextAuditDateIds = totals.NextAuditDateIds; // Return the ids of documents with future next_audit_date
//     }

//     return result;
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
      // console.log('Adding date range', start, end);

      query = {
        $and: [
          { from: { $lte: end } }, // Database range starts before the query range ends
          { to: { $gte: start } }, // Database range ends after the query range starts
        ],
      };
    }

    if (role !== 'admin') {
      if (!connectedEntityIds || connectedEntityIds.length === 0) {
        throw new AppError('No connected entity IDs provided for this role.', 403);
      }

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
        query.$or = entityQuery;
      }
    } else {
      // For admin, if a selectedPortfolio is provided (and not "all"), filter by that portfolio.
      if (selectedPortfolio && selectedPortfolio !== 'all') {
        const portfolio = await portfolioModel.findOne({ name: selectedPortfolio });
        if (!portfolio) {
          throw new AppError(`Portfolio with name "${selectedPortfolio}" not found.`, 404);
        }
        query.portfolio_name = portfolio._id;
      }
      // Otherwise, admin sees all data (no further filtering by connectedEntityIds)
    }

    // First, get all properties for the user based on role
    let propertyQuery = {};
    if (role !== 'admin') {
      if (role === 'portfolio') {
        // For portfolio role, find all properties in sheetData that belong to this portfolio
        const propertiesInPortfolio = await sheetDataModel.find({ portfolio_name: { $in: connectedEntityIds } }, 'property_name');
        propertyQuery = { _id: { $in: propertiesInPortfolio.map(p => p.property_name) } };
      } else if (role === 'sub-portfolio') {
        const propertiesInSubPortfolio = await sheetDataModel.find({ sub_portfolio: { $in: connectedEntityIds } }, 'property_name');
        propertyQuery = { _id: { $in: propertiesInSubPortfolio.map(p => p.property_name) } };
      } else if (role === 'property') {
        propertyQuery = { _id: { $in: connectedEntityIds } };
      }
    } else if (selectedPortfolio && selectedPortfolio !== 'all') {
      const portfolio = await portfolioModel.findOne({ name: selectedPortfolio });
      if (!portfolio) {
        throw new AppError(`Portfolio with name "${selectedPortfolio}" not found.`, 404);
      }
      const propertiesInPortfolio = await sheetDataModel.find({ portfolio_name: portfolio._id }, 'property_name');
      propertyQuery = { _id: { $in: propertiesInPortfolio.map(p => p.property_name) } };
    }

    // Get total properties count
    const totalProperties = await PropertyModel.countDocuments(propertyQuery);
    // console.log('Total properties query:', propertyQuery);
    // console.log('Total properties count:', totalProperties);

    // Fetch matching documents from sheetDataModel
    const documents = await sheetDataModel.find(query, {
      'expedia.amount_collectable': 1,
      'booking.amount_collectable': 1,
      'agoda.amount_collectable': 1,
      'expedia.amount_confirmed': 1,
      'booking.amount_confirmed': 1,
      'agoda.amount_confirmed': 1,
      'expedia.review_status': 1,
      'booking.review_status': 1,
      'agoda.review_status': 1,
      from: 1,
      to: 1,
      next_audit_date: 1,
      property_name: 1,
      _id: 1,
    });

    // Initialize totals and next audit info tracking
    const totals = {
      ExpediaValue: 0,
      BookingValue: 0,
      AgodaValue: 0,
      ExpediaConfirmedValue: 0,
      BookingConfirmedValue: 0,
      AgodaConfirmedValue: 0,
      PortfolioCount: documents.length,
      NextAuditDateCount: 0,
      NextAuditDateIds: [],
      // Initialize access required counts
      expediaAccessRequired: 0,
      bookingAccessRequired: 0,
      agodaAccessRequired: 0,
    };

    const parseCurrency = (value) => {
      if (!value) return 0;
      const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      return isNaN(parsedValue) ? 0 : parsedValue;
    };

    // Get today's date for comparison
    const today = new Date();

    // Process each document
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

      // Count properties that need access for each platform
      if (doc?.expedia?.review_status === "Access Required") totals.expediaAccessRequired++;
      if (doc?.booking?.review_status === "Access Required") totals.bookingAccessRequired++;
      if (doc?.agoda?.review_status === "Access Required") totals.agodaAccessRequired++;

      // If next_audit_date is in the future, update count and list of IDs
      if (doc.next_audit_date && new Date(doc.next_audit_date) > today) {
        totals.NextAuditDateCount += 1;
        totals.NextAuditDateIds.push(doc._id);
      }
    });

    const totalReported = totals.ExpediaValue + totals.BookingValue + totals.AgodaValue;
    const totalConfirmed = totals.ExpediaConfirmedValue + totals.BookingConfirmedValue + totals.AgodaConfirmedValue;
    const formatToTwoDecimals = (value) => parseFloat(value.toFixed(2));

    const result = {
      collectableAmounts: {
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
      totalAudits: totals.PortfolioCount,
      totalProperty: {
        expedia: totals.expediaAccessRequired,
        booking: totals.bookingAccessRequired,
        agoda: totals.agodaAccessRequired,
        total: totals.PortfolioCount
      }
    };

    // Add logic for next_audit_date based on role:
    // For property, return the first future next_audit_date.
    // For portfolio, sub-portfolio, and admin, return count and IDs.
    if (role === 'property') {
      const futureAudit = documents.find((doc) => new Date(doc.next_audit_date) > today);
      result.nextAuditDate = futureAudit ? futureAudit.next_audit_date : null;
    } else if (role === 'portfolio' || role === 'sub-portfolio' || role === 'admin') {
      result.nextAuditDateCount = totals.NextAuditDateCount;
      result.nextAuditDateIds = totals.NextAuditDateIds;
    }

    return result;
  } catch (error) {
    console.error('Error in calculateMetrics:', error);
    throw new AppError('Failed to calculate metrics.', 500);
  }
};

// const calculateMetrics = async (role, connectedEntityIds, selectedPortfolio, startDate, endDate) => {
//   try {
//     let query = {};

//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       console.log('Adding date range', start, end);

//       query = {
//         $and: [{ from: { $lte: end } }, { to: { $gte: start } }],
//       };
//     }

//     if (role !== 'admin') {
//       if (!connectedEntityIds || connectedEntityIds.length === 0) {
//         throw new AppError('No connected entity IDs provided for this role.', 403);
//       }

//       const entityQuery = [];
//       if (role === 'portfolio') entityQuery.push({ portfolio_name: { $in: connectedEntityIds } });
//       if (role === 'sub-portfolio') entityQuery.push({ sub_portfolio: { $in: connectedEntityIds } });
//       if (role === 'property') entityQuery.push({ property_name: { $in: connectedEntityIds } });

//       if (entityQuery.length > 0) {
//         query.$or = entityQuery;
//       }
//     } else {
//       if (selectedPortfolio && selectedPortfolio !== 'all') {
//         const portfolio = await portfolioModel.findOne({ name: selectedPortfolio });
//         if (!portfolio) {
//           throw new AppError(`Portfolio with name "${selectedPortfolio}" not found.`, 404);
//         }
//         query.portfolio_name = portfolio._id;
//       }
//     }

//     const documents = await sheetDataModel.find(query, {
//       'expedia.amount_collectable': 1,
//       'booking.amount_collectable': 1,
//       'agoda.amount_collectable': 1,
//       'expedia.amount_confirmed': 1,
//       'booking.amount_confirmed': 1,
//       'agoda.amount_confirmed': 1,
//       from: 1,
//       to: 1,
//       next_audit_date: 1,
//       _id: 1,
//     });

//     const totals = {
//       ExpediaValue: 0,
//       BookingValue: 0,
//       AgodaValue: 0,
//       ExpediaConfirmedValue: 0,
//       BookingConfirmedValue: 0,
//       AgodaConfirmedValue: 0,
//       PortfolioCount: documents.length,
//       NextAuditDateCount: 0,
//       NextAuditDateIds: [],
//       PassedAuditDateCount: 0, // Count of past audit dates
//       PassedAuditDateIds: [], // List of _id's for past audit dates
//     };

//     const parseCurrency = (value) => {
//       if (!value) return 0;
//       const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
//       const parsedValue = parseFloat(cleanedValue);
//       return isNaN(parsedValue) ? 0 : parsedValue;
//     };

//     const today = new Date();

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

//       if (doc.next_audit_date) {
//         const auditDate = new Date(doc.next_audit_date);
//         if (auditDate > today) {
//           totals.NextAuditDateCount += 1;
//           totals.NextAuditDateIds.push(doc._id);
//         } else {
//           totals.PassedAuditDateCount += 1;
//           totals.PassedAuditDateIds.push(doc._id);
//         }
//       }
//     });

//     const totalReported = totals.ExpediaValue + totals.BookingValue + totals.AgodaValue;
//     const totalConfirmed = totals.ExpediaConfirmedValue + totals.BookingConfirmedValue + totals.AgodaConfirmedValue;
//     const formatToTwoDecimals = (value) => parseFloat(value.toFixed(2));

//     const result = {
//       collectableAmounts: {
//         expedia: formatToTwoDecimals(totals.ExpediaValue),
//         booking: formatToTwoDecimals(totals.BookingValue),
//         agoda: formatToTwoDecimals(totals.AgodaValue),
//         total: formatToTwoDecimals(totalReported),
//       },
//       confirmedAmounts: {
//         expedia: formatToTwoDecimals(totals.ExpediaConfirmedValue),
//         booking: formatToTwoDecimals(totals.BookingConfirmedValue),
//         agoda: formatToTwoDecimals(totals.AgodaConfirmedValue),
//         total: formatToTwoDecimals(totalConfirmed),
//       },
//       totalAudits: totals.PortfolioCount,
//       nextAuditDateCount: totals.NextAuditDateCount,
//       nextAuditDateIds: totals.NextAuditDateIds,
//       passedAuditDateCount: totals.PassedAuditDateCount,
//       passedAuditDateIds: totals.PassedAuditDateIds,
//     };

//     if (role === 'property') {
//       const futureAudit = documents.find((doc) => new Date(doc.next_audit_date) > today);
//       result.nextAuditDate = futureAudit ? futureAudit.next_audit_date : null;
//     }

//     return result;
//   } catch (error) {
//     console.error('Error in calculateMetrics:', error);
//     throw new AppError('Failed to calculate metrics.', 500);
//   }
// };

module.exports = {
  calculateMetrics,
};
