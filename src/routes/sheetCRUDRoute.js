const express = require('express');
const router = express.Router();

const { 
  createRow, 
  getData, 
  updateCell, 
  deleteData, 
  bulkUpload,
  notifyChange,
  deleteRow,
  updateDatabase
} = require('../controllers/sheetCRUDController');

// Route to add a new row to a Google Sheet
router.post('/bulk-upload', bulkUpload);
router.post('/notify-change', notifyChange);
router.post('/delete-row', deleteRow)
router.post('/add-row', createRow);

// Route to get data from a Google Sheet with optional filtering
router.get('/get-data', getData);

// Route to update cell(s) in a Google Sheet
router.put('/update-cell', updateCell);

// Route to delete a specific row from a Google Sheet
router.delete('/delete-data', deleteData);

router.post('/update-database', updateDatabase);

module.exports = router;