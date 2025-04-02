// models/Vendor.js - Vendor model
const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  businessName: {
    type: String,
    required: [true, 'Please add a business name'],
  },
  businessType: {
    type: String,
    required: [true, 'Please specify business type'],
    enum: ['Retailer', 'Wholesaler', 'Processor', 'Exporter', 'Other'], // Corrected enum values
  },
  businessLocation: {
    type: String,
    required: [true, 'Please add a business location'],
  },
  preferredProducts: {
    type: [String],
  },
  purchaseCapacity: {
    type: Number,  // Changed to Number for capacity (if it represents quantity or weight)
    required: true,
  },
  description: {
    type: String,
  },
  licenseNumber: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  rating: {
    type: Number,
    min: 1,  // Minimum value of 1
    max: 5,  // Maximum value of 5
    default: 1,  // Default value set to 1
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Vendor', VendorSchema);
