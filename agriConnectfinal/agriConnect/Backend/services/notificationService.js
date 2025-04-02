// notificationService.js
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create and send a notification to a specific user
 * @param {Object} io - Socket.io instance
 * @param {String} userId - Recipient user ID
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
exports.sendNotification = async (io, userId, notificationData) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      recipient: userId,
      ...notificationData,
      timestamp: new Date(),
      read: false
    });

    // Emit to specific user's room
    io.to(`user_${userId}`).emit('notification', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      timestamp: notification.timestamp,
      data: notification.data,
      read: notification.read
    });

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Send a notification to multiple users
 * @param {Object} io - Socket.io instance
 * @param {Array} userIds - Array of recipient user IDs
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Array>} Array of created notifications
 */
exports.sendBulkNotifications = async (io, userIds, notificationData) => {
  try {
    const notifications = [];
    
    for (const userId of userIds) {
      const notification = await this.sendNotification(io, userId, notificationData);
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
};

/**
 * Send notification to all users of a specific type
 * @param {Object} io - Socket.io instance
 * @param {String} userType - Type of users to notify (farmer, vendor, admin)
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Array>} Array of created notifications
 */
exports.notifyUserType = async (io, userType, notificationData) => {
  try {
    // Find all users of the specified type
    const users = await User.find({ type: userType }).select('_id');
    const userIds = users.map(user => user._id.toString());
    
    return await this.sendBulkNotifications(io, userIds, notificationData);
  } catch (error) {
    console.error(`Error notifying ${userType}s:`, error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {String} notificationId - ID of the notification to mark as read
 * @param {String} userId - ID of the user who owns the notification
 * @returns {Promise<Object>} Updated notification
 */
exports.markAsRead = async (notificationId, userId) => {
  try {
    // Check if this is a message notification (has msg- prefix)
    if (notificationId.startsWith('msg-')) {
      console.log(`Skipping message notification ${notificationId} - not a regular notification`);
      return null;
    }
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );
    
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {String} userId - ID of the user
 * @returns {Promise<Object>} Result of the update operation
 */
exports.markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
    
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param {String} userId - ID of the user
 * @param {Object} options - Query options (limit, skip, etc.)
 * @returns {Promise<Array>} Array of notifications
 */
exports.getUserNotifications = async (userId, options = {}) => {
  try {
    const { limit = 20, skip = 0, includeRead = true } = options;
    
    const query = { recipient: userId };
    if (!includeRead) {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {String} notificationId - ID of the notification to delete
 * @param {String} userId - ID of the user who owns the notification
 * @returns {Promise<Object>} Deleted notification
 */
exports.deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });
    
    return notification;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete all notifications for a user
 * @param {String} userId - ID of the user
 * @returns {Promise<Object>} Result of the delete operation
 */
exports.deleteAllNotifications = async (userId) => {
  try {
    const result = await Notification.deleteMany({ recipient: userId });
    return result;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 * @param {String} userId - ID of the user
 * @returns {Promise<Number>} Count of unread notifications
 */
exports.getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      read: false
    });
    
    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};
