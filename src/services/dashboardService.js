const SheetData = require('../models/sheetDataModel'); // Adjust the path to your models
const AppError = require('../utils/appError');
const { ObjectId } = require('mongodb');
const parseCurrency = (value) => {
  if (!value) return 0;
  const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
  const parsedValue = parseFloat(cleanedValue);
  return isNaN(parsedValue) ? 0 : parsedValue;
};

const getRevenueMetrics = async (role, connectedEntityIds, startDate, endDate, propertyName) => {
  // Fetch and populate data
  const query = {};
  // if (startDate || endDate) {
  //   query.from = {};
  //   if (startDate) query.from.$gte = new Date(startDate);
  //   if (endDate) query.from.$lte = new Date(endDate);
  // }

  if (startDate || endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log('Adding date range', start, end);

    // Apply the overlap logic
    query.$and = [
      { from: { $lte: end } }, // Database range starts before the query range ends
      { to: { $gte: start } }, // Database range ends after the query range starts
    ];
  }

  const data = await SheetData.find(query).populate('portfolio_name').populate('property_name').sort({ from: 1 });

  // Filter data based on role and connectedEntityIds or propertyName
  const filteredData = data.filter((item) => {
    // First apply propertyName filter if provided (for any role)
    if (propertyName && item.property_name?.name) {
      const propertyNameMatch = item.property_name.name.toLowerCase().includes(propertyName.toLowerCase());
      if (!propertyNameMatch) return false;
    }
    
    // Then apply role-based filtering
    switch (role) {
      case 'portfolio':
        return connectedEntityIds.includes(item.portfolio_name?._id?.toString());
      case 'sub-portfolio':
        return connectedEntityIds.includes(item.sub_portfolio_name?._id?.toString());
      case 'property':
        return connectedEntityIds.includes(item.property_name?._id?.toString());
      case 'admin':
        return true; // Admin can see all data (propertyName filter is already applied above)
      default:
        return true;
    }
  });

  // Initialize totals
  let expediaCollectable = 0;
  let expediaConfirmed = 0;
  let bookingCollectable = 0;
  let bookingConfirmed = 0;
  let agodaCollectable = 0;
  let agodaConfirmed = 0;

  const monthlyData = {};

  // Iterate through filtered data and calculate metrics
  filteredData.forEach((item) => {
    // console.log("items", item);
    expediaCollectable += parseCurrency(item.expedia?.amount_collectable);
    expediaConfirmed += parseCurrency(item.expedia?.amount_confirmed);
    bookingCollectable += parseCurrency(item.booking?.amount_collectable);
    bookingConfirmed += parseCurrency(item.booking?.amount_confirmed);
    agodaCollectable += parseCurrency(item.agoda?.amount_collectable);
    agodaConfirmed += parseCurrency(item.agoda?.amount_confirmed);

    const date = new Date(item.from);
    const monthKey = date.toLocaleString('default', { month: 'long' });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        collectable: 0,
        confirmed: 0,
      };
    }

    const monthlyExpediaCollectable = parseCurrency(item.expedia?.amount_collectable);
    const monthlyExpediaConfirmed = parseCurrency(item.expedia?.amount_confirmed);
    const monthlyBookingCollectable = parseCurrency(item.booking?.amount_collectable);
    const monthlyBookingConfirmed = parseCurrency(item.booking?.amount_confirmed);
    const monthlyAgodaCollectable = parseCurrency(item.agoda?.amount_collectable);
    const monthlyAgodaConfirmed = parseCurrency(item.agoda?.amount_confirmed);

    monthlyData[monthKey].collectable += monthlyExpediaCollectable + monthlyBookingCollectable + monthlyAgodaCollectable;
    monthlyData[monthKey].confirmed += monthlyExpediaConfirmed + monthlyBookingConfirmed + monthlyAgodaConfirmed;
  });

  const totalCollectable = expediaCollectable + bookingCollectable + agodaCollectable;
  const totalConfirmed = expediaConfirmed + bookingConfirmed + agodaConfirmed;

  // Calculate gross collection (total of all confirmed amounts)
  const grossCollection = totalConfirmed;

  const chartData = Object.entries(monthlyData).map(([month, values]) => ({
    month,
    collectable: parseFloat(values.collectable.toFixed(2)), // Use toFixed and convert back to number
    confirmed: parseFloat(values.confirmed.toFixed(2)), // Use toFixed and convert back to number
  }));

  return {
    metrics: {
      totalCollectable: parseFloat(totalCollectable.toFixed(2)), // Use toFixed for two decimal places
      totalConfirmed: parseFloat(totalConfirmed.toFixed(2)), // Use toFixed for two decimal places
      grossCollection: parseFloat(grossCollection.toFixed(2)), // Use toFixed for two decimal places
    },
    trend: chartData,
  };
};

