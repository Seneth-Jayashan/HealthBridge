import httpClient from '../api/Axios';

export const getPlatformUsers = async () => {
  const response = await httpClient.get('/auth/admin/users');
  return response.data?.data || response.data;
};

export const getAdminDashboardMetrics = async () => {
  const users = await getPlatformUsers();
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const totalPatients = users.filter((user) => user.role === 'Patient').length;
  const totalDoctors = users.filter((user) => user.role === 'Doctor').length;
  const totalAdmins = users.filter((user) => user.role === 'Admin').length;

  return {
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAdmins,
  };
};


// -----------------------------------------
// --------  DOCTOR RELATED ACTIONS --------
// -----------------------------------------

export const getAllDoctors = async (params) => {
  const response = await httpClient.get('/doctor/admin', { params });
  return response.data?.data || response.data;
};

export const getDoctorDetails = async (doctorId) => {
  const response = await httpClient.get(`/doctor/admin/${doctorId}`);
  return response.data?.data || response.data;
};

export const verifyDoctor = async (doctorId, action) => {
  const response = await httpClient.patch(`/doctor/admin/${doctorId}/verify`, { verificationStatus: action });
  return response.data?.data || response.data;
};
