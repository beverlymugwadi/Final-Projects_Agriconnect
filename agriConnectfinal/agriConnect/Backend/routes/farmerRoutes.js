const express = require('express');
const {
  createFarmerProfile,
  getFarmerProfile,
  updateFarmerProfile,
  getAllFarmers,
  getFarmerById,
} = require('../controllers/farmerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes for farmers
// Allow any authenticated user to create a farmer profile
// This lets a user who just signed up create their profile
router.post('/', protect, createFarmerProfile);

// These routes should only be accessible to established farmers
router.get('/me', protect, authorize('farmer'), getFarmerProfile);
router.put('/me', protect, authorize('farmer'), updateFarmerProfile);

// Public routes
router.get('/', getAllFarmers);
router.get('/:id', getFarmerById);

module.exports = router;