const getStatusDistribution = async (role, connectedEntityIds, startDate, endDate) => {
  try {
    // Parse start and end date from query parameters, with default values
    const filter = {};

    // If date range is provided, filter the data based on the date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set the end time to the end of the day
      filter.$and = [
        { from: { $lte: end } }, // Database range starts before the query range ends
        { to: { $gte: start } }, // Database range ends after the query range starts
      ];
    }

    // Fetch data from the database based on the filter
    const data = await SheetData.find(filter);

    // Filter the data based on role and connectedEntityIds
    const filteredData = data.filter((item) => {
      switch (role) {
        case 'portfolio':
          return connectedEntityIds.includes(item.portfolio_name?._id?.toString());
        case 'sub-portfolio':
          return connectedEntityIds.includes(item.sub_portfolio_name?._id?.toString());
        case 'property':
          return connectedEntityIds.includes(item.property_name?._id?.toString());
        default: // Admin or other roles with access to all data
          return true;
      }
    });

    // Initialize status count map
    const statusCountMap = new Map();

    // Count statuses from all OTA platforms
    filteredData.forEach((item) => {
      // Count Expedia statuses
      if (item.expedia?.review_status) {
        const status = item.expedia.review_status.replace(/\s+/g, '').toLowerCase(); // Normalize case
        statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
      }

      // Count Booking.com statuses
      if (item.booking?.review_status) {
        const status = item.booking.review_status.replace(/\s+/g, '').toLowerCase(); // Normalize case
        statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
      }

      // Count Agoda statuses
      if (item.agoda?.review_status) {
        const status = item.agoda.review_status.replace(/\s+/g, '').toLowerCase(); // Normalize case
        statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
      }
    });

    // Define color mapping for different statuses
    const colorMap = {
      accessrequired: '#FF5733',
      approvalrequired: '#FFC300',
      otapost: '#34495E',
      otapostcompleted: '#2ECC71',
      invoiced: '#E74C3C',
      jobassigned: '#2980B9',
      noreviewrequired: '#7F8C8D',
      nothingtoreport: '#95A5A6',
      reportedtoproperty: '#5DADE2',
      refundrequired: '#9B59B6',
      hold: '#F39C12',
      ebs: '#27AE60',
      'ebs/jobassigned': '#1ABC9C',
      readytobeinvoiced: '#F1C40F',
      'otapost/accesslost': '#C0392B',
      clientconsole: '#8E44AD',
    };

    // Convert map to array and format for frontend
    const formattedData = Array.from(statusCountMap.entries()).map(([status, count]) => {
      // If status contains "batch," use the batch color
      const isBatch = status.startsWith('batch');
      return {
        status,
        count,
        fill: isBatch ? '#3498DB' : colorMap[status] || '#808080', // Default gray color if status not in colorMap
      };
    });

    // Calculate total based on the filtered data
    const total = filteredData.length;

    // Return the formatted data and total
    return {
      data: formattedData,
      total,
    };
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    throw new Error('Internal server error');
  }
};

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const getOTAPerformance = async (role, connectedEntityIds, startDate, endDate) => {
  const filter = {};

  // If date range is provided, filter the data based on the date range
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set the end time to the end of the day
    filter.from = { $gte: start, $lte: end }; // Filter for the specified date range
  }

  // Add role-based filtering
  if (role === 'portfolio') {
    // Filter for portfolio data (assuming `portfolioId` is part of your data)
    filter.portfolio_name = { $in: connectedEntityIds };
  } else if (role === 'sub-portfolio') {
    // Filter for sub-portfolio data (assuming `subPortfolioId` is part of your data)
    filter.sub_portfolio = { $in: connectedEntityIds };
  } else if (role === 'property') {
    // Filter for property data (assuming `propertyId` is part of your data)
    filter.property_name = { $in: connectedEntityIds };
  }

  // Fetch only necessary fields to reduce query time
  const data = await SheetData.find(filter, {
    'property_name.name': 1,
    'expedia.amount_collectable': 1,
    'expedia.amount_confirmed': 1,
    'booking.amount_collectable': 1,
    'booking.amount_confirmed': 1,
    'agoda.amount_collectable': 1,
    'agoda.amount_confirmed': 1,
  }).lean();

  // console.log('Data fetched:', data);
  // Helper function to clean and convert amount fields
  const parseAmount = (value) => {
    if (!value) return 0;
    const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
    const parsedValue = parseFloat(cleanedValue);
    return isNaN(parsedValue) ? 0 : parsedValue;
  };

  // Initialize metrics objects
  const initialMetrics = {
    otaMetrics: {
      Expedia: { reportedAmount: 0, claimedAmount: 0 },
      'Booking.com': { reportedAmount: 0, claimedAmount: 0 },
      Agoda: { reportedAmount: 0, claimedAmount: 0 },
    },
    propertyMetrics: {},
  };
  // console.log('initialMetrics', initialMetrics);

  // Use reduce to accumulate the results
  const { otaMetrics } = data.reduce((acc, item) => {
    const { property_name, expedia, booking, agoda, portfolio_name, sub_portfolio } = item;
    // console.log('item 1 ====>>>>>>>>>>>>>>>>>>', item);
    const propertyName = property_name?.name || 'Unknown Property';

    // Initialize property metrics if not already initialized
    if (!acc.propertyMetrics[propertyName]) {
      acc.propertyMetrics[propertyName] = { reportedAmount: 0, claimedAmount: 0 };
    }

    // // Check if this item matches the role's connectedEntityIds
    // if (role === 'portfolio' && !connectedEntityIds.includes(portfolio_name)) return acc;
    // if (role === 'sub-portfolio' && !connectedEntityIds.includes(sub_portfolio)) return acc;
    // if (role === 'property' && !connectedEntityIds.includes(property_name)) return acc;

    // console.log("item two=====>>>>>>>>", item)
    // Process Expedia data
    const expediaReported = parseAmount(expedia?.amount_collectable);
    // console.log('expediaReported', expediaReported);
    const expediaClaimed = parseAmount(expedia?.amount_confirmed);
    acc.otaMetrics.Expedia.reportedAmount += expediaReported;
    acc.otaMetrics.Expedia.claimedAmount += expediaClaimed;

    // Process Booking.com data
    const bookingReported = parseAmount(booking?.amount_collectable);
    const bookingClaimed = parseAmount(booking?.amount_confirmed);
    acc.otaMetrics['Booking.com'].reportedAmount += bookingReported;
    acc.otaMetrics['Booking.com'].claimedAmount += bookingClaimed;

    // Process Agoda data
    const agodaReported = parseAmount(agoda?.amount_collectable);
    const agodaClaimed = parseAmount(agoda?.amount_confirmed);
    acc.otaMetrics.Agoda.reportedAmount += agodaReported;
    acc.otaMetrics.Agoda.claimedAmount += agodaClaimed;

    // Add to property totals
    acc.propertyMetrics[propertyName].reportedAmount += expediaReported + bookingReported + agodaReported;
    acc.propertyMetrics[propertyName].claimedAmount += expediaClaimed + bookingClaimed + agodaClaimed;

    return acc;
  }, initialMetrics);

  // Format OTA data for the response
  const otaData = Object.entries(otaMetrics).map(([platform, metrics]) => ({
    platform,
    amountCollectable: metrics.reportedAmount.toFixed(2),
    amountConfirmed: metrics.claimedAmount.toFixed(2),
  }));

  return { otaData };
};

