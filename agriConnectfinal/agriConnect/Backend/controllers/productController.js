// controllers/productController.js - Product controller
const Product = require('../models/Product');
const Farmer = require('../models/Farmer');

// @desc    Create a product
// @route   POST /api/products
// @access  Private (farmers only)
exports.createProduct = async (req, res, next) => {
  try {
    // Log request body to see what data is being received
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    // Get farmer profile ID for the current user
    const farmer = await Farmer.findOne({ user: req.user.id });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer profile not found',
      });
    }

    // Add farmer ID to request body
    req.body.farmer = farmer._id;

    // Process boolean values that might come as strings
    if (req.body.isOrganic === 'true') req.body.isOrganic = true;
    if (req.body.isOrganic === 'false') req.body.isOrganic = false;
    if (req.body.isFeatured === 'true') req.body.isFeatured = true;
    if (req.body.isFeatured === 'false') req.body.isFeatured = false;

    // Handle image paths if multer middleware processed files
    if (req.files && req.files.images) {
      req.body.images = req.files.images.map(file => file.path);
    }

    // Create product
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Product creation error:', error);
    
    // Provide more detailed error message for validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    next(error);
  }
};

// @desc    Get current farmer's products
// @route   GET /api/products/my-products
// @access  Private (farmers only)
exports.getMyProducts = async (req, res, next) => {
  try {
    // Find the farmer using the logged-in user's ID
    const farmer = await Farmer.findOne({ user: req.user.id });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer profile not found',
      });
    }

    // Get products belonging to this farmer
    const products = await Product.find({ farmer: farmer._id });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    let query = Product.find(JSON.parse(queryStr)).populate({
      path: 'farmer',
      select: 'farmName farmLocation rating',
      populate: { path: 'user', select: 'name' },
    });

    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const total = await Product.countDocuments();

    query = query.skip(startIndex).limit(limit);
    
    const products = await query;
    res.status(200).json({
      success: true,
      count: products.length,
      pagination: { total, page, limit },
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('farmer', 'farmName farmLocation rating');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (farmers only)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (farmers only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.remove();
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};