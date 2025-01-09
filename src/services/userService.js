// services/userService.js

const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const TempPassword = require('../models/tempPasswordModel');
const SendEmailUtils = require('../utils/SendEmailUtils');
const generator = require('generate-password');
const { generateLink } = require('../utils/invitationLink');
const AppError = require('../utils/appError');

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

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('User not found');
  }
  if(!user.is_verified){
    throw new Error('User not verified');
  }

  // Compare the password with the hashed password stored in the database
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  // Remove the password from the user object before returning it
  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

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

  return { user: userWithoutPassword, accessToken };
};
exports.inviteUser = async (userData) => {
  const { email, role, access, connected_entity_id } = userData;

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
    name: "temp",
    password: tempPassword,
    email,
    access,
    connected_entity_id,
  });

  // Save the user
  await user.save();

  // Insert the temporary password into the TempPassword collection
  

  const confirmationToken = generateLink(email);
  console.log("Confirmation link: " + confirmationToken);
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

exports.resetPassword = async (userData)=>{
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
}
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