const getPropertyPerformance = async (role, connectedEntityIds, startDate, endDate, sub_portfolio, posting_type) => {
  const filter = {};

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set the end time to the end of the day
    filter.$and = [
      { from: { $lte: end } }, // Database range starts before the query range ends
      { to: { $gte: start } }, // Database range ends after the query range starts
    ];
  }

  if (sub_portfolio) {
    try {
      sub_portfolio = new ObjectId(sub_portfolio);
      filter.sub_portfolio = sub_portfolio;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw new AppError(error.message);
    }
  }

  if (posting_type) {
    filter.posting_type = posting_type;
  }

  if (role === 'portfolio') {
    filter.portfolio_name = { $in: connectedEntityIds };
  } else if (role === 'sub-portfolio') {
    filter.sub_portfolio = { $in: connectedEntityIds };
  } else if (role === 'property') {
    filter.property_name = { $in: connectedEntityIds };
  }

  // console.log(filter);

  try {
    const data = await SheetData.find(filter, {
      property_name: 1,
      portfolio_name: 1,
      'expedia.amount_collectable': 1,
      'expedia.amount_confirmed': 1,
      'booking.amount_collectable': 1,
      'booking.amount_confirmed': 1,
      'agoda.amount_collectable': 1,
      'agoda.amount_confirmed': 1,
    })
      .populate('property_name', 'name')
      .lean();

    const parseAmount = (value) => {
      if (!value) return 0;
      const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      return isNaN(parsedValue) ? 0 : parsedValue;
    };

    const result = data.map((item) => {
      const expediaCollectable = parseAmount(item.expedia?.amount_collectable);
      const expediaConfirmed = parseAmount(item.expedia?.amount_confirmed);
      const bookingCollectable = parseAmount(item.booking?.amount_collectable);
      const bookingConfirmed = parseAmount(item.booking?.amount_confirmed);
      const agodaCollectable = parseAmount(item.agoda?.amount_collectable);
      const agodaConfirmed = parseAmount(item.agoda?.amount_confirmed);

      return {
        property_name: item.property_name?.name || '',
        total_collectable: expediaCollectable + bookingCollectable + agodaCollectable,
        total_confirmed: expediaConfirmed + bookingConfirmed + agodaConfirmed,
      };
    });

    return result;
  } catch (error) {
    console.error('Error while fetching or processing data:', error);
    throw error;
  }
};

