// utils/helpers.js - General Helper Functions

/**
 * Capitalizes the first letter of a string
 * @param {string} str 
 * @returns {string}
 */
const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  
  /**
   * Formats a mongoose error object into a readable response
   * @param {Object} err - Mongoose error object
   * @returns {Object}
   */
  const formatMongooseError = (err) => {
    let errors = {};
    if (err.errors) {
      Object.keys(err.errors).forEach((key) => {
        errors[key] = err.errors[key].message;
      });
    }
    return errors;
  };
  
  /**
   * Generates a random string (e.g., for unique product IDs)
   * @param {number} length 
   * @returns {string}
   */
  const generateRandomString = (length = 10) => {
    return Math.random().toString(36).substr(2, length);
  };
  
  module.exports = { capitalize, formatMongooseError, generateRandomString };
  