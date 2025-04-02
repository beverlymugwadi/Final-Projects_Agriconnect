// middlewares/auth.js - Authentication middleware
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const User = require('../models/User');

// Protect routes - verify token and attach user to request
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Ensure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach user to request
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found, authorization denied',
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Authorization middleware - check if user has required role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to access this resource',
      });
    }
    
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.userType}' is not authorized to access this resource. Required roles: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

// Add a middleware to check if user is a farmer
exports.isFarmer = (req, res, next) => {
  if (req.user && req.user.userType === 'farmer') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only farmers can access this resource',
    });
  }
};

// Add a middleware to check if user is a vendor
exports.isVendor = (req, res, next) => {
  if (req.user && req.user.userType === 'vendor') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only vendors can access this resource',
    });
  }
};