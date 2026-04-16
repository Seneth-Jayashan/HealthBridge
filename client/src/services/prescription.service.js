import httpClient from '../api/Axios';

// -----------------------------------------
// --------  PATIENT RELATED ACTIONS --------
// -----------------------------------------

// --- View Prescriptions ---
export const getMyPrescriptions = async () => {
  const response = await httpClient.get('/patients/prescriptions');
  console.log("Received prescriptions response:", response.data);
  return response.data?.data || response.data;
};

export const getPrescriptionByIdForPatient = async (id) => {
  const response = await httpClient.get(`/patients/prescriptions/${id}`);
  return response.data?.data || response.data;
};

// --- Manage Prescriptions ---
export const deletePrescriptionForPatient = async (id) => {
  const response = await httpClient.delete(`/patients/prescriptions/${id}`);
  return response.data?.data || response.data;
};


// -----------------------------------------
// --------  DOCTOR RELATED ACTIONS --------
// -----------------------------------------

// --- View Prescriptions ---
export const getPrescriptionsForPatientByDoctor = async (patientId) => {
  const response = await httpClient.get('/patients/prescriptions/doctor/', { params: { patientId } });
  return response.data?.data || response.data;
};

export const getAllMyIssuedPrescriptions = async () => {
  const response = await httpClient.get('/patients/prescriptions/doctor/all');
  return response.data?.data || response.data;
};

export const getPrescriptionByIdForDoctor = async (id) => {
  const response = await httpClient.get(`/patients/prescriptions/doctor/${id}`);
  return response.data?.data || response.data;
};

// --- Manage Prescriptions ---
export const createPrescription = async (prescriptionData) => {
  const response = await httpClient.post('/patients/prescriptions/doctor/', prescriptionData);
  return response.data?.data || response.data;
};

export const updatePrescription = async (id, prescriptionData) => {
  const response = await httpClient.put(`/patients/prescriptions/doctor/${id}`, prescriptionData);
  return response.data?.data || response.data;
};

export const deletePrescriptionForDoctor = async (id) => {
  const response = await httpClient.delete(`/patients/prescriptions/doctor/${id}`);
  return response.data?.data || response.data;
};