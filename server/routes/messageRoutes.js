const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getMessagesWithUser,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/user/:userId', protect, getMessagesWithUser);

module.exports = router;
