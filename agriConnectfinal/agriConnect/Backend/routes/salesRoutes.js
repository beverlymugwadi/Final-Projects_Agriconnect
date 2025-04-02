// routes/salesRoutes.js
const express = require('express');
const { getSalesSummary } = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/salesRoutes', protect, authorize('farmer'), getSalesSummary);

module.exports = router;