const express = require('express');
const router = express.Router();
const {
  createGig,
  getNearbyGigs,
  getGigById,
  updateGig,
  deleteGig,
  getMyGigs,
} = require('../controllers/gigController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getNearbyGigs);
router.get('/nearby', getNearbyGigs);
router.get('/my-gigs', protect, getMyGigs);
router.get('/:id', getGigById);
router.post('/', protect, createGig);
router.put('/:id', protect, updateGig);
router.delete('/:id', protect, deleteGig);

module.exports = router;
