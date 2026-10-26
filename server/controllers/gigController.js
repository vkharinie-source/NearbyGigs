const Gig = require('../models/Gig');
const User = require('../models/User');
const { checkNightWork } = require('../utils/nightTimeUtils');
const { logAuditEvent } = require('../utils/auditLogger');
const { evaluateEligibility } = require('../utils/eligibilityEngine');

// Create new Gig / Job Listing with Night-Work detection & Safety settings
const createGig = async (req, res, next) => {
  try {
    const {
      title,
      category,
      description,
      requiredSkills,
      budgetMin,
      budgetMax,
      salaryType,
      jobType,
      date,
      time,
      duration,
      workDate,
      startTime,
      endTime,
      recurringSchedule,
      deadline,
      address,
      latitude,
      longitude,
      numberOfWorkers,
      requiredExperience,
      additionalRequirements,
      evidenceRequirements,
      attendanceMethod,
      isStudentEligible,
      minimumAge,
      cancellationPolicy,
      status,
    } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ success: false, message: 'Title, category, and description are required.' });
    }

    const minB = Math.max(0, Number(budgetMin) || 0);
    const maxB = Math.max(minB, Number(budgetMax) || minB);

    const lat = parseFloat(latitude) || req.user.location?.coordinates[1] || 12.9716;
    const lng = parseFloat(longitude) || req.user.location?.coordinates[0] || 77.5946;

    // Automatic Night-work detection
    const nightCheck = checkNightWork(time || startTime || '', date || workDate || '');

    // Normalize required skills
    const skillsList = Array.isArray(requiredSkills)
      ? requiredSkills.map((s) => String(s).trim()).filter(Boolean)
      : typeof requiredSkills === 'string'
      ? requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    // Evidence requirements array
    const evidenceList = Array.isArray(evidenceRequirements)
      ? evidenceRequirements
      : typeof evidenceRequirements === 'string'
      ? evidenceRequirements.split(',').map((s) => s.trim()).filter(Boolean)
      : ['task_checklist', 'deliverable_link'];

    const gigStatus = status && ['open', 'draft', 'paused'].includes(status) ? status : 'open';

    const gig = await Gig.create({
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      requiredSkills: skillsList,
      budgetMin: minB,
      budgetMax: maxB,
      salaryType: salaryType || 'Fixed',
      jobType: jobType || 'On-site',
      date: date || 'Today',
      time: time || 'Flexible',
      duration: duration || '2-3 Hours',
      workDate: workDate ? new Date(workDate) : undefined,
      startTime: startTime || '',
      endTime: endTime || '',
      recurringSchedule: recurringSchedule || 'One-time',
      deadline: deadline ? new Date(deadline) : undefined,
      address: address || req.user.location?.address || 'Bengaluru, Karnataka',
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      postedBy: req.user._id,
      numberOfWorkers: Number(numberOfWorkers) || 1,
      requiredExperience: Number(requiredExperience) || 0,
      additionalRequirements: additionalRequirements || '',
      evidenceRequirements: evidenceList,
      attendanceMethod: attendanceMethod || 'otp',
      status: gigStatus,
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
      metadata: { isNightGig: gig.isNightGig, category: gig.category, jobType: gig.jobType },
    });

    res.status(201).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// Get Nearby Gigs with smart filters, distance calculation & personalized eligibility
