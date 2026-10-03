const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/Service');
const Notification = require('../models/Notification');

// Create Direct Service Request
const createServiceRequest = async (req, res, next) => {
  try {
    const { serviceId, note, requestedDate, offeredPrice } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(404);
      throw new Error('Service post not found');
    }

    if (service.worker.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot request your own service');
    }

    const serviceRequest = await ServiceRequest.create({
      service: serviceId,
      worker: service.worker,
      customer: req.user._id,
      note,
      requestedDate,
      offeredPrice: Number(offeredPrice) || service.startingPrice,
    });

    // Notify Worker
    await Notification.create({
      recipient: service.worker,
      sender: req.user._id,
      type: 'service_request_received',
      title: 'New Service Request',
      message: `${req.user.name} requested your service "${service.title}"`,
      link: '/requests',
    });

    res.status(201).json({ success: true, serviceRequest });
  } catch (error) {
    next(error);
  }
};

// Get User's Service Requests (sent or received)
const getServiceRequests = async (req, res, next) => {
  try {
    const requests = await ServiceRequest.find({
      $or: [{ customer: req.user._id }, { worker: req.user._id }],
    })
      .populate('service', 'title startingPrice category')
      .populate('customer', 'name email profileImage phone location')
      .populate('worker', 'name email profileImage phone rating')
      .sort('-createdAt');

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    next(error);
  }
};

// Update Request Status (Accept / Reject / Complete)
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error('Service request not found');
    }

    request.status = status;
    await request.save();

    const notifyRecipient =
      request.customer.toString() === req.user._id.toString()
        ? request.worker
        : request.customer;

    // Safe notification type mapping to prevent enum validation errors
    const typeMap = {
      accepted: 'service_request_accepted',
      rejected: 'service_request_rejected',
      completed: 'service_request_completed',
      cancelled: 'service_request_cancelled',
    };

    await Notification.create({
      recipient: notifyRecipient,
      sender: req.user._id,
      type: typeMap[status] || 'system',
      title: `Service Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `The service request has been ${status}.`,
      link: '/requests',
    });

    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createServiceRequest,
  getServiceRequests,
  updateRequestStatus,
};
