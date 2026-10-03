const User = require('../models/User');

const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      res.status(400);
      throw new Error('Latitude and longitude are required');
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      },
      { new: true }
    ).select('-password');

    res.json({ success: true, location: user.location, user });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateLocation };
