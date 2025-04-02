const asyncHandler = require('express-async-handler');
const notificationService = require('../services/notificationService');

/**
 * @desc    Get notifications for authenticated user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getUserNotifications = asyncHandler(async (req, res) => {
  const { limit, skip, includeRead } = req.query;
  
  const options = {
    limit: limit ? parseInt(limit) : 20,
    skip: skip ? parseInt(skip) : 0,
    includeRead: includeRead === 'true'
  };
  
  const notifications = await notificationService.getUserNotifications(
    req.user.id,
    options
  );
  
  res.status(200).json(notifications);
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  res.status(200).json({ count });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user.id
  );
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  res.status(200).json(notification);
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/mark-all-read
 * @access  Private
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  res.status(200).json({ message: 'All notifications marked as read', result });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.deleteNotification(
    req.params.id,
    req.user.id
  );
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  res.status(200).json({ message: 'Notification deleted' });
});

/**
 * @desc    Delete all notifications
 * @route   DELETE /api/notifications
 * @access  Private
 */
exports.deleteAllNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteAllNotifications(req.user.id);
  res.status(200).json({ message: 'All notifications deleted', result });
});
