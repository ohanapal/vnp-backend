const mongoose = require('mongoose');

const portfolioSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'portfolio name must needed'],
  },
  audit_uploaded_file: {
    type: String, // Audit Uploaded File Path
  },
  contracts: {
    type: String, // Contract file path/URL
  },
});
const portfolioModel = mongoose.model('Portfolio', portfolioSchema);
module.exports = portfolioModel;
