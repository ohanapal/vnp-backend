// controllers/roleController.js

const roleService = require('../services/rbacService');

// Assign a role to a user
const assignRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const assignedRole = await roleService.assignRoleToUser(userId, role);
    res.status(201).json({ status: 'success', data: assignedRole });
  } catch (error) {
    next(error);  // Pass error to error-handling middleware
  }
};

// Get all users with roles
const getAllUsersWithRoles = async (req, res, next) => {
  try {
    const usersWithRoles = await roleService.getAllUsersWithRoles();
    res.status(200).json({ status: 'success', data: usersWithRoles });
  } catch (error) {
    next(error);
  }
};

// Get a specific user's role
const getUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const userRole = await roleService.getUserRole(userId);
    res.status(200).json({ status: 'success', data: userRole });
  } catch (error) {
    next(error);
  }
};

// Update a user's role
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const updatedRole = await roleService.updateUserRole(userId, role);
    res.status(200).json({ status: 'success', data: updatedRole });
  } catch (error) {
    next(error);
  }
};

// Remove a user's role
const deleteUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await roleService.removeUserRole(userId);
    res.status(204).json({ status: 'success', message: 'Role removed' });
  } catch (error) {
    next(error);
  }
};

// Export the controller functions
module.exports = {
  assignRole,
  getAllUsersWithRoles,
  getUserRole,
  updateUserRole,
  deleteUserRole,
};
