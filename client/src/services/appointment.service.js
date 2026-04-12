import httpClient from '../api/Axios';

// ── Patient endpoints ──────────────────────────────────────────────────────

export const bookAppointment = async (appointmentData) => {
  const response = await httpClient.post('/appointments/book', appointmentData);
  return response.data?.data || response.data;
};

export const getMyAppointments = async () => {
  const response = await httpClient.get('/appointments/my');
  return response.data?.data || response.data;
};

export const getAppointmentStatus = async (id) => {
  const response = await httpClient.get(`/appointments/${id}/status`);
  return response.data?.data || response.data;
};

export const updateAppointment = async (id, updateData) => {
  const response = await httpClient.put(`/appointments/${id}`, updateData);
  return response.data?.data || response.data;
};

export const cancelAppointment = async (id) => {
  const response = await httpClient.delete(`/appointments/${id}`);
  return response.data?.data || response.data;
};

export const searchBySpecialty = async (specialty) => {
  const query = specialty ? `?specialty=${specialty}` : '';
  const response = await httpClient.get(`/appointments/search${query}`);
  return response.data?.data || response.data;
};

// ── Doctor endpoints ───────────────────────────────────────────────────────

export const getDoctorAppointments = async () => {
  const response = await httpClient.get('/appointments/doctor/my');
  return response.data?.data || response.data;
};

export const updateAppointmentStatus = async (id, status, notes = '') => {
  const response = await httpClient.patch(`/appointments/${id}/status`, { status, notes });
  return response.data?.data || response.data;
};