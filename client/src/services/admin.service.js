import httpClient from '../api/Axios';

// -----------------------------------------
// --------  USER & AUTH RELATED ACTIONS ---
// -----------------------------------------

export const getPlatformUsers = async () => {
  const response = await httpClient.get('/auth/users/all');
  return response.data?.data || response.data;
};

// NEW: Update a user's details (Name, Phone, etc.)
export const updatePlatformUser = async (userId, data) => {
  const response = await httpClient.put(`/auth/users/${userId}`, data);
  return response.data?.data || response.data;
};

// NEW: Delete a user entirely from the platform
export const deletePlatformUser = async (userId) => {
  const response = await httpClient.delete(`/auth/users/${userId}`);
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