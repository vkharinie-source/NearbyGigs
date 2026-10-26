const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getMessagesWithUser,
  getContacts,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/contacts', protect, getContacts);
router.get('/conversations', protect, getConversations);
router.get('/user/:userId', protect, getMessagesWithUser);

module.exports = router;
