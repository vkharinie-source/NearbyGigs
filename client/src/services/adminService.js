import API from './api';

export const adminService = {
  getEmployers: async (params = {}) => {
    const res = await API.get('/admin/employers', { params });
    return res.data;
  },
  updateEmployerStatus: async (id, data) => {
    const res = await API.put(`/admin/employers/${id}/status`, data);
    return res.data;
  },
  getReports: async () => {
    const res = await API.get('/admin/reports');
    return res.data;
  },
  updateReportStatus: async (id, data) => {
    const res = await API.put(`/admin/reports/${id}/status`, data);
    return res.data;
  },
  getEmergencyAlerts: async () => {
    const res = await API.get('/admin/sos-alerts');
    return res.data;
  },
  updateEmergencyAlertStatus: async (id, data) => {
    const res = await API.put(`/admin/sos-alerts/${id}/status`, data);
    return res.data;
  },
  getAuditLogs: async (params = {}) => {
    const res = await API.get('/admin/audit-logs', { params });
    return res.data;
  },
  // Section 5: Dispute Resolution Dashboard
  getDisputes: async (params = {}) => {
    const res = await API.get('/admin/disputes', { params });
    return res.data;
  },
  getDisputeDetails: async (id) => {
    const res = await API.get(`/admin/disputes/${id}`);
    return res.data;
  },
  requestDisputeInfo: async (id, data) => {
    const res = await API.post(`/admin/disputes/${id}/request-info`, data);
    return res.data;
  },
  resolveDispute: async (id, data) => {
    const res = await API.post(`/admin/disputes/${id}/resolve`, data);
    return res.data;
  },
  reopenDispute: async (id, data) => {
    const res = await API.post(`/admin/disputes/${id}/reopen`, data);
    return res.data;
  },
};
