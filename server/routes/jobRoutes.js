const express = require('express');
const router = express.Router();
const { getJobs, getJobById, createJob, updateJob, deleteJob } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

router.route('/')
  .get(getJobs)
  .post(protect, authorizeRole('employer'), createJob);

router.route('/:id')
  .get(getJobById)
  .put(protect, authorizeRole('employer'), updateJob)
  .delete(protect, authorizeRole('employer'), deleteJob);

module.exports = router;
