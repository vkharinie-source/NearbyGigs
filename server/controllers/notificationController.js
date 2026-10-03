const Notification = require('../models/Notification');

const getMyNotifications = async (req, res, next) => {
  try {
    let notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name profileImage')
      .sort('-createdAt');

    if (notifications.length === 0) {
      // Auto-generate initial welcome notifications for new users
      await Notification.create([
        {
          recipient: req.user._id,
          title: `Welcome to NearbyGig, ${req.user.name || 'Neighbor'}! 🎉`,
          message: 'Your account is verified and ready. Start by exploring nearby gigs or publishing your availability.',
          type: 'system',
          read: false,
        },
        {
          recipient: req.user._id,
          title: '📍 Proximity Radar Enabled',
          message: 'Your location has been set to Bengaluru. You will receive alerts when new tasks are posted within 15km.',
          type: 'system',
          read: false,
        },
        {
          recipient: req.user._id,
          title: '⚡ Gigs Available in Your Area',
          message: 'Clients in Indiranagar and Koramangala recently posted Electrical and Plumbing tasks.',
          type: 'application_received',
          read: false,
        },
      ]);

      notifications = await Notification.find({ recipient: req.user._id })
        .populate('sender', 'name profileImage')
        .sort('-createdAt');
    }

    res.json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
