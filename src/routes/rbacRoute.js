const express = require('express');
const roleController = require('../controllers/rbacController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all role-related routes with `authMiddleware` and allow only 'admin' role

// Assign role to a user (admin only)
router.post('/assign-role', authMiddleware('admin'), roleController.assignRole);

// Get all users with roles (admin only)
router.get('/users-with-roles', authMiddleware('admin'), roleController.getAllUsersWithRoles);

// Get a specific user's role (admin only)
router.get('/user-role/:userId', authMiddleware('admin'), roleController.getUserRole);

// Update a user's role (admin only)
router.put('/update-role/:userId', authMiddleware('admin'), roleController.updateUserRole);

// Remove a user's role (admin only)
router.delete('/delete-role/:userId', authMiddleware('admin'), roleController.deleteUserRole);

module.exports = router;
