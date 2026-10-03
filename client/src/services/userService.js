import API from './api';

export const userService = {
  getUserProfile: async (id) => {
    const res = await API.get(`/users/${id}`);
    return res.data;
  },

  updateProfile: async (id, data) => {
    const res = await API.put(`/users/${id}`, data);
    return res.data;
  },
};
