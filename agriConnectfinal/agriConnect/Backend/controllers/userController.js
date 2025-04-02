// controllers/userController.js - User controller
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Vendor = require('../models/Vendor');

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    let profile = null;
    if (user.userType === 'farmer') {
      profile = await Farmer.findOne({ user: user._id });
    } else if (user.userType === 'vendor') {
      profile = await Vendor.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/users/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    // Add userType to the fieldsToUpdate object
    const fieldsToUpdate = {
      name: req.body.name || req.user.name,
      email: req.body.email || req.user.email,
      phone: req.body.phone || req.user.phone,
    };
    
    // Include userType if it's in the request body
    if (req.body.userType) {
      fieldsToUpdate.userType = req.body.userType;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/users/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    // Send token response
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    next(error);
  }
};
