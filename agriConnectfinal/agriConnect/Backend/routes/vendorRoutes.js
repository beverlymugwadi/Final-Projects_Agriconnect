const express = require('express');
const {
  createVendorProfile,
  getVendorProfile,
  updateVendorProfile,
  getAllVendors,
  getVendorById,
} = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Allow any authenticated user to create a vendor profile
router.post('/', protect, createVendorProfile);

// These routes should only be accessible to established vendors
router.get('/me', protect, authorize('vendor'), getVendorProfile);
router.put('/me', protect, authorize('vendor'), updateVendorProfile);

// Public routes
router.get('/', getAllVendors);
router.get('/:id', getVendorById);

module.exports = router;