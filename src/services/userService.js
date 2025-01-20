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
    message: 'Check Your Email for Verification Account OTP',
    data: user,
  };
};

exports.getAllUsers = async (
  page = 1,
  limit = 10,
  currentUserId,
  role,
  searchQuery = '',
  portfolio,
  subPortfolio,
  property,
) => {
  const skip = (page - 1) * limit;
  let query = {};

  // console.log('Initial query object:', query);

  if (role !== 'admin') {
    query.$or = [{ invited_user: new ObjectId(currentUserId) }, { _id: new ObjectId(currentUserId) }];
    // console.log('Query after role check:', query);
  }

  // If there's a search query, apply the search to the collections and user fields
  if (searchQuery) {
    if (role === 'admin') {
      // Admins can search across all data
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { phone: { $regex: searchQuery, $options: 'i' } },
        { role: { $regex: searchQuery, $options: 'i' } },
      ];

      // Search in Portfolio, Property, and SubPortfolio collections
      const [portfolioMatches, propertyMatches, subPortfolioMatches] = await Promise.all([
        Portfolio.find({ name: { $regex: searchQuery, $options: 'i' } }).select('_id'),
        Property.find({ name: { $regex: searchQuery, $options: 'i' } }).select('_id'),
        SubPortfolio.find({ name: { $regex: searchQuery, $options: 'i' } }).select('_id'),
      ]);

      // Collect all matching IDs from entities
      const matchedEntityIds = [
        ...portfolioMatches.map((p) => p._id.toString()),
        ...propertyMatches.map((p) => p._id.toString()),
        ...subPortfolioMatches.map((p) => p._id.toString()),
      ];

      // Find users whose connected_entity_id matches the entity IDs found above
      const userIdsFromEntities = await User.find({
        connected_entity_id: { $in: matchedEntityIds },
      }).select('_id');

      // Add the user IDs of matching connected entities to the search query
      query.$or.push({ _id: { $in: userIdsFromEntities.map((user) => user._id) } });
    } else {
      // Non-admin users: Search only in their own data (connected entities and user-specific fields)
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { phone: { $regex: searchQuery, $options: 'i' } },
        { role: { $regex: searchQuery, $options: 'i' } },
        { _id: new ObjectId(currentUserId) }, // Search only for the current user's ID
      ];

      // Optional: You can add additional filters here if needed, e.g., for specific portfolio, subPortfolio, or property
      if (portfolio) {
        query['connected_entity_id.portfolio'] = { $in: [portfolio] };
      }
      if (subPortfolio) {
        query['connected_entity_id.subPortfolio'] = { $in: [subPortfolio] };
      }
      if (property) {
        query['connected_entity_id.property'] = { $in: [property] };
      }
    }
  }

  // Construct filter conditions for the "connected_entity_id" array.
  let connectedEntityConditions = [];
  if (portfolio) {
    connectedEntityConditions.push(portfolio);
    // console.log('Added portfolio to connectedEntityConditions:', connectedEntityConditions);
  }
  if (subPortfolio) {
    connectedEntityConditions.push(subPortfolio);
    // console.log('Added subPortfolio to connectedEntityConditions:', connectedEntityConditions);
  }
  if (property) {
    connectedEntityConditions.push(property);
    // console.log('Added property to connectedEntityConditions:', connectedEntityConditions);
  }

  // If there are any filters, use $in to check if any of the values are in connected_entity_id.
  if (connectedEntityConditions.length > 0) {
    query['connected_entity_id'] = { $in: connectedEntityConditions };
    // console.log('Query after adding connected_entity_id filter:', query);
  }

  // Fetch users and total count
  const [users, total] = await Promise.all([User.find(query).skip(skip).limit(limit).lean(), User.countDocuments(query)]);
  // console.log('Fetched users:', users);
  // console.log('Total users count:', total);

  const transformedUsers = await Promise.all(
    users.map(async (user) => {
      // console.log('Processing user:', user);

      // If connected_entity_id exists and contains values
      if (user.connected_entity_id && user.connected_entity_id.length > 0) {
        let entityNames = [];

        // Fetch entity names based on the user's role
        if (user.role === 'portfolio') {
          // console.log('Fetching Portfolio names for user:', user);
          entityNames = await Portfolio.find({ _id: { $in: user.connected_entity_id } }).select('name');
        } else if (user.role === 'property') {
          // console.log('Fetching Property names for user:', user);
          entityNames = await Property.find({ _id: { $in: user.connected_entity_id } }).select('name');
        } else if (user.role === 'sub-portfolio') {
          // console.log('Fetching SubPortfolio names for user:', user);
          entityNames = await SubPortfolio.find({ _id: { $in: user.connected_entity_id } }).select('name');
        }

        // console.log('Entity names for user:', entityNames);

        // Replace connected_entity_id with just the names
        user.connected_entity_id = entityNames.map((entity) => entity.name);
        // console.log('Updated connected_entity_id with names:', user.connected_entity_id);
      }

      // Remove the password field for security
      delete user.password;
      // console.log('User after removing password:', user);

      return user;
    }),
  );

  return {
    success: true,
    data: transformedUsers,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    },
  };
};

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
