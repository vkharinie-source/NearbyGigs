const Gig = require('../models/Gig');
const User = require('../models/User');

// Create new Gig
const createGig = async (req, res, next) => {
  try {
    const {
      title,
      category,
      description,
      requiredSkills,
      budgetMin,
      budgetMax,
      date,
      time,
      duration,
      address,
      latitude,
      longitude,
      numberOfWorkers,
      additionalRequirements,
    } = req.body;

    const lat = parseFloat(latitude) || req.user.location?.coordinates[1] || 12.9716;
    const lng = parseFloat(longitude) || req.user.location?.coordinates[0] || 77.5946;

    const gig = await Gig.create({
      title,
      category,
      description,
      requiredSkills: Array.isArray(requiredSkills)
        ? requiredSkills
        : requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : [],
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      date,
      time,
      duration,
      address,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      postedBy: req.user._id,
      numberOfWorkers: Number(numberOfWorkers) || 1,
      additionalRequirements,
    });

    res.status(201).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// Get Nearby Gigs with filters & distance calculation
const getNearbyGigs = async (req, res, next) => {
  try {
    const { lat, lng, radius, category, search, minBudget, maxBudget } = req.query;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const userLat = !isNaN(parsedLat) ? parsedLat : (req.user?.location?.coordinates?.[1] || 12.9716);
    const userLng = !isNaN(parsedLng) ? parsedLng : (req.user?.location?.coordinates?.[0] || 77.5946);
    const radiusKm = parseFloat(radius) > 0 ? parseFloat(radius) : 10;
    const maxDistanceMeters = radiusKm * 1000;

    let query = {
      status: 'open',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLng, userLat],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (minBudget || maxBudget) {
      query.budgetMax = {};
      if (minBudget) query.budgetMax.$gte = Number(minBudget);
      if (maxBudget) query.budgetMin = { $lte: Number(maxBudget) };
    }

    const gigs = await Gig.find(query)
      .populate('postedBy', 'name email rating profileImage location phone')
      .lean();

    // Attach calculated distance in KM
    const gigsWithDistance = gigs.map(gig => {
      const [gLng, gLat] = gig.location.coordinates;
      const distKm = calculateHaversineKm(userLat, userLng, gLat, gLng);
      return { ...gig, distanceKm: parseFloat(distKm.toFixed(1)) };
    });

    res.json({ success: true, count: gigsWithDistance.length, gigs: gigsWithDistance });
  } catch (error) {
    next(error);
  }
};

// Get Gig by ID
const getGigById = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('postedBy', 'name email rating bio profileImage phone location')
      .populate('assignedTo', 'name email rating profileImage phone');

    if (!gig) {
      res.status(404);
      throw new Error('Gig not found');
    }
    res.json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// Update Gig
const updateGig = async (req, res, next) => {
  try {
    let gig = await Gig.findById(req.params.id);
    if (!gig) {
      res.status(404);
      throw new Error('Gig not found');
    }
    if (gig.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this gig');
    }

    gig = await Gig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// Delete Gig
const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      res.status(404);
      throw new Error('Gig not found');
    }
    if (gig.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this gig');
    }

    await gig.deleteOne();
    res.json({ success: true, message: 'Gig deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get User's Posted Gigs
const getMyGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ postedBy: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: gigs.length, gigs });
  } catch (error) {
    next(error);
  }
};

// Utility function: Haversine distance formula
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  createGig,
  getNearbyGigs,
  getGigById,
  updateGig,
  deleteGig,
  getMyGigs,
};
