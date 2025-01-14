const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Make sure to require your User model
const AppError = require('../utils/appError');
require('dotenv').config();

// Auth Middleware
const authMiddleware = (...requiredRoles) => {
  return async (req, res, next) => {
    try {
      const authorization = req.headers['authorization'];
      const token = authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ status: 'unauthorized', message: 'No token provided' });
      }

      // Verify the token
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded);
        });
      });

      // Fetch user from the database
      const userId = decoded.userId;
      req.user = await User.findById(userId);

      if (!req.user) {
        throw new AppError('User not found', 400);
      }

      // Check if user has one of the required roles
      if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
        return next(new AppError('You are not permitted!', 403));
      }

      // Proceed to the next middleware or route
      next();
    } catch (err) {
      console.error(err); // Log the error for debugging
      return next(new AppError('Unauthorized', 401));
    }
  };
};

module.exports = { authMiddleware };
