// controllers/farmerController.js - Farmer controller
const Farmer = require('../models/Farmer');
const User = require('../models/User');

// @desc    Create farmer profile
// @route   POST /api/farmers
// @access  Private (farmers only)
exports.createFarmerProfile = async (req, res, next) => {
  try {
    // Check if farmer profile already exists
    const existingProfile = await Farmer.findOne({ user: req.user.id });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Farmer profile already exists for this user',
      });
    }

    // Create farmer profile
    const farmerProfile = await Farmer.create({
      user: req.user.id,
      farmName: req.body.farmName,
      farmLocation: req.body.farmLocation,
      farmSize: req.body.farmSize,
      cropTypes: req.body.cropTypes,
      description: req.body.description,
      certifications: req.body.certifications,
      profileImage: req.body.profileImage,
      farmImages: req.body.farmImages,
    });

    res.status(201).json({
      success: true,
      data: farmerProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get farmer profile
// @route   GET /api/farmers/me
// @access  Private (farmers only)
exports.getFarmerProfile = async (req, res, next) => {
  try {
    const profile = await Farmer.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Farmer profile not found',
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

// @desc    Update farmer profile
// @route   PUT /api/farmers/me
// @access  Private (farmers only)
exports.updateFarmerProfile = async (req, res, next) => {
  try {
    const profile = await Farmer.findOneAndUpdate(
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
        message: 'Farmer profile not found',
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

// @desc    Get all farmers
// @route   GET /api/farmers
// @access  Public
exports.getAllFarmers = async (req, res, next) => {
  try {
    const farmers = await Farmer.find().populate({
      path: 'user',
      select: 'name email phone',
    });

    res.status(200).json({
      success: true,
      count: farmers.length,
      data: farmers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single farmer by ID
// @route   GET /api/farmers/:id
// @access  Public
exports.getFarmerById = async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.params.id).populate({
      path: 'user',
      select: 'name email phone',
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: farmer,
    });
  } catch (error) {
    next(error);
  }
};
