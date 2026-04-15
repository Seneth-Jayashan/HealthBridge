import httpClient from '../api/Axios';

export const bookAppointmentRequest = async (payload) => {
  const response = await httpClient.post('/appointments/book', payload);
  return response.data?.data || response.data;
};

export const getMyAppointmentsRequest = async () => {
  const response = await httpClient.get('/appointments/my');
  const payload = response.data?.data || response.data;
  return Array.isArray(payload) ? payload : (payload?.appointments || []);
};

export const cancelAppointmentRequest = async (id) => {
  const response = await httpClient.delete(`/appointments/${id}`);
  return response.data?.data || response.data;
};

export const modifyAppointmentRequest = async (id, payload) => {
  const response = await httpClient.put(`/appointments/${id}`, payload);
  return response.data?.data || response.data;
};

// GET /api/doctor → proxied to doctor-service GET /
// Backend returns: { data: { doctors: [...], pagination: {} } }
export const getAllDoctorsRequest = async (specialization = '') => {
  const params = specialization ? { specialization } : {};
  const response = await httpClient.get('/doctor', { params });
  const payload = response.data?.data || response.data;
  return Array.isArray(payload) ? payload : (payload?.doctors || []);
};