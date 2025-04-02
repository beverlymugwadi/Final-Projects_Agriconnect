const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Get all notifications for the authenticated user
router.get('/', protect, notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', protect, notificationController.getUnreadCount);

// Mark a notification as read
router.put('/:id/read', protect, notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', protect, notificationController.markAllAsRead);

// Delete a notification
router.delete('/:id', protect, notificationController.deleteNotification);

// Delete all notifications
router.delete('/', protect, notificationController.deleteAllNotifications);

module.exports = router;
