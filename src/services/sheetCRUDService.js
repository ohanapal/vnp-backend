const path = require('path');
const { google } = require('googleapis');
const columnToLetter = require('../utils/columnToLetter'); // Assuming you have this utility function

const KEYFILEPATH = path.join(__dirname, 'keys', 'sa.json');

// Define the scopes required
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets'
];

// Create an authorized client
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

async function addRow(auth, spreadsheetId, sheetName, rowData) {
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',  // Changed from 'RAW' to 'USER_ENTERED'
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowData],
    },
  });

  console.log('Row added:', rowData);
}

async function getData(auth, spreadsheetId, sheetName, options = {}) {
  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch all data from the sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1000`, // Adjust range as needed
  });

  let data = response.data.values || [];
  
  // If no headers, return all data
  if (data.length === 0) return [];

  // Extract headers (first row)
  const headers = data[0].map(header => header.trim());
  const dataRows = data.slice(1);

  // Apply filtering based on query parameters
  const filteredData = dataRows.filter(row => {
    // If no search criteria, return all rows
    if (Object.keys(options).length === 0) return true;

    // Check each search criterion
    return Object.entries(options).every(([key, value]) => {
      // Find the column index for the search key
      const columnIndex = headers.findIndex(header => 
        header.toLowerCase() === key.toLowerCase()
      );

      // If column not found, skip this row
      if (columnIndex === -1) return false;

      // Get the cell value, convert both to string for comparison
      const cellValue = row[columnIndex] ? row[columnIndex].toString().toLowerCase().trim() : '';
      const searchValue = value.toString().toLowerCase().trim();

      // Support partial and exact matching
      return cellValue.includes(searchValue);
    });
  });

  // Transform data into array of objects
  const formattedData = filteredData.map(row => {
    const rowObject = {};
    headers.forEach((header, index) => {
      rowObject[header] = row[index] || null;
    });
    return rowObject;
  });

  console.log('Filtered Data:', formattedData);
  return formattedData;
}

async function deleteData(auth, spreadsheetId, sheetName, rowNumber) {
  const sheets = google.sheets({ version: 'v4', auth });

  // Get the sheet properties to determine the last column
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [sheetName],
    includeGridData: false
  });

  const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
  const lastColumn = columnToLetter(sheet.properties.gridProperties.columnCount);

  // Create a range for the entire row
  const range = `${sheetName}!A${rowNumber}:${lastColumn}${rowNumber}`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: range,
  });

  console.log(`Row ${rowNumber} in ${sheetName} cleared`);
}

async function updateCell(auth, spreadsheetId, sheetName, rowNumber, columnName, newValue) {
  const sheets = google.sheets({ version: 'v4', auth });

  // Get headers to find column letters
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`, // Get first row (headers)
  });
  
  const headers = response.data.values[0];
  const updates = [];

  // Process each column update
  for (let i = 0; i < columnName.length; i++) {
    const colName = columnName[i];
    const value = newValue[i];
    
    // Find column index with case-insensitive matching and trimming
    const columnIndex = headers.findIndex(
      header => header.trim().toLowerCase() === colName.trim().toLowerCase()
    );
    
    if (columnIndex === -1) {
      throw new Error(`Column '${colName}' not found in headers`);
    }

    const columnLetter = columnToLetter(columnIndex + 1);
    const range = `${sheetName}!${columnLetter}${rowNumber}`;
    
    updates.push({
      range: range,
      values: [[value]]
    });
  }

  // Update all cells in one batch request
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: updates
    }
  });

  console.log(`Updated ${updates.length} cells in row ${rowNumber}`);
  return updates.map((update, index) => ({
    cell: update.range,
    columnName: columnName[index],
    newValue: newValue[index]
  }));
}


async function fetchGoogleSheetData(auth, spreadsheetId) {
  const sheets = google.sheets({ version: "v4", auth });
  const RANGE = "'Master Trace-VNP'!B:Z";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error("No data found in the Google Sheet.");
  }

  // Process headers, trimming spaces and ignoring empty headers
  let headers = rows[0].map(header => header.trim()).filter(header => header);

  return rows.slice(1).map(row => {
    let rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || "";
    });
    return rowData;
  });
}


module.exports = {
  addRow,
  getData,
  deleteData,
  updateCell,
  fetchGoogleSheetData
};
