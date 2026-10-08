import API from './api';

export const safetyService = {
  getMySafetyStatus: async () => {
    const res = await API.get('/safety/my-safety-status');
    return res.data;
  },
  submitStudentVerification: async (data) => {
    const res = await API.post('/safety/student-verify', data);
    return res.data;
  },
  requestGuardianOtp: async (data) => {
    const res = await API.post('/safety/guardian/request-otp', data);
    return res.data;
  },
  verifyGuardianOtp: async (data) => {
    const res = await API.post('/safety/guardian/verify-otp', data);
    return res.data;
  },
  submitKycVerification: async (data) => {
    const res = await API.post('/safety/kyc-verify', data);
    return res.data;
  },
  startWorkSession: async (data) => {
    const res = await API.post('/safety/work-session/start', data);
    return res.data;
  },
  endWorkSession: async () => {
    const res = await API.post('/safety/work-session/end');
    return res.data;
  },
  triggerEmergencySos: async (data) => {
    const res = await API.post('/safety/sos', data);
    return res.data;
  },
};
