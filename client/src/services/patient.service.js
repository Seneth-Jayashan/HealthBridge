import httpClient from '../api/Axios';

// --- Dashboard ---
export const getPatientDashboard = async () => {
  const response = await httpClient.get('/patients/dashboard');
  return response.data?.data || response.data;
};

// --- Profile Management ---
export const getPatientProfile = async () => {
  const response = await httpClient.get('/patients/profile');
  return response.data?.data || response.data;
};

export const updatePatientProfile = async (profileData) => {
  const response = await httpClient.put('/patients/profile', profileData);
  return response.data?.data || response.data;
};

// NEW: Fetch just the profile update status
export const getIsProfileUpdated = async () => {
  const response = await httpClient.get('/patients/profile/status');
  return response.data?.data || response.data;
};

// --- Medical Reports ---
/**
 * Uploads a medical report.
 * @param {FormData} formData - Must be a FormData object containing the 'reportFile' and text fields.
 */
export const uploadMedicalReport = async (formData) => {
  const response = await httpClient.post('/patients/reports', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.data || response.data;
};

export const deleteMedicalReport = async (reportId) => {
  const response = await httpClient.delete(`/patients/reports/${reportId}`);
  return response.data?.data || response.data;
};