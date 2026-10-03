const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Send Message
const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content, gigId, serviceRequestId } = req.body;

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(404);
      throw new Error('Recipient user not found');
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      content,
      gigId,
      serviceRequestId,
    });

    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'message_received',
      title: 'New Message',
      message: `${req.user.name}: "${content.substring(0, 30)}..."`,
      link: '/messages',
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// Get Conversations List
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate('sender', 'name email profileImage')
      .populate('recipient', 'name email profileImage')
      .sort('-createdAt');

    const conversationMap = new Map();

    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === userId.toString() ? msg.recipient : msg.sender;
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

// Get Messages with specific user
const getMessagesWithUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

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
