// service/roleService.js

const UserRole = require('../models/userRoleModel');
const User = require('../models/userModel');

// Assign role to a user
const assignRoleToUser = async (userId, role) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user already has a role
  const existingRole = await UserRole.findOne({ user: userId });
  if (existingRole) {
    throw new Error('User already has a role');
  }

  const userRole = new UserRole({ user: userId, role });
  return await userRole.save();
};

// Get all users with roles
const getAllUsersWithRoles = async () => {
  return await UserRole.find().populate('user');  // Populate the user details
};

// Get a specific user's role
const getUserRole = async (userId) => {
  const userRole = await UserRole.findOne({ user: userId }).populate('user');
  if (!userRole) {
    throw new Error('Role for this user not found');
  }
  return userRole;
};

// Update a user's role
const updateUserRole = async (userId, newRole) => {
  const userRole = await UserRole.findOne({ user: userId });
  if (!userRole) {
    throw new Error('Role for this user not found');
  }
  userRole.role = newRole;
  return await userRole.save();
};

// Remove a user's role
const removeUserRole = async (userId) => {
  const userRole = await UserRole.findOneAndDelete({ user: userId });
  if (!userRole) {
    throw new Error('Role for this user not found');
  }
  return userRole;
};

// Export functions
module.exports = {
  assignRoleToUser,
  getAllUsersWithRoles,
  getUserRole,
  updateUserRole,
  removeUserRole,
};
