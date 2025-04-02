// routes/userRoutes.js - User routes
const express = require('express');
const { getMe, updateDetails, updatePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get current logged-in user
router.get('/me', protect, getMe);

// Update user details
router.put('/updatedetails', protect, updateDetails);

// Update password
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
