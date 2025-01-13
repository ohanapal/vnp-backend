const SheetData = require('../models/sheetDataModel'); // Adjust the path to your models

const parseCurrency = (value) => {
  if (!value) return 0;
  const cleanedValue = value.trim().replace(/[^0-9.-]+/g, '');
  const parsedValue = parseFloat(cleanedValue);
  return isNaN(parsedValue) ? 0 : parsedValue;
};

const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// const getRevenueMetrics = async (role, connectedEntityIds) => {
//   const data = await SheetData.find({}).populate('portfolio_name').populate('property_name').sort({ from: 1 });
//   console.log('Data fetched:', data.length);

//   let expediaTotal = 0;
//   let expediaCollected = 0;
//   let bookingTotal = 0;
//   let bookingCollected = 0;
//   let agodaTotal = 0;
//   let agodaCollected = 0;

//   const monthlyData = {};

//   data.forEach((item) => {
//     expediaTotal += parseCurrency(item.expedia?.amount_collectable);
//     expediaCollected += parseCurrency(item.expedia?.amount_confirmed);
//     bookingTotal += parseCurrency(item.booking?.amount_collectable);
//     bookingCollected += parseCurrency(item.booking?.amount_confirmed);
//     agodaTotal += parseCurrency(item.agoda?.amount_collectable);
//     agodaCollected += parseCurrency(item.agoda?.amount_confirmed);

//     const date = new Date(item.from);
//     // console.log('Date:', date);
//     const monthKey = date.toLocaleString('default', { month: 'long' });
//     // console.log('Month:', monthKey);
//     if (!monthlyData[monthKey]) {
//       monthlyData[monthKey] = {
//         audited: 0,
//         remaining: 0,
//         collected: 0,
//       };
//     }

//     const monthlyExpediaAudited = parseCurrency(item.expedia?.amount_collectable);
//     const monthlyExpediaCollected = parseCurrency(item.expedia?.amount_confirmed);
//     const monthlyBookingAudited = parseCurrency(item.booking?.amount_collectable);
//     const monthlyBookingCollected = parseCurrency(item.booking?.amount_confirmed);
//     const monthlyAgodaAudited = parseCurrency(item.agoda?.amount_collectable);
//     const monthlyAgodaCollected = parseCurrency(item.agoda?.amount_confirmed);

//     monthlyData[monthKey].audited += monthlyExpediaAudited + monthlyBookingAudited + monthlyAgodaAudited;
//     monthlyData[monthKey].collected += monthlyExpediaCollected + monthlyBookingCollected + monthlyAgodaCollected;
//     monthlyData[monthKey].remaining +=
//       monthlyExpediaAudited +
//       monthlyBookingAudited +
//       monthlyAgodaAudited -
//       (monthlyExpediaCollected + monthlyBookingCollected + monthlyAgodaCollected);
//   });

//   const total = expediaTotal + bookingTotal + agodaTotal;
//   const collected = expediaCollected + bookingCollected + agodaCollected;
//   const remaining = total - collected;

//   const previousMonth = {
//     total: total * 0.9,
//     collected: collected * 0.9,
//     remaining: remaining * 0.9,
//   };

//   const chartData = Object.entries(monthlyData).map(([month, values]) => ({
//     month,
//     audited: Math.round(values.audited),
//     remaining: Math.round(values.remaining),
//     collected: Math.round(values.collected),
//   }));

//   return {
//     metrics: {
//       total,
//       collected,
//       remaining,
//       changes: {
//         totalChange: calculatePercentageChange(total, previousMonth.total),
//         collectedChange: calculatePercentageChange(collected, previousMonth.collected),
//         remainingChange: calculatePercentageChange(remaining, previousMonth.remaining),
//       },
//     },
//     trend: chartData,
//     breakdown: {
//       expedia: {
//         total: expediaTotal,
//         collected: expediaCollected,
//         remaining: expediaTotal - expediaCollected,
//       },
//       booking: {
//         total: bookingTotal,
//         collected: bookingCollected,
//         remaining: bookingTotal - bookingCollected,
//       },
//       agoda: {
//         total: agodaTotal,
//         collected: agodaCollected,
//         remaining: agodaTotal - agodaCollected,
//       },
//     },
//   };
// };

