// services/userService.js

const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const TempPassword = require('../models/tempPasswordModel');
const SendEmailUtils = require('../utils/SendEmailUtils');
const generator = require('generate-password');
const { generateLink } = require('../utils/invitationLink');
const AppError = require('../utils/appError');
const Portfolio = require('../models/portfolioModel'); // Replace with actual path
const Property = require('../models/propertyModel'); // Replace with actual path
const SubPortfolio = require('../models/subPortfolioModel');
const { ObjectId } = require('mongodb');
const logger = require('../utils/logger'); // Import the logger

exports.createAdmin = async (userData) => {
  const { password, ...otherData } = userData; // Destructure password from other user data

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

  // Create a new user with the hashed password
  const user = new User({
    ...otherData, // Add all other user fields
    password: hashedPassword, // Set the hashed password
  });

  // Save the user
  await user.save();

  // Generate JWT token after saving the user
  const accessToken = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  return { user, accessToken };
};

exports.loginUser = async (userData) => {
  const { email, password } = userData;

  // Log the start of the login process
  logger.debug('Searching for user in database', { email });

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    logger.warn('User not found', { email });
    throw new AppError('User not found', 404);
  }

  if (!user.is_verified) {
    logger.warn('User not verified', { email });
    throw new AppError('User not verified', 403);
  }

  // Log password validation process
  logger.debug('Validating user password', { email });

  // Compare the password with the hashed password stored in the database
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    logger.warn('Invalid password', { email });
    throw new AppError('Invalid password', 401);
  }

  // Remove the password from the user object before returning it
  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

  // Log the JWT generation
  logger.debug('Generating JWT token', { email, userId: user._id });

  // Generate JWT token if password is correct
  const accessToken = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  logger.info('Token generated successfully', { email, userId: user._id });

  return { user: userWithoutPassword, accessToken };
};

//invitation validation
const getAllowedRolesForInviter = (currentUserRole) => {
  switch (currentUserRole) {
    case 'admin':
      return ['portfolio', 'sub-portfolio', 'property']; // Admin can invite all roles
    case 'portfolio':
      return ['sub-portfolio', 'property']; // Portfolio can invite sub portfolio and property
    case 'sub-portfolio':
      return ['property']; // Sub portfolio can only invite property
    case 'property':
      return []; // Property cannot invite anyone
    default:
      return []; // Unknown role, no one can be invited
  }
};
exports.inviteUser = async (userData, id, currentUserRole) => {
  const { name, email, role, connected_entity_id } = userData;

  const allowedRoles = getAllowedRolesForInviter(currentUserRole);
  if (!allowedRoles.includes(role)) {
    throw new AppError('You are not authorized to invite this role');
  }
  // Check if the user already exists based on the email
  const existingUser = await User.findOne({ email: email });

  if (existingUser) {
    throw new AppError('User with this email already exists');
  }

  // Generate a temporary password (OTP)
  const tempPassword = generator.generate({
    length: 10,
    numbers: true,
  });

  await TempPassword.create({
    email: email,
    password: tempPassword,
  });
  // Create a new user
  const user = new User({
    role,
    name: name,
    password: tempPassword,
    email,
    invited_user: id,
    connected_entity_id,
  });

  // Save the user
  await user.save();

  // Insert the temporary password into the TempPassword collection

  const confirmationToken = generateLink(email);
  console.log('Confirmation link: ' + confirmationToken);
  // Send the temporary password via email
  const emailMessage = `Your Temporary Password is: ${tempPassword}. Click here to confirm your invitation: ${confirmationToken}`;
  const emailSubject = 'VNP';
  const emailSend = await SendEmailUtils(email, emailMessage, emailSubject);
  console.log(emailSend);

  // Log the generated temporary password (OTP)
  console.log(`Your Verification Pin Code is: ${tempPassword}`);

  return user;
};
exports.verifyUserInvitation = async (userData) => {
  const { email, password } = userData; // Assuming userData contains email and otp

  // Find the user
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('User not found');
  }

  // Check if OTP exists and is not expired
  const passwordStatus = 0; // Status 0 indicates the OTP is not yet verified
  const otpRecord = await TempPassword.findOne({
    email,
    password: password,
    status: passwordStatus,
  });

  if (!otpRecord) {
    throw new AppError('Invalid OTP');
  }

  // Update OTP status to indicate verification (set status to 1 for verified)
  await TempPassword.updateOne(
    { email, password: password, status: passwordStatus },
    { $set: { status: 1 } }, // Update status to 1 (verified)
  );

  // Set user as verified
  user.is_verified = true;

  // Save the changes to the user document
  await user.save();

  return { user };
};

