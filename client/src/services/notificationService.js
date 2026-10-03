import API from './api';

export const notificationService = {
  getNotifications: async () => {
    const res = await API.get('/notifications');
    return res.data;
  },
  markAsRead: async (id) => {
    const res = await API.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await API.put('/notifications/mark-all-read');
    return res.data;
  },
};
