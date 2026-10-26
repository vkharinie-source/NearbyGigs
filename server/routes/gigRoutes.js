const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/gigController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getNearbyGigs);
router.get('/nearby', optionalAuth, getNearbyGigs);
router.get('/my-gigs', protect, getMyGigs);
router.get('/saved', protect, getMySavedGigs);
router.get('/:id', optionalAuth, getGigById);
router.post('/', protect, createGig);
router.put('/:id', protect, updateGig);
router.patch('/:id/status', protect, updateGigStatus);
router.delete('/:id', protect, deleteGig);
router.post('/:id/save', protect, saveGig);
router.delete('/:id/save', protect, unsaveGig);

module.exports = router;