const getRevenueMetrics = async (role, connectedEntityIds, startDate, endDate, propertyName) => {
  // Fetch and populate data
  const query = {};
  if (startDate || endDate) {
    query.from = {};
    if (startDate) query.from.$gte = new Date(startDate);
    if (endDate) query.from.$lte = new Date(endDate);
  }

  const data = await SheetData.find(query).populate('portfolio_name').populate('property_name').sort({ from: 1 });
  console.log('Data fetched:', data.length);

  // Filter data based on role and connectedEntityIds or propertyName
  const filteredData = data.filter((item) => {
    if (role === 'admin' && propertyName) {
      return item.property_name?.name?.toLowerCase().includes(propertyName.toLowerCase());
    }

    switch (role) {
      case 'portfolio':
        return connectedEntityIds.includes(item.portfolio_name?._id?.toString());
      case 'sub-portfolio':
        return connectedEntityIds.includes(item.sub_portfolio_name?._id?.toString());
      case 'property':
        return connectedEntityIds.includes(item.property_name?._id?.toString());
      default: // Admin or other roles with no propertyName filter
        return true;
    }
  });

  console.log('Filtered Data:', filteredData.length);

  // Initialize totals
  let expediaTotal = 0;
  let expediaCollected = 0;
  let bookingTotal = 0;
  let bookingCollected = 0;
  let agodaTotal = 0;
  let agodaCollected = 0;

  const monthlyData = {};

  // Iterate through filtered data and calculate metrics
  filteredData.forEach((item) => {
    expediaTotal += parseCurrency(item.expedia?.amount_collectable);
    expediaCollected += parseCurrency(item.expedia?.amount_confirmed);
    bookingTotal += parseCurrency(item.booking?.amount_collectable);
    bookingCollected += parseCurrency(item.booking?.amount_confirmed);
    agodaTotal += parseCurrency(item.agoda?.amount_collectable);
    agodaCollected += parseCurrency(item.agoda?.amount_confirmed);

    const date = new Date(item.from);
    const monthKey = date.toLocaleString('default', { month: 'long' });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        audited: 0,
        remaining: 0,
        collected: 0,
      };
    }

    const monthlyExpediaAudited = parseCurrency(item.expedia?.amount_collectable);
    const monthlyExpediaCollected = parseCurrency(item.expedia?.amount_confirmed);
    const monthlyBookingAudited = parseCurrency(item.booking?.amount_collectable);
    const monthlyBookingCollected = parseCurrency(item.booking?.amount_confirmed);
    const monthlyAgodaAudited = parseCurrency(item.agoda?.amount_collectable);
    const monthlyAgodaCollected = parseCurrency(item.agoda?.amount_confirmed);

    monthlyData[monthKey].audited += monthlyExpediaAudited + monthlyBookingAudited + monthlyAgodaAudited;
    monthlyData[monthKey].collected += monthlyExpediaCollected + monthlyBookingCollected + monthlyAgodaCollected;
    monthlyData[monthKey].remaining +=
      monthlyExpediaAudited +
      monthlyBookingAudited +
      monthlyAgodaAudited -
      (monthlyExpediaCollected + monthlyBookingCollected + monthlyAgodaCollected);
  });

  const total = expediaTotal + bookingTotal + agodaTotal;
  const collected = expediaCollected + bookingCollected + agodaCollected;
  const remaining = total - collected;

  const chartData = Object.entries(monthlyData).map(([month, values]) => ({
    month,
    audited: Math.round(values.audited),
    remaining: Math.round(values.remaining),
    collected: Math.round(values.collected),
  }));

  return {
    metrics: {
      total,
      collected,
      remaining,
    },
    trend: chartData,
    breakdown: {
      expedia: {
        total: expediaTotal,
        collected: expediaCollected,
        remaining: expediaTotal - expediaCollected,
      },
      booking: {
        total: bookingTotal,
        collected: bookingCollected,
        remaining: bookingTotal - bookingCollected,
      },
      agoda: {
        total: agodaTotal,
        collected: agodaCollected,
        remaining: agodaTotal - agodaCollected,
      },
    },
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
      filter.from = { $gte: start, $lte: end }; // Filter for the specified date range
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
      NoReviewRequired: '#0e7aff',
      NothingToReport: '#ffcc00',
      Invoiced: '#ff6600',
      AccessRequired: '#ff3300',
      WorkManagement: '#33cc33',
      OTAPostCompleted: '#3399ff',
      ReportedToProperty: '#9933ff',
      Batch12102024: '#ff3399',
      JobAssigned: '#ff9933',
    };

    // Convert map to array and format for frontend
    const formattedData = Array.from(statusCountMap.entries()).map(([status, count]) => ({
      status,
      count,
      fill: colorMap[status] || '#808080', // Default gray color if status not in colorMap
    }));

    // Calculate total based on the filtered data
    // const total = formattedData.reduce((acc, curr) => acc + curr.count, 0);
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

module.exports = { getRevenueMetrics, getStatusDistribution };
