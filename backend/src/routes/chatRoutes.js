const express = require('express');
const router = express.Router();
const { getChatHistory, getConversations, getUnreadCount, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:userId', protect, getChatHistory);
router.put('/:userId/read', protect, markAsRead);

module.exports = router;
