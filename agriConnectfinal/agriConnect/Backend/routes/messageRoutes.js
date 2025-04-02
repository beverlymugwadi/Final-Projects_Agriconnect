const express = require('express');
const router = express.Router();
const { 
  sendMessage, 
  getMessages, 
  getConversations,
  getUnreadMessageCounts,
  markMessagesAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Detailed request logging
router.use((req, res, next) => {
  console.log('🔍 MESSAGE ROUTE DEBUG:');
  console.log(`📍 Path: ${req.method} ${req.originalUrl}`);
  console.log(`📦 Body: ${JSON.stringify(req.body)}`);
  console.log(`🔑 Auth: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  console.log(`📋 Content-Type: ${req.headers['content-type']}`);
  next();
});

// Define routes explicitly
router.get('/', protect, (req, res, next) => {
  console.log('✅ GET /messages handler called');
  getMessages(req, res, next);
});

router.post('/', protect, (req, res, next) => {
  console.log('✅ POST /messages handler called');
  sendMessage(req, res, next);
});

router.get('/conversations', protect, (req, res, next) => {
  console.log('✅ GET /messages/conversations handler called');
  getConversations(req, res, next);
});

router.get('/unread-count', protect, (req, res, next) => {
  console.log('✅ GET /messages/unread-count handler called');
  getUnreadMessageCounts(req, res, next);
});

router.put('/mark-read', protect, (req, res, next) => {
  console.log('✅ PUT /messages/mark-read handler called');
  markMessagesAsRead(req, res, next);
});

module.exports = router;