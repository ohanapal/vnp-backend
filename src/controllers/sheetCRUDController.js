const { addRow, getData, deleteData, updateCell } = require('../services/sheetCRUDService');
const { google } = require('googleapis');
const path = require('path');

const auth = require('../config/auth'); // Assuming you have an auth configuration

//app.post('/sheets/add-row',
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
      details: error.message 
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
      Object.entries(searchParams).map(([key, value]) => [key, decodeURIComponent(value)])
    );

    const data = await getData(client, spreadsheetId, sheetName, parsedSearchParams);
    res.status(200).json({ 
      message: 'Data retrieved successfully',
      count: data.length,
      data 
    });
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ 
      error: 'Error getting data', 
      details: error.message 
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
          spreadsheetId: "your-sheet-id",
          sheetName: "Sheet1",
          rowNumber: 2,
          columnName: ["Units Sold", "Manufacturing Price"],
          newValue: ["$20000", "$2000000"]
        }
      });
    }

    // Check if columnName and newValue arrays have same length
    if (columnName.length !== newValue.length) {
      return res.status(400).json({
        error: 'Array length mismatch',
        message: 'columnName and newValue arrays must have the same length'
      });
    }

    const client = await auth.getClient();
    const updateResults = await updateCell(
      client, 
      spreadsheetId, 
      sheetName, 
      rowNumber, 
      columnName, 
      newValue
    );

    res.status(200).json({ 
      message: `Successfully updated ${updateResults.length} cells`,
      rowNumber: rowNumber,
      updates: updateResults
    });
  } catch (error) {
    console.error('Error updating cells:', error);
    res.status(500).json({ 
      error: 'Error updating cells', 
      details: error.message 
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
      rowNumber 
    });
  } catch (error) {
    console.error('Error deleting row:', error);
    res.status(500).json({ 
      error: 'Error deleting row', 
      details: error.message 
    });
  }
};