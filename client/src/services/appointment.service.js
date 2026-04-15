import httpClient from '../api/Axios';

// Patient: Book appointment
// payload: {
//   doctorId, appointmentDate, timeSlot, reason?, notes?
// }
export const bookAppointmentRequest = async (payload) => {
  const response = await httpClient.post('/appointments/book', payload);
  return response.data?.data || response.data;
};

// Patient: Get my appointments
export const getMyAppointmentsRequest = async () => {
  const response = await httpClient.get('/appointments/my');
  const payload = response.data?.data || response.data;
  return Array.isArray(payload) ? payload : (payload?.appointments || []);
};

// Patient: Cancel appointment (only pending allowed)
export const cancelAppointmentRequest = async (id) => {
  const response = await httpClient.delete(`/appointments/${id}`);
  return response.data?.data || response.data;
};

// Patient: Modify appointment (only pending allowed)
// payload: { reason?, notes? }
export const modifyAppointmentRequest = async (id, payload) => {
  const response = await httpClient.put(`/appointments/${id}`, payload);
  return response.data?.data || response.data;
};

// Patient/Doctor: Get status of a specific appointment
export const getAppointmentStatusRequest = async (id) => {
  const response = await httpClient.get(`/appointments/${id}/status`);
  return response.data?.data || response.data;
};

// Doctor: Get my appointments
export const getDoctorAppointmentsRequest = async () => {
  const response = await httpClient.get('/appointments/doctor/my');
  const payload = response.data?.data || response.data;
  return Array.isArray(payload) ? payload : (payload?.appointments || []);
};

// Doctor: Update appointment status
// allowed transitions by backend:
// pending -> confirmed/rejected
// confirmed -> completed
export const updateAppointmentStatusRequest = async (id, status) => {
  const response = await httpClient.patch(`/appointments/${id}/status`, { status });
  return response.data?.data || response.data;
};

// Patient: Search doctors by specialty through appointment search endpoint (optional use)
export const searchDoctorsBySpecialtyRequest = async (specialty = '') => {
  const params = specialty ? { specialty } : {};
  const response = await httpClient.get('/appointments/search', { params });
  const payload = response.data?.data || response.data;
  return Array.isArray(payload) ? payload : (payload?.doctors || []);
};

// Get all verified doctors from doctor-service
export const getAllDoctorsRequest = async (specialization = '') => {
  const params = specialization ? { specialization } : {};
  const response = await httpClient.get('/doctors', { params });
  const payload = response.data?.data || response.data;
  return Array.isArray(payload) ? payload : (payload?.doctors || []);
};