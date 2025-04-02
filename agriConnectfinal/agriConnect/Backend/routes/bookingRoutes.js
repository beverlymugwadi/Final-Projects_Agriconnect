const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus, // Ensure this is imported
  deleteBooking,
} = require('../controllers/bookingController'); // Ensure this path is correct
const { protect, authorize } = require('../middleware/auth');

// Routes
router.route('/')
  .post(protect, authorize('vendor'), createBooking) // Only vendors can create bookings
  .get(protect, getBookings); // All authenticated users can view bookings

router.route('/:id')
  .get(protect, getBooking) // Any authenticated user can view a specific booking
  .put(protect, authorize('farmer', 'vendor'), updateBookingStatus) // Farmers & Vendors can update booking status
  .delete(protect, authorize('vendor'), deleteBooking); // Only vendors can delete bookings

module.exports = router;
