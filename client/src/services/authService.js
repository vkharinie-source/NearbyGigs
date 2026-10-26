import API from './api';

export const authService = {
  login: async (credentials) => {
    const res = await API.post('/auth/login', credentials);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (userData) => {
    const res = await API.post('/auth/register', userData);
    // User must sign in first before accessing dashboard, do not store token or user here
    return res.data;
  },
  choosePurpose: async (purpose) => {
    const res = await API.put('/auth/choose-purpose', { purpose });
    if (res.data.user) {
      const existing = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = { ...existing, ...res.data.user };
      localStorage.setItem('user', JSON.stringify(updated));
    }
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await API.get('/auth/me');
    return res.data;
  },
  forgotPassword: async (email) => {
    const res = await API.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (data) => {
    const res = await API.post('/auth/reset-password', data);
    return res.data;
  },
  changePassword: async (data) => {
    const res = await API.put('/auth/change-password', data);
    return res.data;
  },
  logout: async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pending_onboarding');
    }
  },
};
