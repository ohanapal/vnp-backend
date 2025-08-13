// controllers/userController.js

const userService = require('../services/userService');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
exports.registerAdmin = async (req, res) => {
  try {
    const user = await userService.createAdmin(req.body);
    // console.log("user")
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.loginUser = async (req, res, next) => {
  try {
    logger.info('Login request received', { email: req.body.email });

    const result = await userService.loginUser(req.body);
    // console.log("result", result)
    // If 2FA is required, return the partial login response
    if (result.requiresOTP) {
      return res.status(200).json({
        message: result.message,
        requiresOTP: true,
        userId: result.userId,
      });
    }

    // Normal login success response
    logger.info('Login successful', { userId: result.user._id, email: req.body.email });

    res.status(200).json({
      message: 'Login successful',
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    logger.error('Login failed', { email: req.body.email, error: error.message });
    next(error);
  }
};

exports.inviteUser = async (req, res) => {
  // console.log('req body from ivite User', req.body);
  const { id, role } = req.user;
  // console.log("id and role", id, role)
  // return;
  try {
    const user = await userService.inviteUser(req.body, id, role);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyUserInvitation = async (req, res) => {
  try {
    const user = await userService.verifyUserInvitation(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const user = await userService.resetPassword(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.sendForgetPasswordOTP = async (req, res) => {
  try {
    const user = await userService.sendForgetPasswordOTP(req.body);
    logger.info(`OTP successfully sent to ${req.body.email}`);
    res.status(201).json(user);
  } catch (error) {
    // Log the error
    logger.error(`Failed to send OTP to ${req.body.email}: ${error.message}`);

    // Send a structured error response
    const err = new AppError(error.message || 'An error occurred while sending OTP', 400);
    res.status(err.statusCode).json({ error: err.message });
  }
};

// exports.getAllUsers = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const searchQuery = req.query.search || ''; // Extract search query from request
//     const currentUserId = req.user.id; // Assuming req.user contains the logged-in user's details
//     const role = req.user.role;
//     const result = await userService.getAllUsers(page, limit, currentUserId, role, searchQuery);
//     res.status(200).json(result);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || ''; // Extract search query
    const portfolio = req.query.portfolio || null; // Individual filters
    const subPortfolio = req.query.sub_portfolio || null;
    const property = req.query.property || null;
    const roleFilter = req.query.role || null; // Role filter for admin users only

    const currentUserId = req.user.id; // Assuming req.user contains logged-in user's details
    const role = req.user.role;
    const { connected_entity_id: connectedEntityIds } = req.user;

    const result = await userService.getAllUsers(
      page,
      limit,
      currentUserId,
      role,
      searchQuery,
      portfolio,
      subPortfolio,
      property,
      roleFilter,
      connectedEntityIds,
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { role } = req.user;
  try {
    if (role !== 'admin') {
      throw new AppError('You are not authorized to update this data');
    }
    const user = await userService.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { role } = req.user;
  try {
    if (role !== 'admin') {
      throw new AppError('You are not authorized to update this data');
    }
    const user = await userService.deleteUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateOwnProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming the user's ID is stored in req.user by an authentication middleware
    const updatedData = req.body; // Profile data to be updated
    // Call the service to update the profile
    const updatedUser = await userService.updateOwnProfile(userId, updatedData);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllPortfoliosSubPortfoliosProperties = async (req, res) => {
  const { role, connected_entity_id: connectedEntityIds } = req.user;
  try {
    const { search, setRole } = req.query;
    const allPortfolios = await userService.getAllPortfoliosSubPortfoliosPropertiesName(
      role,
      connectedEntityIds,
      search,
      setRole,
    );
    return res.status(200).json(allPortfolios);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP for 2FA
exports.verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      throw new AppError('User ID and OTP are required', 400);
    }

    const result = await userService.verifyOTP(userId, otp);

    res.status(200).json({
      message: 'OTP verified successfully',
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    logger.error('OTP verification failed', { error: error.message });
    next(error);
  }
};

// Update 2FA settings
exports.updateTwoFactorAuth = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await userService.updateTwoFactorAuth(userId, req.body);

    res.status(200).json({
      message: '2FA settings updated successfully',
      user: result,
    });
  } catch (error) {
    logger.error('Failed to update 2FA settings', { error: error.message });
    next(error);
  }
};

// get me api
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await userService.getMe(userId, page, limit);
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to fetch user details', { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};
