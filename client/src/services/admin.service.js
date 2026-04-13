import httpClient from '../api/Axios';

export const getAdminDashboard = async () => {
  const response = await httpClient.get('/auth/admin/users');
  return response.data?.data || response.data;
};


// -----------------------------------------
// --------  DOCTOR RELATED ACTIONS --------
// -----------------------------------------

export const getAllDoctors = async (params) => {
  const response = await httpClient.get('/doctors/admin', { params });
  return response.data?.data || response.data;
};

export const getDoctorDetails = async (doctorId) => {
  const response = await httpClient.get(`/doctors/admin/${doctorId}`);
  return response.data?.data || response.data;
};

export const verifyDoctor = async (doctorId, action) => {
  const response = await httpClient.patch(`/doctors/admin/${doctorId}/verify`, { verificationStatus: action });
  return response.data?.data || response.data;
};
