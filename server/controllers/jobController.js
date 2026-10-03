const Job = require('../models/Job');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  try {
    const { category, location, status } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (status) query.status = status;
    else query.status = 'open'; // default to only show open jobs

    const jobs = await Job.find(query).populate('postedBy', 'name businessName location rating').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name businessName location rating');
    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private (Poster only)
const createJob = async (req, res) => {
  const { title, description, category, pay, hoursPerWeek, requiredAvailability, location, deadline } = req.body;

  try {
    const job = new Job({
      postedBy: req.user._id,
      title,
      description,
      category,
      pay,
      hoursPerWeek,
      requiredAvailability,
      location,
      deadline
    });

    const createdJob = await job.save();
    res.status(201).json(createdJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (Poster only - must be owner)
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (job) {
      // Check if user is the owner
      if (job.postedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this job' });
      }

      job.title = req.body.title || job.title;
      job.description = req.body.description || job.description;
      job.category = req.body.category || job.category;
      job.pay = req.body.pay || job.pay;
      job.hoursPerWeek = req.body.hoursPerWeek || job.hoursPerWeek;
      job.requiredAvailability = req.body.requiredAvailability || job.requiredAvailability;
      job.location = req.body.location || job.location;
      job.deadline = req.body.deadline || job.deadline;
      if (req.body.status) job.status = req.body.status;

      const updatedJob = await job.save();
      res.json(updatedJob);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (Poster only - must be owner)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (job) {
      if (job.postedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this job' });
      }
      
      await Job.deleteOne({ _id: job._id });
      res.json({ message: 'Job removed' });
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob };
