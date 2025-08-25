const sheetDataModel = require('../models/sheetDataModel'); // Replace with the correct path to your model
const portfolioModel = require('../models/portfolioModel'); // Replace with the correct path to your model
const AppError = require('../utils/appError');
const moment = require('moment');
const PropertyModel = require('../models/propertyModel');
const {
  Types: { ObjectId },
} = require('mongoose');

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

// // old calculate metrics
// const calculateMetrics = async (
//   role,
//   connectedEntityIds,
//   selectedPortfolio,
//   startDate,
//   endDate,
//   entityId,
//   multiplePropertyOwner = false,
// ) => {
//   try {
//     let query = {};

//     // Add date range filtering if provided
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       if (isNaN(start.valueOf()) || isNaN(end.valueOf())) {
//         throw new AppError('Invalid date range provided', 400);
//       }
//       console.log('calculateMetrics: date range', { start, end });

//       query = {
//         $and: [{ from: { $lte: end } }, { to: { $gte: start } }],
//       };
//     }

//     if (role !== 'admin') {
//       console.log('calculateMetrics: non-admin role branch', { role, entityId, multiplePropertyOwner });
//       if (!connectedEntityIds || connectedEntityIds.length === 0) {
//         throw new AppError('No connected entity IDs provided for this role.', 403);
//       }

//       // If a specific entity id is provided, filter strictly to that entity
//       if (entityId) {
//         if (role === 'portfolio') query.portfolio_name = entityId;
//         if (role === 'sub-portfolio') query.sub_portfolio = entityId;
//         if (role === 'property') query.property_name = entityId;
//       } else if (multiplePropertyOwner && role === 'property') {
//         // For property role with multiple ownership flag, include all connected properties
//         query.property_name = { $in: connectedEntityIds };
//         console.log('calculateMetrics: multi-property owner query', { query });
//       } else {
//         const entityQuery = [];
//         if (role === 'portfolio') {
//           entityQuery.push({ portfolio_name: { $in: connectedEntityIds } });
//         }
//         if (role === 'sub-portfolio') {
//           entityQuery.push({ sub_portfolio: { $in: connectedEntityIds } });
//         }
//         if (role === 'property') {
//           entityQuery.push({ property_name: { $in: connectedEntityIds } });
//         }

//         if (entityQuery.length > 0) {
//           query.$or = entityQuery;
//         }
//       }
//     } else {
//       // For admin, if a selectedPortfolio is provided (and not "all"), filter by that portfolio.
//       if (entityId) {
//         // Admin can filter by explicit entity id as well
//         query.$or = [{ portfolio_name: entityId }, { sub_portfolio: entityId }, { property_name: entityId }];
//         console.log('calculateMetrics: admin entity filter', { query });
//       }
//       // Otherwise, admin sees all data (no further filtering by connectedEntityIds)
//     }

//     // Fetch matching documents from sheetDataModel
//     console.log('calculateMetrics: final query', JSON.stringify(query));
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
//       property_name: 1, // Include property_name in results
//       _id: 1,
//     });

//     // Initialize totals and next audit info tracking
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
//       // Initialize property counts
//       expediaProperties: 0,
//       bookingProperties: 0,
//       agodaProperties: 0,
//     };

//     const parseCurrency = (value) => {
//       if (!value) return 0;
//       const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
//       const parsedValue = parseFloat(cleanedValue);
//       return isNaN(parsedValue) ? 0 : parsedValue;
//     };

//     // Get today's date for comparison
//     const today = new Date();

//     // Process each document
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

//       // Count properties for each platform if they have values
//       if (doc.property_name) {
//         if (expediaValue > 0) totals.expediaProperties++;
//         if (bookingValue > 0) totals.bookingProperties++;
//         if (agodaValue > 0) totals.agodaProperties++;
//       }

//       // If next_audit_date is in the future, update count and list of IDs
//       if (doc.next_audit_date && new Date(doc.next_audit_date) > today) {
//         totals.NextAuditDateCount += 1;
//         totals.NextAuditDateIds.push(doc._id);
//       }
//     });

//     const totalReported = totals.ExpediaValue + totals.BookingValue + totals.AgodaValue;
//     const totalConfirmed = totals.ExpediaConfirmedValue + totals.BookingConfirmedValue + totals.AgodaConfirmedValue;
//     const formatToTwoDecimals = (value) => parseFloat(value.toFixed(2));

//     // Calculate total properties (sum of all platform counts)
//     const totalProperties = totals.expediaProperties + totals.bookingProperties + totals.agodaProperties;

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
//       totalProperty: {
//         expedia: totals.expediaProperties,
//         booking: totals.bookingProperties,
//         agoda: totals.agodaProperties,
//         total: totalProperties,
//       },
//     };

//     // Add logic for next_audit_date based on role:
//     // For property, return the first future next_audit_date.
//     // For portfolio, sub-portfolio, and admin, return count and IDs.
//     if (role === 'property') {
//       const futureAudit = documents.find((doc) => new Date(doc.next_audit_date) > today);
//       result.nextAuditDate = futureAudit ? futureAudit.next_audit_date : null;
//     } else if (role === 'portfolio' || role === 'sub-portfolio' || role === 'admin') {
//       result.nextAuditDateCount = totals.NextAuditDateCount;
//       result.nextAuditDateIds = totals.NextAuditDateIds;
//     }

//     return result;
//   } catch (error) {
//     console.error('Error in calculateMetrics:', error);
//     throw new AppError('Failed to calculate metrics.', 500);
//   }
// };

// NEW CALCULATE METRICS with aggregation
const calculateMetrics = async (role, connectedEntityIds, startDate, endDate, entityId, multiplePropertyOwner = false) => {
  try {
    let query = {};

    // Add date range filtering if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.valueOf()) || isNaN(end.valueOf())) {
        throw new AppError('Invalid date range provided', 400);
      }

      query = {
        $and: [{ from: { $lte: end } }, { to: { $gte: start } }],
      };
    }

    if (role !== 'admin') {
      if (!connectedEntityIds || connectedEntityIds.length === 0) {
        throw new AppError('No connected entity IDs provided for this role.', 403);
      }

      // If a specific entity id is provided, filter strictly to that entity
      if (entityId) {
        if (role === 'portfolio') query.portfolio_name = new ObjectId(entityId);
        if (role === 'sub-portfolio') query.sub_portfolio = new ObjectId(entityId);
        if (role === 'property') query.property_name = new ObjectId(entityId);
      } else if (multiplePropertyOwner && role === 'property') {
        // For property role with multiple ownership flag, include all connected properties
        query.property_name = { $in: connectedEntityIds.map((id) => new ObjectId(id)) };
      } else {
        const entityQuery = [];
        if (role === 'portfolio') {
          entityQuery.push({ portfolio_name: { $in: connectedEntityIds.map((id) => new ObjectId(id)) } });
        }
        if (role === 'sub-portfolio') {
          entityQuery.push({ sub_portfolio: { $in: connectedEntityIds.map((id) => new ObjectId(id)) } });
        }
        if (role === 'property') {
          entityQuery.push({ property_name: { $in: connectedEntityIds.map((id) => new ObjectId(id)) } });
        }

        if (entityQuery.length > 0) {
          query.$or = entityQuery;
        }
      }
    } else {
      // For admin, if a selectedPortfolio is provided (and not "all"), filter by that portfolio.
      if (entityId) {
        // Admin can filter by explicit entity id as well
        query.$or = [
          { portfolio_name: new ObjectId(entityId) },
          { sub_portfolio: new ObjectId(entityId) },
          { property_name: new ObjectId(entityId) },
        ];
      }
      // Otherwise, admin sees all data (no further filtering by connectedEntityIds)
    }

    // Aggregation that preserves old totals by cleaning strings character-by-character
    console.log('calculateMetrics: final query', JSON.stringify(query));
    const now = new Date();

    const toCleanString = (expr) => {
      const str = { $toString: { $ifNull: [expr, ''] } };
      const len = { $strLenCP: str };
      const chars = {
        $map: {
          input: { $range: [0, len] },
          as: 'i',
          in: { $substrCP: [str, '$$i', 1] },
        },
      };
      const allowed = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '-'];
      const filtered = { $filter: { input: chars, as: 'ch', cond: { $in: ['$$ch', allowed] } } };
      const joined = { $reduce: { input: filtered, initialValue: '', in: { $concat: ['$$value', '$$this'] } } };
      return { $cond: [{ $eq: [joined, ''] }, '0', joined] };
    };

    const toNumber = (expr) => ({ $convert: { input: toCleanString(expr), to: 'double', onError: 0, onNull: 0 } });

    const pipeline = [
      { $match: query },
      {
        $project: {
          next_audit_date: 1,
          property_name: 1,
          expediaCollectable: toNumber('$expedia.amount_collectable'),
          bookingCollectable: toNumber('$booking.amount_collectable'),
          agodaCollectable: toNumber('$agoda.amount_collectable'),
          expediaConfirmed: toNumber('$expedia.amount_confirmed'),
          bookingConfirmed: toNumber('$booking.amount_confirmed'),
          agodaConfirmed: toNumber('$agoda.amount_confirmed'),
          futureAuditId: { $cond: [{ $gt: ['$next_audit_date', now] }, '$_id', null] },
        },
      },
      {
        $group: {
          _id: null,
          expediaCollectable: { $sum: '$expediaCollectable' },
          bookingCollectable: { $sum: '$bookingCollectable' },
          agodaCollectable: { $sum: '$agodaCollectable' },
          expediaConfirmed: { $sum: '$expediaConfirmed' },
          bookingConfirmed: { $sum: '$bookingConfirmed' },
          agodaConfirmed: { $sum: '$agodaConfirmed' },
          totalCount: { $sum: 1 },
          expediaProperties: { $sum: { $cond: [{ $gt: ['$expediaCollectable', 0] }, 1, 0] } },
          bookingProperties: { $sum: { $cond: [{ $gt: ['$bookingCollectable', 0] }, 1, 0] } },
          agodaProperties: { $sum: { $cond: [{ $gt: ['$agodaCollectable', 0] }, 1, 0] } },
          nextAuditDateCount: { $sum: { $cond: [{ $gt: ['$next_audit_date', now] }, 1, 0] } },
          nextAuditDateIds: { $addToSet: '$futureAuditId' },
        },
      },
      {
        $project: {
          expediaCollectable: 1,
          bookingCollectable: 1,
          agodaCollectable: 1,
          expediaConfirmed: 1,
          bookingConfirmed: 1,
          agodaConfirmed: 1,
          totalCount: 1,
          expediaProperties: 1,
          bookingProperties: 1,
          agodaProperties: 1,
          nextAuditDateCount: 1,
          nextAuditDateIds: { $setDifference: ['$nextAuditDateIds', [null]] },
          collectableAmounts: {
            expedia: { $round: ['$expediaCollectable', 2] },
            booking: { $round: ['$bookingCollectable', 2] },
            agoda: { $round: ['$agodaCollectable', 2] },
            total: { $round: [{ $add: ['$expediaCollectable', '$bookingCollectable', '$agodaCollectable'] }, 2] },
          },
          confirmedAmounts: {
            expedia: { $round: ['$expediaConfirmed', 2] },
            booking: { $round: ['$bookingConfirmed', 2] },
            agoda: { $round: ['$agodaConfirmed', 2] },
            total: { $round: [{ $add: ['$expediaConfirmed', '$bookingConfirmed', '$agodaConfirmed'] }, 2] },
          },
          totalProperty: {
            expedia: '$expediaProperties',
            booking: '$bookingProperties',
            agoda: '$agodaProperties',
            total: { $add: ['$expediaProperties', '$bookingProperties', '$agodaProperties'] },
          },
          totalAudits: '$totalCount',
        },
      },
    ];

    const agg = await sheetDataModel.aggregate(pipeline);
    const aggregated = agg && agg.length > 0 ? agg[0] : null;

    const result = aggregated
      ? {
          collectableAmounts: aggregated.collectableAmounts,
          confirmedAmounts: aggregated.confirmedAmounts,
          totalAudits: aggregated.totalAudits,
          totalProperty: aggregated.totalProperty,
          nextAuditDateCount: aggregated.nextAuditDateCount,
          nextAuditDateIds: aggregated.nextAuditDateIds,
        }
      : {
          collectableAmounts: { expedia: 0, booking: 0, agoda: 0, total: 0 },
          confirmedAmounts: { expedia: 0, booking: 0, agoda: 0, total: 0 },
          totalAudits: 0,
          totalProperty: { expedia: 0, booking: 0, agoda: 0, total: 0 },
          nextAuditDateCount: 0,
          nextAuditDateIds: [],
        };

    // For property role, return earliest future next_audit_date to keep parity with old behavior
    if (role === 'property') {
      const futureAudit = await sheetDataModel
        .findOne({ ...query, next_audit_date: { $gt: now } }, { next_audit_date: 1 })
        .sort({ next_audit_date: 1 })
        .lean();
      result.nextAuditDate = futureAudit ? futureAudit.next_audit_date : null;
      delete result.nextAuditDateCount;
      delete result.nextAuditDateIds;
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
