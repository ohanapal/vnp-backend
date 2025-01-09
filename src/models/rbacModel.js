const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
