// services/userService.js

const User = require('../models/userModel');
const jwt = require("jsonwebtoken")

exports.createUser = async (userData) => {
  const user = new User(userData);
  await user.save()
  const accessToken = jwt.sign(
    {
      userId: user?._id,
      role: user?.role,
      email: user?.email,
    },
    process.env.SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
  return {user, accessToken};
};

exports.getUserById = async (userId) => {
  return await User.findById(userId);
};

exports.getAllUsers = async () => {
  return await User.find();
};

exports.updateUser = async (userId, updateData) => {
  return await User.findByIdAndUpdate(userId, updateData, { new: true });
};

exports.deleteUser = async (userId) => {
  return await User.findByIdAndDelete(userId);
};
