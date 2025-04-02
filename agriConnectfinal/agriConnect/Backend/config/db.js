// config/db.js - Database connection
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connecting to MongoDB without deprecated options
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit the process in case of error
  }
};

module.exports = connectDB;
