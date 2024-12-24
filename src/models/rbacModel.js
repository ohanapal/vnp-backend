const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,  // Referencing the ObjectId of the User model
    ref: 'User',  // Refers to the 'User' model
    required: true,
  },
  role: {
    type: String,
    enum: ['writer', 'reader', 'admin'],  // You can define roles like writer, reader, admin
    required: true,
  }
});

const UserRole = mongoose.model('UserRole', userRoleSchema);

module.exports = UserRole;
