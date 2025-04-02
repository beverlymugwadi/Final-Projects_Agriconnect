// utils/logger.js - Logger Utility

const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../logs/app.log');

/**
 * Logs a message to a file
 * @param {string} level - Log level (info, error, warn)
 * @param {string} message - Log message
 */
const log = (level, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  console.log(logMessage); // Also log to console

  // Append log to file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
};

/**
 * Logs an info message
 * @param {string} message
 */
const info = (message) => log('info', message);

/**
 * Logs a warning message
 * @param {string} message
 */
const warn = (message) => log('warn', message);

/**
 * Logs an error message
 * @param {string} message
 */
const error = (message) => log('error', message);

module.exports = { info, warn, error };
