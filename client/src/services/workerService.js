import API from './api';

export const workerService = {
  getNearbyWorkers: async (params = {}) => {
    const res = await API.get('/services/nearby', { params });
    return res.data;
  },
  getServiceById: async (id) => {
    const res = await API.get(`/services/${id}`);
    return res.data;
  },
  createService: async (serviceData) => {
    const res = await API.post('/services', serviceData);
    return res.data;
  },
  getMyServices: async () => {
    const res = await API.get('/services/my-services');
    return res.data;
  },
};
