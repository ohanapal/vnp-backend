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
  updateOwnProfile,
} = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddleware');
// Route for creating a new user and getting all users
router.route('/admin-register').post(registerAdmin);
router.route('/login').post(loginUser);
router.route('/invite-user').post(authMiddleware('admin'), inviteUser);
router.route('/verify-user').post(verifyUserInvitation);
router.route('/reset-password').post(resetPassword);
// router.get(authMiddleware('admin', 'portfolio', 'sub-portfolio', 'property'), getAllUsers);
router.get('/', authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), getAllUsers);

router.put('/update/:id', authMiddleware('admin'), updateUser); //Only admins and managers can update users
router.delete('/delete/:id', authMiddleware('admin'), deleteUser); //Only admins and managers can update users

router.put('/own-profile', authMiddleware('admin', 'portfolio', 'sub-portfolio', 'property'), updateOwnProfile);

module.exports = router;
