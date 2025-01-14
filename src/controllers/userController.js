// controllers/userController.js

const userService = require('../services/userService');
const AppError = require('../utils/appError');

exports.registerAdmin = async (req, res) => {
  try {
    const user = await userService.createAdmin(req.body);
    // console.log("user")
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.loginUser = async (req, res) => {
  try {
    // Call the service to log the user in
    const user = await userService.loginUser(req.body);

    // Send back the user and access token
    res.status(200).json({
      message: 'Login successful',
      user: user.user,
      accessToken: user.accessToken,
    });
  } catch (error) {
    // Handle any errors
    res.status(400).json({ error: error.message });
  }
};

exports.inviteUser = async (req, res) => {
  console.log('req body from ivite User', req.body);
  try {
    const user = await userService.inviteUser(req.body);
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

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || ''; // Extract search query from request
    const currentUserId = req.user.id; // Assuming req.user contains the logged-in user's details

    const result = await userService.getAllUsers(page, limit, currentUserId, searchQuery);
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
