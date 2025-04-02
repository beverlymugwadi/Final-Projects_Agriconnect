// models/Farmer.js - Farmer model
const mongoose = require('mongoose');

const FarmerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  farmName: {
    type: String,
    required: [true, 'Please add a farm name'],
  },
  farmLocation: {
    type: String,
    required: [true, 'Please add a farm location'],
  },
  farmSize: {
    type: Number,
    required: [true, 'Please add farm size in acres'],
  },
  cropTypes: {
    type: [String],
    required: [true, 'Please add crop types'],
  },
  description: {
    type: String,
  },
  certifications: {
    type: [String],
  },
  profileImage: {
    type: String,
  },
  farmImages: {
    type: [String],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
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

module.exports = mongoose.model('Farmer', FarmerSchema);
