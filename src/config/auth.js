const { google } = require('googleapis');
const path = require('path');

// Define the path to the service account key file
const KEYFILEPATH = path.join(__dirname, '..', 'services', 'keys', 'sa.json');

// Define the scopes required for Google Sheets
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets'
];

// Authentication module for Google APIs
const auth = {
  /**
   * Get an authorized Google client
   * @returns {Promise<google.auth.GoogleAuth>} Authorized Google client
   */
  getClient: async () => {
    try {
      // Create a new GoogleAuth instance
      const client = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
      });

      // Return the authorized client
      return client;
    } catch (error) {
      console.error('Error creating Google Auth client:', error);
      throw error;
    }
  }
};

module.exports = auth;
