import API from './api';

export const locationService = {
  updateUserLocation: async (latitude, longitude, address) => {
    const res = await API.put('/location/update', { latitude, longitude, address });
    return res.data;
  },
};
