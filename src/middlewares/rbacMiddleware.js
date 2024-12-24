// Permission Middleware
const roles = require('../config/roles');

const checkPermission = (action) => {
  return (req, res, next) => {
    const userRole = req.user.role; // Assuming `req.user` is populated by `authMiddleware`
    const permissions = roles[userRole];
    
    if (!permissions || !permissions.includes(action)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Proceed to the next middleware or route
    next();
  };
};

module.exports = { checkPermission };