const getPortfolioPerformance = async (
  role,
  connectedEntityIds,
  startDate,
  endDate,
  page = 1,
  limit = 10,
  sortBy = 'portfolioName',
  sortOrder = 'asc',
) => {
  const filter = {};

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set the end time to the end of the day
    filter.$and = [
      { from: { $lte: end } }, // Database range starts before the query range ends
      { to: { $gte: start } }, // Database range ends after the query range starts
    ];
  }

  if (role === 'portfolio') {
    filter.portfolio_name = { $in: connectedEntityIds };
  } else if (role === 'sub-portfolio') {
    filter.sub_portfolio = { $in: connectedEntityIds };
  } else if (role === 'property') {
    filter.property_name = { $in: connectedEntityIds };
  }

  try {
    const data = await SheetData.find(filter, {
      portfolio_name: 1,
      'expedia.amount_collectable': 1,
      'expedia.amount_confirmed': 1,
      'booking.amount_collectable': 1,
      'booking.amount_confirmed': 1,
      'agoda.amount_collectable': 1,
      'agoda.amount_confirmed': 1,
    })
      .populate('portfolio_name', 'name')
      .lean();

    const parseAmount = (value) => {
      if (!value) return 0;
      const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      return isNaN(parsedValue) ? 0 : parsedValue;
    };

    // Group by portfolio name and calculate totals
    const portfolioTotals = data.reduce((acc, item) => {
      const portfolioName = item?.portfolio_name?.name || 'Unknown Property';

      const reportedAmount =
        parseAmount(item.expedia?.amount_collectable) +
        parseAmount(item.booking?.amount_collectable) +
        parseAmount(item.agoda?.amount_collectable);

      const claimedAmount =
        parseAmount(item.expedia?.amount_confirmed) +
        parseAmount(item.booking?.amount_confirmed) +
        parseAmount(item.agoda?.amount_confirmed);

      // console.log(portfolioName);
      if (!acc[portfolioName]) {
        acc[portfolioName] = {
          portfolioName,
          amountCollectable: 0,
          amountConfirmed: 0,
        };
      }

      acc[portfolioName].amountCollectable += reportedAmount;
      acc[portfolioName].amountConfirmed += claimedAmount;

      return acc;
    }, {});

    // Convert the grouped data into an array
    const consolidatedData = Object.values(portfolioTotals);

    // Sort portfolios
    const sortMultiplier = sortOrder === 'desc' ? -1 : 1;
    consolidatedData.sort((a, b) => {
      if (sortBy === 'portfolioName') {
        return a.portfolioName.localeCompare(b.portfolioName) * sortMultiplier;
      } else if (sortBy === 'amountCollectable') {
        return (a.amountCollectable - b.amountCollectable) * sortMultiplier;
      } else if (sortBy === 'amountConfirmed') {
        return (a.amountConfirmed - b.amountConfirmed) * sortMultiplier;
      }
      return 0;
    });

    // Paginate the results
    const startIndex = (page - 1) * limit;
    const paginatedData = consolidatedData.slice(startIndex, startIndex + limit);

    // Add pagination metadata
    const totalCount = consolidatedData.length;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      portfolios: paginatedData.map((portfolio) => ({
        ...portfolio,
        amountCollectable: portfolio.amountCollectable.toFixed(2),
        amountConfirmed: portfolio.amountConfirmed.toFixed(2),
      })),
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalCount,
      },
    };
  } catch (error) {
    console.error('Error while fetching or processing data:', error);
    throw error;
  }
};

module.exports = {
  getRevenueMetrics,
  getStatusDistribution,
  getOTAPerformance,
  getPropertyPerformance,
  getPortfolioPerformance,
};
