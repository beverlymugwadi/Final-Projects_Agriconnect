// controllers/vendorController.js - Vendor controller
const Vendor = require('../models/Vendor');
const User = require('../models/User');

// @desc    Create vendor profile
// @route   POST /api/vendors
// @access  Private (vendors only)
exports.createVendorProfile = async (req, res, next) => {
  try {
    // Check if vendor profile already exists
    const existingProfile = await Vendor.findOne({ user: req.user.id });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile already exists for this user',
      });
    }

    // Create vendor profile
    const vendorProfile = await Vendor.create({
      user: req.user.id,
      businessName: req.body.businessName,
      businessType: req.body.businessType,
      businessLocation: req.body.businessLocation,
      preferredProducts: req.body.preferredProducts,
      purchaseCapacity: req.body.purchaseCapacity,
      description: req.body.description,
      licenseNumber: req.body.licenseNumber,
      profileImage: req.body.profileImage,
    });

    res.status(201).json({
      success: true,
      data: vendorProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor profile
// @route   GET /api/vendors/me
// @access  Private (vendors only)
exports.getVendorProfile = async (req, res, next) => {
  try {
    const profile = await Vendor.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor profile
// @route   PUT /api/vendors/me
// @access  Private (vendors only)
exports.updateVendorProfile = async (req, res, next) => {
  try {
    const profile = await Vendor.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Public
exports.getAllVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find().populate({
      path: 'user',
      select: 'name email phone',
    });

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vendor by ID
// @route   GET /api/vendors/:id
// @access  Public
exports.getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate({
      path: 'user',
      select: 'name email phone',
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    next(error);
  }
};
