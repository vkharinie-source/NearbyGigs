const Service = require('../models/Service');
const User = require('../models/User');

// Create Worker Service Post
const createService = async (req, res, next) => {
  try {
    const {
      title,
      category,
      description,
      skills,
      experienceYears,
      startingPrice,
      availability,
      serviceAreaKm,
      address,
      latitude,
      longitude,
      photos,
    } = req.body;

    const lat = parseFloat(latitude) || req.user.location?.coordinates[1] || 12.9716;
    const lng = parseFloat(longitude) || req.user.location?.coordinates[0] || 77.5946;

    const service = await Service.create({
      title,
      category,
      description,
      skills: Array.isArray(skills)
        ? skills
        : skills ? skills.split(',').map(s => s.trim()) : [],
      experienceYears: Number(experienceYears) || 0,
      startingPrice: Number(startingPrice),
      availability: availability || 'available_today',
      serviceAreaKm: Number(serviceAreaKm) || 10,
      address,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      worker: req.user._id,
      photos: photos || [],
    });

    res.status(201).json({ success: true, service });
  } catch (error) {
    next(error);
  }
};

// Get Nearby Workers / Services
const getNearbyWorkers = async (req, res, next) => {
  try {
    const { lat, lng, radius = 15, category, skill, search, minPrice, maxPrice } = req.query;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const userLat = !isNaN(parsedLat) ? parsedLat : (req.user?.location?.coordinates?.[1] || 12.9716);
    const userLng = !isNaN(parsedLng) ? parsedLng : (req.user?.location?.coordinates?.[0] || 77.5946);
    const radiusKm = parseFloat(radius) > 0 ? parseFloat(radius) : 15;
    const maxDistanceMeters = radiusKm * 1000;

    let baseFilter = { isActive: true };
    if (category && category !== 'All') baseFilter.category = category;
    if (skill) baseFilter.skills = { $in: [new RegExp(skill, 'i')] };
    if (search) {
      baseFilter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (minPrice || maxPrice) {
      baseFilter.startingPrice = {};
      if (minPrice) baseFilter.startingPrice.$gte = Number(minPrice);
      if (maxPrice) baseFilter.startingPrice.$lte = Number(maxPrice);
    }

    let services = [];

    // First attempt: Geospatial query within radius
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

      services = await Service.find(geoQuery)
        .populate('worker', 'name email rating profileImage bio phone skills availability')
        .lean();
    } catch (geoErr) {
      console.warn('Geospatial $near query on services notice:', geoErr.message);
    }

    // Fallback: If no workers in strict radius circle, fetch active services matching filters
    if (!services || services.length === 0) {
      services = await Service.find(baseFilter)
        .populate('worker', 'name email rating profileImage bio phone skills availability')
        .sort('-createdAt')
        .limit(50)
        .lean();
    }

    const workersWithDistance = (services || []).map(service => {
      const coords = service.location?.coordinates;
      let distKm = 0;
      if (coords && Array.isArray(coords) && coords.length >= 2) {
        const [wLng, wLat] = coords;
        distKm = calculateHaversineKm(userLat, userLng, Number(wLat), Number(wLng));
      }
      return { ...service, distanceKm: parseFloat(distKm.toFixed(1)) };
    });

    workersWithDistance.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    res.json({ success: true, count: workersWithDistance.length, workers: workersWithDistance });
  } catch (error) {
    next(error);
  }
};

// Get Service Details
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      'worker',
      'name email rating bio profileImage phone skills availability location'
    );

    if (!service) {
      res.status(404);
      throw new Error('Service post not found');
    }
    res.json({ success: true, service });
  } catch (error) {
    next(error);
  }
};

// Update Worker Service
const updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);
    if (!service) {
      res.status(404);
      throw new Error('Service post not found');
    }
    if (service.worker.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this service');
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, service });
  } catch (error) {
    next(error);
  }
};

// Get Logged In Worker's Services
const getMyServices = async (req, res, next) => {
  try {
    const services = await Service.find({ worker: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: services.length, services });
  } catch (error) {
    next(error);
  }
};

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
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
  createService,
  getNearbyWorkers,
  getServiceById,
  updateService,
  getMyServices,
};
