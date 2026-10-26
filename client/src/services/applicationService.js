import API from './api';

export const applicationService = {
  applyForGig: async (applicationData) => {
    const res = await API.post('/applications', applicationData);
    return res.data;
  },
  getMyApplications: async () => {
    const res = await API.get('/applications/my-applications');
    return res.data;
  },
  getReceivedApplications: async () => {
    const res = await API.get('/applications/received');
    return res.data;
  },
  updateApplicationStatus: async (id, status, notes = '') => {
    const res = await API.put(`/applications/${id}/status`, { status, notes });
    return res.data;
  },
  // 7A: Commitment confirmation
  respondToCommitment: async (id, { action, notes = '', reason = '' }) => {
    const res = await API.post(`/applications/${id}/commit`, { action, notes, reason });
    return res.data;
  },
  // 7A: Attendance Proof
  generateAttendanceCode: async (id) => {
    const res = await API.post(`/applications/${id}/attendance/generate-code`);
    return res.data;
  },
  verifyAttendance: async (id, { code, latitude, longitude, address }) => {
    const res = await API.post(`/applications/${id}/attendance/verify`, {
      code,
      latitude,
      longitude,
      address,
    });
    return res.data;
  },
  recordCheckOut: async (id) => {
    const res = await API.post(`/applications/${id}/attendance/checkout`);
    return res.data;
  },
  disputeAttendance: async (id, { reason }) => {
    const res = await API.post(`/applications/${id}/attendance/dispute`, { reason });
    return res.data;
  },
  // 7A: Work Completion Proof & Two-Way Workflow
  submitWorkCompletion: async (
    id,
    {
      taskDescription,
      deliverableLinks = [],
      checklist = [],
      beforePhotos = [],
      afterPhotos = [],
      evidence = [],
      notes = '',
    }
  ) => {
    const res = await API.post(`/applications/${id}/completion/submit`, {
      taskDescription,
      deliverableLinks,
      checklist,
      beforePhotos,
      afterPhotos,
      evidence,
      notes,
    });
    return res.data;
  },
  reviewWorkCompletion: async (
    id,
    {
      decision,
      reason = '',
      feedback = '',
      revisionNotes = '',
      disputeNotes = '',
      evidence = [],
    }
  ) => {
    const res = await API.post(`/applications/${id}/completion/review`, {
      decision,
      reason,
      feedback,
      revisionNotes,
      disputeNotes,
      evidence,
    });
    return res.data;
  },
  acknowledgeOrConcern: async (id, { action, statement = '', evidence = [] }) => {
    const res = await API.post(`/applications/${id}/completion/concern`, {
      action,
      statement,
      evidence,
    });
    return res.data;
  },
  getCompletionDetails: async (id) => {
    const res = await API.get(`/applications/${id}/completion-details`);
    return res.data;
  },
  // 7A: Cancellation handling
  cancelAssignment: async (id, { reason }) => {
    const res = await API.post(`/applications/${id}/cancel`, { reason });
    return res.data;
  },
};
