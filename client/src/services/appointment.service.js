import httpClient from '../api/Axios';

// ── Appointment calls ──────────────────────────────────
export const bookAppointmentRequest = async (payload) => {
  const response = await httpClient.post('/appointments/book', payload);
  return response.data?.data || response.data;
};

export const getMyAppointmentsRequest = async () => {
  const response = await httpClient.get('/appointments/my');
  return response.data?.data || response.data;
};

export const cancelAppointmentRequest = async (id) => {
  const response = await httpClient.delete(`/appointments/${id}`);
  return response.data?.data || response.data;
};

export const modifyAppointmentRequest = async (id, payload) => {
  const response = await httpClient.put(`/appointments/${id}`, payload);
  return response.data?.data || response.data;
};

// ── Doctor calls (used in booking page) ───────────────
export const getAllDoctorsRequest = async (specialization = '') => {
  const query = specialization ? `?specialization=${specialization}` : '';
  const response = await httpClient.get(`/doctor/all${query}`);
  return response.data?.data || response.data;
};