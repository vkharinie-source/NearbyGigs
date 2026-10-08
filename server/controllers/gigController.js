const Gig = require('../models/Gig');
const User = require('../models/User');
const { checkNightWork } = require('../utils/nightTimeUtils');
const { logAuditEvent } = require('../utils/auditLogger');

// Create new Gig with Night-Work detection & Safety settings
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
      isStudentEligible,
      minimumAge,
      cancellationPolicy,
    } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ success: false, message: 'Title, category, and description are required.' });
    }

    const minB = Math.max(0, Number(budgetMin) || 0);
    const maxB = Math.max(minB, Number(budgetMax) || minB);

    const lat = parseFloat(latitude) || req.user.location?.coordinates[1] || 12.9716;
    const lng = parseFloat(longitude) || req.user.location?.coordinates[0] || 77.5946;

    // Automatic Night-work detection
    const nightCheck = checkNightWork(time || '', date || '');

    const gig = await Gig.create({
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      requiredSkills: Array.isArray(requiredSkills)
        ? requiredSkills
        : requiredSkills ? requiredSkills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      budgetMin: minB,
      budgetMax: maxB,
      date: date || 'Today',
      time: time || 'Flexible',
      duration: duration || '2-3 Hours',
      address: address || req.user.location?.address || 'Bengaluru, Karnataka',
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      postedBy: req.user._id,
      numberOfWorkers: Number(numberOfWorkers) || 1,
      additionalRequirements: additionalRequirements || '',
      isNightGig: nightCheck.isNight,
      isStudentEligible: isStudentEligible !== undefined ? Boolean(isStudentEligible) : true,
      minimumAge: Number(minimumAge) || 18,
      cancellationPolicy: cancellationPolicy || 'Flexible: Cancel up to 2 hours before start.',
    });

    await logAuditEvent({
      user: req.user._id,
      action: 'GIG_CREATED',
      status: 'SUCCESS',
      req,
      resourceType: 'Gig',
      resourceId: gig._id,
      metadata: { isNightGig: gig.isNightGig, category: gig.category },
    });

    res.status(201).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// Get Nearby Gigs with filters, privacy projection & distance calculation
const getNearbyGigs = async (req, res, next) => {
  try {
    const { lat, lng, radius, category, search, minBudget, maxBudget, nightOnly, studentOnly } = req.query;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const userLat = !isNaN(parsedLat) ? parsedLat : (req.user?.location?.coordinates?.[1] || 12.9716);
    const userLng = !isNaN(parsedLng) ? parsedLng : (req.user?.location?.coordinates?.[0] || 77.5946);
    const radiusKm = parseFloat(radius) > 0 ? parseFloat(radius) : 25;
    const maxDistanceMeters = radiusKm * 1000;

    let baseFilter = { status: 'open' };
    if (category && category !== 'All') baseFilter.category = category;
    if (nightOnly === 'true') baseFilter.isNightGig = true;
    if (studentOnly === 'true') baseFilter.isStudentEligible = true;

    if (search && typeof search === 'string') {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      baseFilter.$or = [
        { title: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(sanitizedSearch, 'i')] } },
      ];
    }

    if (minBudget || maxBudget) {
      baseFilter.budgetMax = {};
      if (minBudget) baseFilter.budgetMax.$gte = Number(minBudget);
      if (maxBudget) baseFilter.budgetMin = { $lte: Number(maxBudget) };
    }

    let gigs = [];

    // Geospatial query attempt
    try {
      const geoQuery = {
        ...baseFilter,
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

      gigs = await Gig.find(geoQuery)
        .populate('postedBy', 'name rating profileImage employerStatus companyName')
        .lean();
    } catch (geoErr) {
      console.warn('Geospatial $near query notice:', geoErr.message);
    }

    // Fallback if no geo matches
    if (!gigs || gigs.length === 0) {
      gigs = await Gig.find(baseFilter)
        .populate('postedBy', 'name rating profileImage employerStatus companyName')
        .sort('-createdAt')
        .limit(50)
        .lean();
    }

    // Attach Haversine distance in KM
    const gigsWithDistance = (gigs || []).map((gig) => {
      const coords = gig.location?.coordinates;
      let distKm = 0;
      if (coords && Array.isArray(coords) && coords.length >= 2) {
        const [gLng, gLat] = coords;
        distKm = calculateHaversineKm(userLat, userLng, Number(gLat), Number(gLng));
      }
      return {
        ...gig,
        distanceKm: parseFloat(distKm.toFixed(1)),
        isVerifiedEmployer: gig.postedBy?.employerStatus === 'VERIFIED',
      };
    });

    gigsWithDistance.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    res.json({ success: true, count: gigsWithDistance.length, gigs: gigsWithDistance });
  } catch (error) {
    next(error);
  }
};

// Get Gig by ID
const getGigById = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('postedBy', 'name rating bio profileImage employerStatus companyName')
      .populate('assignedTo', 'name rating profileImage');

    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    res.json({
      success: true,
      gig: {
        ...gig.toObject(),
        isVerifiedEmployer: gig.postedBy?.employerStatus === 'VERIFIED',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update Gig (Owner or Admin only)
const updateGig = async (req, res, next) => {
  try {
    let gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this gig.' });
    }

    // Check night work if time or date is updated
    if (req.body.time || req.body.date) {
      const nightCheck = checkNightWork(req.body.time || gig.time, req.body.date || gig.date);
      req.body.isNightGig = nightCheck.isNight;
    }

    gig = await Gig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    await logAuditEvent({
      user: req.user._id,
      action: 'GIG_UPDATED',
      status: 'SUCCESS',
      req,
      resourceType: 'Gig',
      resourceId: gig._id,
    });

    res.json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// Delete Gig (Owner or Admin only)
const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this gig.' });
    }

    await gig.deleteOne();

    await logAuditEvent({
      user: req.user._id,
      action: 'GIG_DELETED',
      status: 'SUCCESS',
      req,
      resourceType: 'Gig',
      resourceId: req.params.id,
    });

    res.json({ success: true, message: 'Gig removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// Get Logged In User's Posted Gigs
const getMyGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ postedBy: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: gigs.length, gigs });
  } catch (error) {
    next(error);
  }
};

// Haversine distance formula
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
