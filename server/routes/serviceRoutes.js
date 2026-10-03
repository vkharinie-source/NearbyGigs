const express = require('express');
const router = express.Router();
const {
  createService,
  getNearbyWorkers,
  getServiceById,
  updateService,
  getMyServices,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/nearby', getNearbyWorkers);
router.get('/my-services', protect, getMyServices);
router.get('/:id', getServiceById);
router.post('/', protect, createService);
router.put('/:id', protect, updateService);

module.exports = router;
