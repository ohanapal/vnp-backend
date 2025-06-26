const { addRow, getData, deleteData, updateCell, fetchGoogleSheetData } = require('../services/sheetCRUDService');
const { google } = require('googleapis');
const SheetData = require('../models/sheetDataModel');
const WebSocket = require('ws');
const AppError = require('../utils/appError');
const auth = require('../config/auth'); // Assuming you have an auth configuration
const PortfolioModel = require('../models/portfolioModel');
const SubPortfolioModel = require('../models/subPortfolioModel');
const PropertyModel = require('../models/propertyModel');
const moment = require('moment');

const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws) => {
  console.log('Client connected');
});

// Helper function to create section mapping
const createSectionMapping = (sectionHeaders, columnHeaders) => {
  const mapping = {};
  let currentSection = '';
  
  console.log('Creating section mapping...');
  console.log('Section headers:', sectionHeaders);
  console.log('Column headers:', columnHeaders);
  
  for (let i = 0; i < columnHeaders.length; i++) {
    // Update current section if we encounter a section header
    if (sectionHeaders[i] && sectionHeaders[i].trim() !== '') {
      currentSection = sectionHeaders[i].trim().toLowerCase();
      console.log(`  Position ${i}: New section "${currentSection}"`);
    }
    
    const columnName = columnHeaders[i];
    if (columnName && columnName.trim() !== '') {
      mapping[columnName.trim()] = {
        section: currentSection,
        index: i
      };
      console.log(`  Position ${i}: Column "${columnName.trim()}" -> Section "${currentSection}"`);
    }
  }
  
  return mapping;
};

// Helper function to get value by section and column name with fallback options
const getValueBySection = (rowData, sectionMapping, columnNames, targetSection) => {
  // Convert single column name to array for consistency
  const columnNamesToCheck = Array.isArray(columnNames) ? columnNames : [columnNames];
  
  console.log(`Looking for columns: ${JSON.stringify(columnNamesToCheck)} in section: "${targetSection}"`);
  
  // Try each column name until we find a match
  for (const columnName of columnNamesToCheck) {
    // Find all columns with this name in the target section
    const matchingColumns = Object.entries(sectionMapping).filter(([col, info]) => {
      const colMatch = col.toLowerCase().trim() === columnName.toLowerCase().trim();
      const sectionMatch = info.section.toLowerCase() === targetSection.toLowerCase();
      
      return colMatch && sectionMatch;
    });
    
    if (matchingColumns.length > 0) {
      const [foundColumnName, columnInfo] = matchingColumns[0];
      const value = rowData[columnInfo.index] || null;
      console.log(`  Found "${columnName}" in section "${targetSection}" at index ${columnInfo.index}: "${value}"`);
      return value;
    }
  }
  
  console.log(`  No matching column found for any of ${JSON.stringify(columnNamesToCheck)} in section "${targetSection}"`);
  return null;
};

