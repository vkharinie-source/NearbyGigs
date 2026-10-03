import API from './api';

export const requestService = {
  createRequest: async (requestData) => {
    const res = await API.post('/requests', requestData);
    return res.data;
  },
  getRequests: async () => {
    const res = await API.get('/requests');
    return res.data;
  },
  updateRequestStatus: async (id, status) => {
    const res = await API.put(`/requests/${id}/status`, { status });
    return res.data;
  },
};
