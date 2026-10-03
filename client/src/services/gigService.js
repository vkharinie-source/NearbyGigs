import API from './api';

export const gigService = {
  getNearbyGigs: async (params = {}) => {
    const res = await API.get('/gigs/nearby', { params });
    return res.data;
  },
  getGigById: async (id) => {
    const res = await API.get(`/gigs/${id}`);
    return res.data;
  },
  createGig: async (gigData) => {
    const res = await API.post('/gigs', gigData);
    return res.data;
  },
  updateGig: async (id, gigData) => {
    const res = await API.put(`/gigs/${id}`, gigData);
    return res.data;
  },
  deleteGig: async (id) => {
    const res = await API.delete(`/gigs/${id}`);
    return res.data;
  },
  getMyGigs: async () => {
    const res = await API.get('/gigs/my-gigs');
    return res.data;
  },
};
