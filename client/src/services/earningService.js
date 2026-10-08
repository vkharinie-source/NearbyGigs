import API from './api';

export const earningService = {
  getMyEarnings: async () => {
    const res = await API.get('/earnings');
    return res.data;
  },
};