const getNearbyGigs = async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      radius,
      category,
      search,
      minBudget,
      maxBudget,
      nightOnly,
      studentOnly,
      jobType,
      experienceLevel,
      verifiedOnly,
      status,
    } = req.query;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const userLat = !isNaN(parsedLat) ? parsedLat : (req.user?.location?.coordinates?.[1] || 12.9716);
    const userLng = !isNaN(parsedLng) ? parsedLng : (req.user?.location?.coordinates?.[0] || 77.5946);
    const radiusKm = parseFloat(radius) > 0 ? parseFloat(radius) : 50;
    const maxDistanceMeters = radiusKm * 1000;

    let baseFilter = {};
    if (status && ['open', 'in_progress', 'completed', 'all'].includes(status)) {
      if (status !== 'all') baseFilter.status = status;
    } else {
      baseFilter.status = 'open';
    }

    if (category && category !== 'All') baseFilter.category = category;
    if (nightOnly === 'true') baseFilter.isNightGig = true;
    if (studentOnly === 'true') baseFilter.isStudentEligible = true;
    if (jobType && ['On-site', 'Remote', 'Hybrid'].includes(jobType)) baseFilter.jobType = jobType;
    if (experienceLevel) {
      const expNum = Number(experienceLevel);
      if (!isNaN(expNum)) baseFilter.requiredExperience = { $lte: expNum };
    }

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

    // Attempt geospatial query if within reasonable bounds
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
        .populate('postedBy', 'name rating profileImage employerStatus companyName phone email')
        .lean();
    } catch (geoErr) {
      // Fallback to standard indexed search
    }

    if (!gigs || gigs.length === 0) {
      gigs = await Gig.find(baseFilter)
        .populate('postedBy', 'name rating profileImage employerStatus companyName phone email')
        .sort('-createdAt')
        .limit(100)
        .lean();
    }

    // Attach Haversine distance, employer verification & smart eligibility calculation
    let gigsWithDetails = (gigs || []).map((gig) => {
      const coords = gig.location?.coordinates;
      let distKm = 0;
      if (coords && Array.isArray(coords) && coords.length >= 2) {
        const [gLng, gLat] = coords;
        distKm = calculateHaversineKm(userLat, userLng, Number(gLat), Number(gLng));
      }

      const isVerifiedEmp = gig.postedBy?.employerStatus === 'VERIFIED';

      // Smart Eligibility Engine evaluation
      const eligibility = evaluateEligibility(req.user, gig);

      // Check if user has saved this gig
      const isSaved = Boolean(
        req.user?.savedGigs?.some((sg) => sg.toString() === gig._id.toString())
      );

      return {
        ...gig,
        distanceKm: parseFloat(distKm.toFixed(1)),
        isVerifiedEmployer: isVerifiedEmp,
        eligibility,
        isSaved,
      };
    });

    if (verifiedOnly === 'true') {
      gigsWithDetails = gigsWithDetails.filter((g) => g.isVerifiedEmployer);
    }

    res.json({
      success: true,
      count: gigsWithDetails.length,
      gigs: gigsWithDetails,
    });
  } catch (error) {
    next(error);
  }
};

// Get Gig by ID with full details & smart eligibility
const getGigById = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('postedBy', 'name rating bio profileImage employerStatus companyName phone')
      .populate('assignedTo', 'name rating profileImage bio skills');

    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    const gigObj = gig.toObject();
    const eligibility = evaluateEligibility(req.user, gigObj);
    const isSaved = Boolean(
      req.user?.savedGigs?.some((sg) => sg.toString() === gig._id.toString())
    );

    res.json({
      success: true,
      gig: {
        ...gigObj,
        isVerifiedEmployer: gig.postedBy?.employerStatus === 'VERIFIED',
        eligibility,
        isSaved,
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
    if (req.body.time || req.body.date || req.body.startTime) {
      const checkT = req.body.time || req.body.startTime || gig.time;
      const checkD = req.body.date || req.body.workDate || gig.date;
      const nightCheck = checkNightWork(checkT, checkD);
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

// Update Gig Lifecycle Status (Draft, Pause, Close, Publish)
const updateGigStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'draft', 'paused', 'closed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found.' });
    }

    if (gig.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to change this gig status.' });
    }

    gig.status = status;
    await gig.save();

    await logAuditEvent({
      user: req.user._id,
      action: 'GIG_STATUS_CHANGED',
      status: 'SUCCESS',
      req,
      resourceType: 'Gig',
      resourceId: gig._id,
      metadata: { newStatus: status },
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

// Save / Bookmark a Gig for Later
const saveGig = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const gigId = req.params.id;

    if (!user.savedGigs.includes(gigId)) {
      user.savedGigs.push(gigId);
      await user.save();
      await Gig.findByIdAndUpdate(gigId, { $inc: { savedByCount: 1 } });
    }

    res.json({ success: true, message: 'Job saved to your bookmarks.', savedGigs: user.savedGigs });
  } catch (error) {
    next(error);
  }
};

// Unsave / Remove Bookmark
const unsaveGig = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const gigId = req.params.id;

    user.savedGigs = user.savedGigs.filter((id) => id.toString() !== gigId.toString());
    await user.save();
    await Gig.findByIdAndUpdate(gigId, { $inc: { savedByCount: -1 } });

    res.json({ success: true, message: 'Job removed from bookmarks.', savedGigs: user.savedGigs });
  } catch (error) {
    next(error);
  }
};

// Get My Saved Gigs
const getMySavedGigs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedGigs',
      populate: { path: 'postedBy', select: 'name rating profileImage employerStatus companyName' },
    });

    res.json({ success: true, gigs: user?.savedGigs || [] });
  } catch (error) {
    next(error);
  }
};

// Haversine distance formula in KM
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
  updateGigStatus,
  deleteGig,
  getMyGigs,
  saveGig,
  unsaveGig,
  getMySavedGigs,
};
