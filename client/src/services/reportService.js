import API from './api';

export const reportService = {
  createReport: async (data) => {
    const res = await API.post('/reports', data);
    return res.data;
  },
  getMyReports: async () => {
    const res = await API.get('/reports/my-reports');
    return res.data;
  },
};
