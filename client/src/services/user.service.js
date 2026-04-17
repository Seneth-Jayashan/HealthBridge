import httpClient from "../api/Axios";

export const getUserProfile = async () => {
  const response = await httpClient.get('/auth/users/profile');
  return response.data?.data || response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await httpClient.put('/auth/users/profile', profileData);
  return response.data?.data || response.data;
};

export const changeUserPassword = async (passwordData) => {
  const response = await httpClient.put('/auth/users/change-password', passwordData);
  return response.data?.data || response.data;
};

// For Admin: Get any user by ID
export const getAllUsers = async () => {
  const response = await httpClient.get(`/auth/users/all`);
  return response.data?.data || response.data;
};

export const getUserById = async (userId) => {
  const response = await httpClient.get(`/auth/users/${userId}`);
  return response.data?.data || response.data;
}

// For Patients: Get Doctor Profile by ID
export const getDoctorById = async (doctorId) => {
  const response = await httpClient.get(`/auth/users/doctors/${doctorId}`);
  return response.data?.data || response.data;
};

// For Doctors: Get Patient Profile by ID
export const getPatientById = async (patientId) => {
  const response = await httpClient.get(`/auth/users/patients/${patientId}`);
  return response.data?.data || response.data;
};