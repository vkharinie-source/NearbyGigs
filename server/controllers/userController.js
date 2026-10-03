const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public (for viewing other profiles) or Private
const getUserProfile = async (req, res) => {
  try {
    const targetId = (req.params.id === 'profile' || req.params.id === 'me')
      ? req.user?._id
      : req.params.id;

    if (!targetId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(targetId).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const targetId = (req.params.id === 'profile' || req.params.id === 'me')
      ? req.user._id
      : req.params.id;

    const user = await User.findById(targetId);

    if (user) {
      // Ensure the logged-in user is updating their own profile
      if (req.user._id.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }

      if (req.body.name !== undefined) user.name = req.body.name;
      if (req.body.password) user.password = req.body.password;
      if (req.body.bio !== undefined) user.bio = req.body.bio;
      if (req.body.phone !== undefined) user.phone = req.body.phone;
      if (req.body.role !== undefined) user.role = req.body.role;
      if (req.body.experience !== undefined) user.experience = Number(req.body.experience) || 0;
      if (req.body.availability !== undefined) user.availability = req.body.availability;
      if (req.body.profileImage !== undefined) user.profileImage = req.body.profileImage;

      // Handle address and location
      if (req.body.address !== undefined) {
        user.address = req.body.address;
        if (!user.location) user.location = { type: 'Point', coordinates: [77.5946, 12.9716] };
        user.location.address = req.body.address;
      }
      if (req.body.location !== undefined) {
        user.location = {
          ...user.location?.toObject?.() || user.location,
          ...req.body.location,
        };
      }

      if (req.body.skills !== undefined) {
        user.skills = Array.isArray(req.body.skills)
          ? req.body.skills.map(s => String(s).trim()).filter(Boolean)
          : typeof req.body.skills === 'string'
            ? req.body.skills.split(',').map(s => s.trim()).filter(Boolean)
            : user.skills;
      }

      const updatedUser = await user.save();
      const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        role: updatedUser.role,
        bio: updatedUser.bio || '',
        skills: updatedUser.skills || [],
        experience: updatedUser.experience ?? 0,
        availability: updatedUser.availability || 'available_today',
        profileImage: updatedUser.profileImage || '',
        address: updatedUser.address || updatedUser.location?.address || '',
        location: updatedUser.location,
        rating: updatedUser.rating || 0,
        token,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUserProfile, updateUserProfile };
