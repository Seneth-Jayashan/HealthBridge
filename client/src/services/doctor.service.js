import httpClient from '../api/Axios';

// Base URL path for the doctor microservice (adjust if your gateway uses something else like '/api/doctor')
const DOCTOR_API = '/doctors';

/**
 * Get Doctor Dashboard (Existing)
 */
export const getDoctorDashboard = async () => {
  const response = await httpClient.get(`${DOCTOR_API}/profile`);
  return response.data?.data || response.data;
};

/**
 * Get all verified doctors (Used by Patients to search/filter)
 * @param {Object} params - Query params (e.g., { specialization: 'Cardiology', page: 1, limit: 10 })
 */
export const getVerifiedDoctors = async (params = {}) => {
  const response = await httpClient.get(DOCTOR_API, { params });
  return response.data?.data || response.data;
};

/**
 * Get the currently logged-in doctor's profile
 */
export const getDoctorProfile = async () => {
  const response = await httpClient.get(`${DOCTOR_API}/profile`);
  return response.data?.data || response.data;
};

/**
 * Create or Update the doctor's profile
 * @param {Object} profileData - The doctor's profile details
 */
export const updateDoctorProfile = async (profileData) => {
  const response = await httpClient.put(`${DOCTOR_API}/profile`, profileData);
  return response.data?.data || response.data;
};

/**
 * Update the doctor's availability specifically
 * @param {Array} availability - Array of availability objects
 */
export const updateAvailability = async (availability) => {
  const response = await httpClient.patch(`${DOCTOR_API}/availability`, { availability });
  return response.data?.data || response.data;
};


/**
 * Get the doctor's availability schedule
 */
export const getDoctorAvailability = async () => {
  const response = await httpClient.get(`${DOCTOR_API}/availability`);
  return response.data?.data || response.data;
};

/**
 * Upload a verification document (e.g., Medical License)
 * @param {File} file - The actual file object from an <input type="file" />
 * @param {String} documentType - e.g., "Medical License"
 */
export const uploadVerificationDocument = async (file, documentType) => {
  // Since we are sending a file, we MUST use FormData
  const formData = new FormData();
  
  // 'documentFile' matches the expected field name in your multer upload middleware
  formData.append('documentFile', file); 
  formData.append('documentType', documentType);

  const response = await httpClient.post(`${DOCTOR_API}/verification-document`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data?.data || response.data;
};

export const getPatientListForDoctor = async () => {
  const response = await httpClient.get(`${DOCTOR_API}/patients-list`);
  return response.data?.data || response.data;
};

export const removePatientFromDoctorList = async (patientId) => {
  const response = await httpClient.post(`${DOCTOR_API}/patients-list/remove`, { patientId });
  return response.data?.data || response.data;
};


// -----------------------------------------
// --- PATIENT-SPECIFIC DOCTOR ENDPOINTS ---
// -----------------------------------------
export const getPatientByIdForDoctor = async (patientId) => {
  const response = await httpClient.get(`/patients/doctor/patients/${patientId}`);
  return response.data?.data || response.data;
};

export const uploadMedicalReportForPatient = async (patientId, file) => {
  const formData = new FormData();
  formData.append('reportFile', file);
  const response = await httpClient.post(`/patients/doctor/patients/${patientId}/reports`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.data || response.data;
};

export const deleteMedicalReportForPatient = async (patientId, reportId) => {
  const response = await httpClient.delete(`/patients/doctor/patients/${patientId}/reports/${reportId}`);
  return response.data?.data || response.data;
}

export const getMedicalReportsForPatient = async (patientId) => {
  const response = await httpClient.get(`/patients/doctor/patients/${patientId}/reports`);
  return response.data?.data || response.data;
};