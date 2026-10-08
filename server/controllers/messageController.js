const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { logAuditEvent } = require('../utils/auditLogger');

// Sanitize message content to prevent stored XSS
function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

// Send Message with Sanitization & Participant Validation
const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content, gigId, serviceRequestId } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ success: false, message: 'Recipient and message content are required.' });
    }

    if (recipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a message to yourself.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient user not found.' });
    }

    const cleanContent = sanitizeText(content);
    if (!cleanContent) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      content: cleanContent,
      gigId: gigId || undefined,
      serviceRequestId: serviceRequestId || undefined,
    });

    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'message_received',
      title: 'New Message',
      message: `${req.user.name}: "${cleanContent.substring(0, 30)}..."`,
      link: '/messages',
    });

    await logAuditEvent({
      user: req.user._id,
      action: 'MESSAGE_SENT',
      status: 'SUCCESS',
      req,
      resourceType: 'Message',
      resourceId: message._id,
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// Get Conversations List for Logged-In User Only
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate('sender', 'name email profileImage rating employerStatus')
      .populate('recipient', 'name email profileImage rating employerStatus')
      .sort('-createdAt');

    const conversationMap = new Map();

    messages.forEach((msg) => {
      if (!msg.sender || !msg.recipient) return;
      const otherUser =
        msg.sender._id.toString() === userId.toString() ? msg.recipient : msg.sender;
      if (!conversationMap.has(otherUser._id.toString())) {
        conversationMap.set(otherUser._id.toString(), {
          user: otherUser,
          lastMessage: msg,
        });
      }
    });

    const conversations = Array.from(conversationMap.values());
    res.json({ success: true, count: conversations.length, conversations });
  } catch (error) {
    next(error);
  }
};

// Get Messages with specific user (Strict authorization: Only sender or recipient can access)
const getMessagesWithUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'Other user ID is required.' });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId },
      ],
    })
      .populate('sender', 'name email profileImage')
      .populate('recipient', 'name email profileImage')
      .sort('createdAt');

    // Mark received messages as read
    await Message.updateMany(
      { sender: otherUserId, recipient: userId, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getMessagesWithUser,
};
