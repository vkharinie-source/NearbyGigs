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
  updateApplicationStatus: async (id, status) => {
    const res = await API.put(`/applications/${id}/status`, { status });
    return res.data;
  },
};
