// models/Product.js - Product model
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['vegetables', 'fruits', 'grains', 'dairy', 'livestock', 'other'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  unit: {
    type: String,
    required: [true, 'Please specify the unit'],
    enum: ['kg', 'g', 'lb', 'ton', 'piece', 'dozen', 'liter', 'other'],
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Please add available quantity'],
  },
  harvestDate: {
    type: Date,
  },
  expiryDate: {
    type: Date,
  },
  images: {
    type: [String],
  },
  isOrganic: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', ProductSchema);