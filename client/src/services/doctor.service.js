import httpClient from '../api/Axios';

const DOCTOR_API = '/doctor'; // gateway route is /api/doctor → doctor-service GET /

export const getDoctorDashboard = async () => {
  const response = await httpClient.get('/doctor/dashboard');
  return response.data?.data || response.data;
};

// GET /api/doctor — patients use this to browse verified doctors
export const getVerifiedDoctors = async (params = {}) => {
  const response = await httpClient.get(DOCTOR_API, { params });
  return response.data?.data || response.data;
};

export const getDoctorProfile = async () => {
  const response = await httpClient.get(`${DOCTOR_API}/profile`);
  return response.data?.data || response.data;
};

export const updateDoctorProfile = async (profileData) => {
  const response = await httpClient.put(`${DOCTOR_API}/profile`, profileData);
  return response.data?.data || response.data;
};

export const updateAvailability = async (availability) => {
  const response = await httpClient.patch(`${DOCTOR_API}/availability`, { availability });
  return response.data?.data || response.data;
};

export const uploadVerificationDocument = async (file, documentType) => {
  const formData = new FormData();
  formData.append('documentFile', file);
  formData.append('documentType', documentType);
  const response = await httpClient.post(`${DOCTOR_API}/verification-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data?.data || response.data;
};