exports.resetPassword = async (userData) => {
  const { email, password } = userData;

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('User not found');
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update the password in the user document
  user.password = hashedPassword;

  // Save the changes to the user document
  await user.save();

  return { user };
};

exports.sendForgetPasswordOTP = async (userData) => {
  const { email } = userData;

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    // Log the error
    logger.error(`User with email ${email} not found`);
    throw new AppError('User not found', 404); // Throw a custom error with a 404 status code
  }

  // Generate a temporary password (OTP)
  const tempPassword = generator.generate({
    length: 10,
    numbers: true,
  });

  // Update the password in the user document
  user.password = tempPassword;

  // Save the changes to the user document
  await user.save();

  // Insert the temporary password into the TempPassword collection
  await TempPassword.create({
    email: email,
    password: tempPassword,
    status: 0, // Set status to 0 (not yet verified)
  });

  // Send the temporary password via email
  const emailMessage = `Your Temporary Password is: ${tempPassword}`;
  const emailSubject = 'VNP';
  const emailSend = await SendEmailUtils(email, emailMessage, emailSubject);

  // Log the successful email send
  // logger.info(`Temporary password sent to ${email}`);

  // Return the result of the email send (or you could return the OTP status)
  return {
    message: "Check Your Email for Verification Account OTP",
    data: user
  };
};

exports.getAllUsers = async (page = 1, limit = 10, currentUserId, role, searchQuery = '') => {
  const skip = (page - 1) * limit;

  // Build the base query
  const query = {
    role: { $ne: 'admin' },
    _id: { $ne: currentUserId }, // Exclude the current user
  };

  if (role !== 'admin') {
    query.invited_user = new ObjectId(currentUserId); // Filter users who were invited by the current user
  }

  // If a search query exists, add $or conditions
  if (searchQuery) {
    query.$or = [
      { name: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search by name
      { email: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search by email
      { phone: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search by phone number
      { connected_entity_id: { $regex: searchQuery, $options: 'i' } }, // Search within connected_entity_id
    ];
  }

  const [users, total] = await Promise.all([User.find(query).skip(skip).limit(limit).lean(), User.countDocuments(query)]);

  // Transform users to replace `connected_entity_id` with names
  const transformedUsers = await Promise.all(
    users.map(async (user) => {
      if (user.role === 'portfolio') {
        user.connected_entity_id = await Portfolio.find({
          _id: { $in: user.connected_entity_id },
        }).select('name -_id');
      } else if (user.role === 'property') {
        user.connected_entity_id = await Property.find({
          _id: { $in: user.connected_entity_id },
        }).select('name -_id');
      } else if (user.role === 'sub-portfolio') {
        user.connected_entity_id = await SubPortfolio.find({
          _id: { $in: user.connected_entity_id },
        }).select('name -_id');
      }
      // Convert connected_entity_id array of objects to an array of names
      user.connected_entity_id = user.connected_entity_id.map((entity) => entity.name);

      // Remove password field from the user object
      delete user.password;

      return user;
    }),
  );

  return {
    users: transformedUsers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// Update User
exports.updateUser = async (userId, updateData) => {
  // Update the user in the database
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

  // If user exists, remove the password field before returning
  if (updatedUser) {
    delete updatedUser.password;
  }

  return updatedUser;
};

// Delete User
exports.deleteUser = async (userId) => {
  // Find and delete the user by ID
  const deletedUser = await User.findByIdAndDelete(userId);

  // If user exists, remove the password field before returning (though it's deleted, we exclude it just in case)
  if (deletedUser) {
    delete deletedUser.password;
  }

  return deletedUser;
};

exports.updateOwnProfile = async (userId, updatedData) => {
  // Fetch the user by ID
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Merge the updates while excluding sensitive fields
  const sensitiveFields = ['password', 'role', '_id', 'createdAt', 'updatedAt', '__v'];
  Object.keys(updatedData).forEach((key) => {
    if (!sensitiveFields.includes(key)) {
      user[key] = updatedData[key];
    }
  });

  // Save the updated user document
  await user.save();

  // Exclude the password field from the response
  const userResponse = user.toObject(); // Convert user document to a plain object
  delete userResponse.password; // Delete the password field

  return userResponse;
};
