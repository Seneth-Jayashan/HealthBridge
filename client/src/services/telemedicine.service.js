import httpClient from '../api/Axios';

export const createTelemedicineSession = async (payload) => {
  const response = await httpClient.post('/telemedicine/sessions', payload);
  return response.data?.data || response.data;
};

export const getMyTelemedicineSessions = async (query = {}) => {
  const response = await httpClient.get('/telemedicine/sessions/my', { params: query });
  return response.data?.data || response.data;
};

export const getOnlineAppointmentsWithSessions = async (query = {}) => {
  const response = await httpClient.get('/telemedicine/sessions/my/appointments', { params: query });
  return Array.isArray(response.data?.data) ? response.data?.data : (response.data?.data?.appointments || []);
};

export const getTelemedicineSessionById = async (sessionId) => {
  const response = await httpClient.get(`/telemedicine/sessions/${sessionId}`);
  return response.data?.data || response.data;
};

export const getTelemedicineJoinToken = async (sessionId, ttl) => {
  const response = await httpClient.request({
    url: `/telemedicine/sessions/${sessionId}/token`,
    method: 'POST',
    params: ttl ? { ttl } : {}
  });
  return response.data?.data || response.data;
};

export const startTelemedicineSession = async (sessionId) => {
  const response = await httpClient.patch(`/telemedicine/sessions/${sessionId}/start`);
  return response.data?.data || response.data;
};

export const endTelemedicineSession = async (sessionId) => {
  const response = await httpClient.patch(`/telemedicine/sessions/${sessionId}/end`);
  return response.data?.data || response.data;
};

export const updateSessionStatus = async (sessionId, status) => {
  const response = await httpClient.patch(`/telemedicine/sessions/${sessionId}/status`, { status });
  return response.data?.data || response.data;
};