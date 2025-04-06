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
  getAllPortfoliosSubPortfoliosProperties,
  sendForgetPasswordOTP,
  verifyOTP,
} = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Auth routes
router.route('/admin-register').post(registerAdmin);
router.route('/login').post(loginUser);
router.route('/verify-otp').post(verifyOTP);

// Other routes
router.route('/invite-user').post(authMiddleware('admin', 'sub-portfolio', 'portfolio', 'property'), inviteUser);
router.route('/verify-user').post(verifyUserInvitation);
router.route('/reset-password').post(resetPassword);
router.route('/forgot-password-otp').post(sendForgetPasswordOTP);

// User management routes
router.put('/own-profile', authMiddleware('admin', 'portfolio', 'sub-portfolio', 'property'), updateOwnProfile);

router.put('/update/:id', authMiddleware('admin'), updateUser);
router.delete('/delete/:id', authMiddleware('admin'), deleteUser);
router.get('', authMiddleware('admin', 'portfolio', 'sub-portfolio', 'property'), getAllUsers);
router.get(
  '/get-all',
  authMiddleware('admin', 'portfolio', 'sub-portfolio', 'property'),
  getAllPortfoliosSubPortfoliosProperties,
);

module.exports = router;
