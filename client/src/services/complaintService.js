import API from './api';

export const complaintService = {
  // Create a new complaint
  createComplaint: async (complaintData) => {
    const response = await API.post('/complaints', complaintData);
    return response.data;
  },

  // Get current user's submitted and received complaints
  getMyComplaints: async (params = {}) => {
    const response = await API.get('/complaints/my-complaints', { params });
    return response.data;
  },

  // Get complaints for manager / support dashboard
  getManagerComplaints: async (params = {}) => {
    const response = await API.get('/complaints/manager-dashboard', { params });
    return response.data;
  },

  // Get single complaint details
  getComplaintById: async (id) => {
    const response = await API.get(`/complaints/${id}`);
    return response.data;
  },

  // Acknowledge complaint
  acknowledgeComplaint: async (id) => {
    const response = await API.put(`/complaints/${id}/acknowledge`);
    return response.data;
  },

  // Update complaint status / investigation
  updateInvestigation: async (id, payload) => {
    const response = await API.put(`/complaints/${id}/investigate`, payload);
    return response.data;
  },

  // Resolve complaint
  resolveComplaint: async (id, resolutionData) => {
    const response = await API.put(`/complaints/${id}/resolve`, resolutionData);
    return response.data;
  },

  // Escalate complaint
  escalateComplaint: async (id, escalationData) => {
    const response = await API.put(`/complaints/${id}/escalate`, escalationData);
    return response.data;
  },

  // Reopen complaint
  reopenComplaint: async (id, reopenData) => {
    const response = await API.put(`/complaints/${id}/reopen`, reopenData);
    return response.data;
  },

  // Submit additional evidence
  addEvidence: async (id, evidenceData) => {
    const response = await API.post(`/complaints/${id}/evidence`, evidenceData);
    return response.data;
  },
};

export default complaintService;