exports.notifyChange = async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  try {
    const { rowNumber, sheetId } = req.body;
    console.log('Received message:', req.body);

    if (!rowNumber || !sheetId) {
      return res.status(400).send('Missing required fields: rowNumber or sheetId');
    }

    // Fetch both header rows to understand the section structure
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "'Master Trace-VNP'!B1:AZ2" // Fetch both row 1 (sections) and row 2 (column names)
    });

    const headerRows = headerResponse.data.values;
    if (!headerRows || headerRows.length < 2) {
      return res.status(400).send('No headers found in the sheet');
    }

    const sectionHeaders = headerRows[0]; // Row 1: EXPEDIA, BOOKING, AGODA
    const columnHeaders = headerRows[1]; // Row 2: Actual column names

    // Create section mapping
    const sectionMapping = createSectionMapping(sectionHeaders, columnHeaders);

    // Fetch the specified row data
    const rowResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'Master Trace-VNP'!B${rowNumber}:AZ${rowNumber}`, // Extended range to include Agoda columns
    });

    const rowData = rowResponse.data.values ? rowResponse.data.values[0] : null;

    if (!rowData || rowData.every((cell) => !cell || cell.trim() === '')) {
      await SheetData.deleteOne({ unique_id: rowNumber });
      console.log(`Row ${rowNumber} deleted from MongoDB`);

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ message: 'Row deleted', rowNumber }));
        }
      });

      return res.status(200).send(`Row ${rowNumber} deleted from the database.`);
    }

    // Map headers to their corresponding row values (for general columns)
    const rowObject = columnHeaders.reduce((acc, header, index) => {
      acc[header.trim()] = rowData[index]?.trim() || null;
      return acc;
    }, {});

    console.log('Section Mapping:', JSON.stringify(sectionMapping, null, 2));
    
    // Test the getValueBySection function for each platform
    console.log('Testing getValueBySection:');
    
    // Print all columns by section to debug
    console.log('Columns by section:');
    Object.entries(sectionMapping).forEach(([column, info]) => {
      console.log(`  ${info.section}: ${column}`);
    });
    
    console.log('Expedia username:', getValueBySection(rowData, sectionMapping, ['User Name', 'Email User Name'], 'expedia'));
    console.log('Booking username:', getValueBySection(rowData, sectionMapping, ['User Name', 'Username'], 'booking'));
    console.log('Agoda username:', getValueBySection(rowData, sectionMapping, 'User Name', 'agoda'));

    // console.log('Mapped row object:', rowObject);
    const parseDate = (dateString) => {
      if (!dateString || dateString === 'To' || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        return undefined; // Return undefined for invalid date
      }

      const [month, day, year] = dateString.split('/');
      const date = new Date(`${year}-${month}-${day}`); // Use YYYY-MM-DD format for better parsing

      return isNaN(date) ? undefined : date;
    };

    console.log('Row data:', rowObject);

    // Build the mapped data object using header keys
    const mappedData = {
      unique_id: rowNumber, // Use rowNumber as the unique identifier consistently
      posting_type: rowObject['Posting Type'],
      portfolio_name: rowObject['Portfolio'],
      sub_portfolio: rowObject['Sub Portfolio'],
      property_name: rowObject['Property Name'],
      // from: rowObject['From'] ? new Date(rowObject['From']) : undefined,
      // to: rowObject['To'] ? new Date(rowObject['To']) : undefined,
      from: parseDate(rowObject['From']),
      to: parseDate(rowObject['To']),
      next_audit_date: parseDate(rowObject['Next Review Date']),
      
      expedia: {
        expedia_id: rowObject['Expedia ID'],
        review_status: rowObject['Expedia Review Status'],
        billing_type: rowObject['Billing Type'],
        remaining_or_direct_billed: rowObject['Remaining/Direct Billed'],
        amount_collectable: rowObject['Expedia Amount Reported to Property'],
        additional_revenue: rowObject['Additional Revenue'],
        amount_confirmed: rowObject['Expedia Amount Confirmed by Property'],
        // username: getValueBySection(rowData, sectionMapping, ['User Name', 'Email User Name'], 'expedia'),
        username: null,
        // user_email: rowObject['Email User Name'],
        user_email: null,
        // user_password: getValueBySection(rowData, sectionMapping, 'Password', 'expedia'),
        user_password: null,
      },
      booking: {
        booking_id: rowObject['Booking ID'],
        review_status: rowObject['Booking.Com Review Status'],
        amount_collectable: rowObject['Booking.com Amount to be Claimed'],
        amount_confirmed: rowObject['Booking.com Amount Confirmed by Property'],
        // username: getValueBySection(rowData, sectionMapping, ['User Name', 'Username'], 'booking'),
        username: null,
        // user_password: getValueBySection(rowData, sectionMapping, 'Password', 'booking'),
        user_password: null,
      },
      agoda: {
        agoda_id: rowObject['Agoda ID'],
        review_status: rowObject['AGODA Review Status'],
        amount_collectable: rowObject['Amount to be Claimed From Agoda'],
        amount_confirmed: rowObject['Amount Confirmed by Property'],
        username: getValueBySection(rowData, sectionMapping, 'User Name', 'agoda'),
        user_password: getValueBySection(rowData, sectionMapping, 'Password', 'agoda'),
      },
    };

    // Add the check here - rowNumber should be a valid number
    if (!rowNumber || !/^\d+$/.test(rowNumber.toString().trim())) {
      console.log(`Invalid row number: ${rowNumber}`);
      return res.status(400).send(`Invalid row number: ${rowNumber}`);
    }    

    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Helper function to get or create a document
    const getOrCreate = async (model, name) => {
      if (!name) return null;
      const normalizedName = name.trim().toLowerCase();
      const escapedName = escapeRegExp(normalizedName); // Escape special characters
      const doc = await model.findOneAndUpdate(
        { name: new RegExp(`^${escapedName}$`, 'i') },
        { name: normalizedName },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return doc._id;
    };

    mappedData.portfolio_name = await getOrCreate(PortfolioModel, mappedData.portfolio_name);
    mappedData.sub_portfolio = await getOrCreate(SubPortfolioModel, mappedData.sub_portfolio);
    mappedData.property_name = await getOrCreate(PropertyModel, mappedData.property_name);

    await SheetData.updateOne({ unique_id: mappedData.unique_id }, { $set: mappedData }, { upsert: true });

    console.log('Row data upserted successfully:', mappedData);

    res.status(200).send('Row data processed successfully');
  } catch (error) {
    console.error('Error processing notification:', error.message);
    res.status(500).send('Error processing notification');
  }
};

//delete row from the google sheets
exports.deleteRow = async (req, res) => {
  try {
    const { message, data } = req.body;
    console.log('Received message:', req.body);

    if (!data || !data.headers || !data.deletedRowValues) {
      return res.status(400).json({ error: 'Invalid request payload.' });
    }

    console.log('Headers:', data.headers);
    console.log('Deleted Row Values:', data.deletedRowValues);

    // Normalize and trim headers
    const normalizedHeaders = data.headers.map((header) => header.trim().toLowerCase());

    // Map headers to their corresponding row values
    const rowObject = normalizedHeaders.reduce((acc, header, index) => {
      acc[header] = data.deletedRowValues[index]?.trim() || null;
      return acc;
    }, {});

    console.log('Mapped Row Object:', rowObject);

    // Get the ID value directly using the header name
    const idValue = rowObject['id'];
    if (!idValue) {
      return res.status(400).json({ error: 'ID value not found in the deleted row.' });
    }

    console.log(`Deleting data with ID: ${idValue}`);

    const result = await SheetData.findOneAndDelete({ unique_id: idValue });
    if (!result) {
      return res.status(404).json({ error: 'Data not found for the given ID.' });
    }

    res.status(200).json({
      message: 'Data successfully deleted.',
      deletedData: result,
    });
  } catch (error) {
    console.error('Error while deleting data:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const formatDate = (dateString) => {
  console.log(`Received date string: ${dateString}`);

  // Check if the date string is valid and has a slash separator
  if (!dateString || !dateString.includes('/')) {
    console.log(`Invalid date string: ${dateString} - Missing '/' separator.`);
    return null;
  }

  // Handle cases where month, day, and year might be single digits
  const [month, day, year] = dateString.split('/');
  console.log(`Split date: month=${month}, day=${day}, year=${year}`);

  // Validate the extracted month, day, and year
  if (!month || !day || !year || month.length > 2 || day.length > 2 || year.length !== 4) {
    console.log(`Invalid date format: ${dateString} - Invalid month/day/year lengths.`);
    return null;
  }

  // Use moment.js for flexible parsing of date strings
  console.log(`Attempting to parse with moment.js: ${dateString}`);
  const formattedDate = moment(dateString, 'M/D/YYYY', true); // M/D/YYYY format to handle single digits

  // Check if the date is valid
  if (!formattedDate.isValid()) {
    console.log(`Invalid date format: ${dateString} - Moment.js could not parse.`);
    return null; // Return null for invalid dates
  }

  // Additional leap year check (February 29 validation)
  if (month === '02' && day === '29') {
    console.log(`Checking leap year for: ${dateString}`);
    if (!moment(`${year}-02-29`, 'YYYY-MM-DD').isValid()) {
      console.log(`Invalid leap year date: ${dateString} - Not a valid leap year.`);
      return null; // Return null if it's an invalid leap year date
    }
  }

  // Return the date in the desired format
  console.log(`Valid date: ${dateString} - Returning formatted date.`);
  return formattedDate.format('YYYY-MM-DD'); // Format as YYYY-MM-DD
};

//app.post('/bulk-upload',
exports.bulkUpload = async (req, res) => {
  // console.log('Bulk upload initiated:', req.body);

  const client = await auth.getClient();
  // console.log("client", client)
  const sheets = google.sheets({ version: 'v4', auth: client });

  try {
    const { sheetId } = req.body;
    if (!sheetId) {
      return res.status(400).send('Missing required field: sheetId');
    }

    
    // Fetch the entire sheet data, including headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "'Master Trace-VNP'!B1:AZ", // Extended range to include Agoda columns
    });


    const rows = response.data.values;
    if (!rows || rows.length < 3) {
      return res.status(404).send('No data found in the sheet');
    }

    // Extract both header rows
    const sectionHeaders = rows[0]; // Row 1: EXPEDIA, BOOKING, AGODA
    const columnHeaders = rows[1];  // Row 2: Actual column names
    const dataRows = rows.slice(2);
    
    // Create section mapping for bulk upload
    const sectionMapping = createSectionMapping(sectionHeaders, columnHeaders);
    
    // console.log('Section Headers:', JSON.stringify(sectionHeaders));
    // console.log('Column Headers:', JSON.stringify(columnHeaders));

    // Use the same parseDate function as notifyChange
    const parseDate = (dateString) => {
      if (!dateString || dateString === 'To' || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        return undefined; // Return undefined for invalid date
      }

      const [month, day, year] = dateString.split('/');
      const date = new Date(`${year}-${month}-${day}`); // Use YYYY-MM-DD format for better parsing

      return isNaN(date) ? undefined : date;
    };

    const getCellValue = (row, headerName) => {
      let index = columnHeaders.indexOf(headerName);
      
      // If exact match not found, try case-insensitive search
      if (index === -1) {
        index = columnHeaders.findIndex(header => 
          header && header.toLowerCase().trim() === headerName.toLowerCase().trim()
        );
      }
      
      const value = index >= 0 ? row[index] || '' : '';

      return value;
    };

    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Helper function to get or create a document
    const getOrCreate = async (model, name) => {
      if (!name) return null;
      const normalizedName = name.trim().toLowerCase();
      const escapedName = escapeRegExp(normalizedName); // Escape special characters
      const doc = await model.findOneAndUpdate(
        { name: new RegExp(`^${escapedName}$`, 'i') },
        { name: normalizedName },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return doc._id;
    };

    // Prepare bulk operations for MongoDB
    const bulkOps = await Promise.all(
      dataRows.map(async (row, index) => {
        // console.log('row', row.serial);
        const uniqueId = getCellValue(row, 'id');
        if (!/^\d+$/.test(uniqueId?.trim())) {
          console.log(`Invalid ID in row ${index + 1}: ${uniqueId}`);
          return null;
        }

        const portfolioId = await getOrCreate(PortfolioModel, getCellValue(row, 'Portfolio'));
        const subPortfolioId = await getOrCreate(SubPortfolioModel, getCellValue(row, 'Sub Portfolio'));
        const propertyId = await getOrCreate(PropertyModel, getCellValue(row, 'Property Name'));

        return {
          updateOne: {
            filter: { unique_id: uniqueId },
            update: {
              $set: {
                unique_id: uniqueId,
                posting_type: getCellValue(row, 'Posting Type'),
                portfolio_name: portfolioId,
                sub_portfolio: subPortfolioId,
                property_name: propertyId,
                from: parseDate(getCellValue(row, 'From')),
                to: parseDate(getCellValue(row, 'To')),
                next_audit_date: parseDate(getCellValue(row, 'Next Review Date')),

                expedia: {
                  expedia_id: getCellValue(row, 'Expedia ID'),
                  review_status: getCellValue(row, 'Expedia Review Status'),
                  billing_type: getCellValue(row, 'Billing Type'),
                  remaining_or_direct_billed: getCellValue(row, 'Remaining/Direct Billed'),
                  amount_collectable: getCellValue(row, 'Expedia Amount Reported to Property'),
                  additional_revenue: parseFloat(getCellValue(row, 'Additional Revenue')) || 0,
                  amount_confirmed: getCellValue(row, 'Expedia Amount Confirmed by Property'),
                  // username: getValueBySection(row, sectionMapping, ['User Name', 'Email User Name'], 'expedia'),
                  username: null,
                  // user_email: getCellValue(row, 'Email User Name'),
                  user_email: null,
                  // user_password: getValueBySection(row, sectionMapping, 'Password', 'expedia'),
                  user_password: null,
                },

                booking: {
                  booking_id: getCellValue(row, 'Booking ID'),
                  review_status: getCellValue(row, 'Booking.Com Review Status'),
                  amount_collectable: getCellValue(row, 'Booking.com Amount to be Claimed'),
                  amount_confirmed: getCellValue(row, 'Booking.com Amount Confirmed by Property'),
                  // username: getValueBySection(row, sectionMapping, ['User Name', 'Username'], 'booking'),
                  username: null,
                  // user_password: getValueBySection(row, sectionMapping, 'Password', 'booking'),
                  user_password: null,
                },

                agoda: {
                  agoda_id: getCellValue(row, 'Agoda ID'),
                  review_status: getCellValue(row, 'AGODA Review Status'),
                  amount_collectable: getCellValue(row, 'Amount to be Claimed From Agoda'),
                  amount_confirmed: getCellValue(row, 'Amount Confirmed by Property'),
                  username: getValueBySection(row, sectionMapping, 'User Name', 'agoda'),
                  user_password: getValueBySection(row, sectionMapping, 'Password', 'agoda'),
                },
              },
            },
            upsert: true,
          },
        };
      }),
    );

    const result = await SheetData.bulkWrite(bulkOps);

    console.log(`Bulk upload completed. ${bulkOps.length} rows processed.`);
    res.status(200).send({
      message: `Bulk upload successful. ${bulkOps.length} rows processed.`,
      details: {
        inserted: result.insertedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
      },
    });
  } catch (error) {
    console.error('Error during bulk upload:', error);
    res.status(500).send({ message: 'Error during bulk upload', error: error.message });
  }
};

//sheets/add-row
exports.createRow = async (req, res) => {
  try {
    const { spreadsheetId, sheetName, rowData } = req.body;
    const client = await auth.getClient();
    await addRow(client, spreadsheetId, sheetName, rowData);
    res.status(200).json({ message: 'Row added successfully', data: rowData });
  } catch (error) {
    console.error('Error adding row:', error);
    res.status(500).json({
      error: 'Error adding row',
      details: error.message,
    });
  }
};

//app.get('/sheets/get-data',
exports.getData = async (req, res) => {
  try {
    const { spreadsheetId, sheetName, ...searchParams } = req.query;
    const client = await auth.getClient();

    // Convert search parameters
    const parsedSearchParams = Object.fromEntries(
      Object.entries(searchParams).map(([key, value]) => [key, decodeURIComponent(value)]),
    );

    const data = await getData(client, spreadsheetId, sheetName, parsedSearchParams);
    res.status(200).json({
      message: 'Data retrieved successfully',
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({
      error: 'Error getting data',
      details: error.message,
    });
  }
};

//app.put('/sheets/update-cell',
exports.updateCell = async (req, res) => {
  try {
    const { spreadsheetId, sheetName, rowNumber, columnName, newValue } = req.body;

    // Validate input
    if (!rowNumber || !Array.isArray(columnName) || !Array.isArray(newValue)) {
      return res.status(400).json({
        error: 'Missing required fields or invalid format',
        example: {
          spreadsheetId: 'your-sheet-id',
          sheetName: 'Master Trace-VNP',
          rowNumber: 2,
          columnName: ['Units Sold', 'Manufacturing Price'],
          newValue: ['$20000', '$2000000'],
        },
      });
    }

    // Check if columnName and newValue arrays have same length
    if (columnName.length !== newValue.length) {
      return res.status(400).json({
        error: 'Array length mismatch',
        message: 'columnName and newValue arrays must have the same length',
      });
    }

    const client = await auth.getClient();
    const updateResults = await updateCell(client, spreadsheetId, sheetName, rowNumber, columnName, newValue);

    res.status(200).json({
      message: `Successfully updated ${updateResults.length} cells`,
      rowNumber: rowNumber,
      updates: updateResults,
    });
  } catch (error) {
    console.error('Error updating cells:', error);
    res.status(500).json({
      error: 'Error updating cells',
      details: error.message,
    });
  }
};

//app.delete('/sheets/delete-data',
exports.deleteData = async (req, res) => {
  try {
    const { spreadsheetId, sheetName, rowNumber } = req.query;
    const client = await auth.getClient();
    await deleteData(client, spreadsheetId, sheetName, rowNumber);
    res.status(200).json({
      message: `Row ${rowNumber} deleted successfully`,
      rowNumber,
    });
  } catch (error) {
    console.error('Error deleting row:', error);
    res.status(500).json({
      error: 'Error deleting row',
      details: error.message,
    });
  }
};

exports.updateDatabase = async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  try {
    const { sheetId } = req.body;
    if (!sheetId) {
      return res.status(400).send('Missing required field: sheetId');
    }

    // Fetch the entire sheet data, including headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet3!A1:Z', // Include header row
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return res.status(404).send('No data found in the sheet');
    }

    // Extract headers and map them to their indices
    const headers = rows[1];
    const dataRows = rows.slice(2);

    const getCellValue = (row, headerName) => {
      const index = headers.indexOf(headerName);
      const value = index >= 0 ? row[index] || '' : '';

      return value;
    };

    // Prepare bulk operations for MongoDB
    const bulkOps = await Promise.all(
      dataRows.map(async (row, index) => {
        // console.log('row', row.serial);
        const uniqueId = getCellValue(row, 'id');
        if (!uniqueId) {
          console.log(`Skipping row ${index + 1}: Missing or invalid Serial Number`);
          return null;
        }

        return {
          updateOne: {
            filter: { unique_id: uniqueId },
            update: {
              $set: {
                expedia: {
                  expedia_id: getCellValue(row, 'Expedia ID'),
                  review_status: getCellValue(row, 'Expedia Review Status'),
                  billing_type: getCellValue(row, 'Billing Type'),
                  remaining_or_direct_billed: getCellValue(row, 'Remaining/Direct Billed'),
                  amount_collectable: getCellValue(row, 'EXPEDIA AMOUNT COLLECTABLE'),
                  additional_revenue: parseFloat(getCellValue(row, 'Additional Revenue')) || 0,
                  amount_confirmed: getCellValue(row, 'EXPEDIA AMOUNT CONFIRMED'),
                  username: getCellValue(row, 'User Name'),
                  user_email: getCellValue(row, 'Email User Name'),
                  user_password: getCellValue(row, 'Password'),
                },
                booking: {
                  booking_id: getCellValue(row, 'Booking ID'),
                  review_status: getCellValue(row, 'Booking.Com Review Status'),
                  amount_collectable: getCellValue(row, 'BOOKING.COM AMOUNT COLLECTABLE'),
                  amount_confirmed: getCellValue(row, 'BOOKING.COM AMOUNT CONFIRMED'),
                  username: getCellValue(row, 'User Name'),
                  user_password: getCellValue(row, 'Password'),
                },
                agoda: {
                  agoda_id: getCellValue(row, 'Agoda ID'),
                  review_status: getCellValue(row, 'AGODA Review Status'),
                  amount_collectable: getCellValue(row, 'AGODA AMOUNT COLLECTABLE'),
                  amount_confirmed: getCellValue(row, 'AGODA AMOUNT CONFIRMED'),
                  username: getCellValue(row, 'User Name'),
                  user_password: getCellValue(row, 'Password'),
                },
              },
            },
            upsert: true,
          },
        };
      }),
    );

    const result = await SheetData.bulkWrite(bulkOps);

    console.log(` upload completed. ${bulkOps.length} rows processed.`);
    res.status(200).send({
      message: ` upload successful. ${bulkOps.length} rows processed.`,
      details: {
        inserted: result.insertedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
      },
    });
  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).send({ message: 'Error during upload', error: error.message });
  }
};


exports.showsomefield = async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  try {
    const { sheetId } = req.body;
    if (!sheetId) {
      return res.status(400).send('Missing required field: sheetId');
    }

    // Fetch the entire sheet data, including headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet3!A1:Z', // Include header row
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return res.status(404).send('No data found in the sheet');
    }

    // Extract headers and map them to their indices
    const headers = rows[1];
    const dataRows = rows.slice(2);

    const getCellValue = (row, headerName) => {
      const index = headers.indexOf(headerName);
      const value = index >= 0 ? row[index] || '' : '';
      return value;
    };

    // Prepare data with email fields
    const emailData = dataRows.map((row, index) => {
      const uniqueId = getCellValue(row, 'id');
      if (!uniqueId) {
        console.log(`Skipping row ${index + 1}: Missing or invalid Serial Number`);
        return null;
      }

      return {
        id: uniqueId,
        expedia_email: getCellValue(row, 'EXPEDIA Email Assoicated'),
        property_email: getCellValue(row, 'Property Contact Email'),
        portfolio_email: getCellValue(row, 'Portfolio Contact Email'),
        multi_email: getCellValue(row, 'Multiple Portfolio Email Address'),
      };
    }).filter(item => item !== null);

    

    res.status(200).send({ 
      message: 'Email data retrieved successfully', 
      total_records: emailData.length,
      data: emailData,
    });
  } catch (error) {
    console.error('Error retrieving email data:', error);
    res.status(500).send({ message: 'Error retrieving email data', error: error.message });
  }
};
