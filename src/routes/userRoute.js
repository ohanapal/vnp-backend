// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  deleteUser,
  createUser,
  registerAdmin,
  loginUser,
  inviteUser,
  verifyUserInvitation,
  resetPassword,
} = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/rbacMiddleware');

// Route for creating a new user and getting all users
router.route('/admin-register').post(registerAdmin);
router.route('/login').post(loginUser);
router.route('/invite-user').post(authMiddleware('admin'), inviteUser);
router.route('/verify-user').post(verifyUserInvitation);
router.route('/reset-password').post(resetPassword);
router.route('/').get(authMiddleware('admin', 'portfolio','sub-portfolio', 'property'), getAllUsers);

// Route for getting, updating, and deleting a user by ID
router
  .route('/:id')
  .put(
    authMiddleware('admin'), // Example: Only admins and managers can update users
    updateUser,
  )
  .delete(
    authMiddleware('admin'), // Example: Only admins can delete users
    deleteUser,
  );

module.exports = router;
