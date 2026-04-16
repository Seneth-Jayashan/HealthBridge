import httpClient from '../api/Axios';

/**
 * Fetch authenticated user's video sessions
 * Sessions are auto-created by backend when payment is completed
 */
export const getMyTelemedicineSessions = async (query = {}) => {
  const response = await httpClient.get('/telemedicine/sessions/my', { params: query });
  return response.data?.data || response.data;
};

/**
 * Fetch authenticated user's online appointments with their associated video sessions
 * PRIMARY ENDPOINT - Use after payment to check if session is ready
 * Returns: { sessions: [], appointments: [] }
 */
export const getOnlineAppointmentsWithSessions = async (query = {}) => {
  const response = await httpClient.get('/telemedicine/sessions/my/appointments', { params: query });
  const data = response.data?.data || response.data;
  return {
    sessions: Array.isArray(data?.sessions) ? data.sessions : [],
    appointments: Array.isArray(data?.appointments) ? data.appointments : []
  };
};

/**
 * Get specific session details
 */
/**
 * Get specific session details
 */
export const getTelemedicineSessionById = async (sessionId) => {
  const response = await httpClient.get(`/telemedicine/sessions/${sessionId}`);
  return response.data?.data || response.data;
};

/**
 * Get Agora RTC token to join video session
 * Must be called before joining the video call
 */
export const getTelemedicineJoinToken = async (sessionId, ttl) => {
  const response = await httpClient.request({
    url: `/telemedicine/sessions/${sessionId}/token`,
    method: 'POST',
    params: ttl ? { ttl } : {}
  });
  return response.data?.data || response.data;
};

/**
 * Start the video session (doctor initiates the call)
 */
export const startTelemedicineSession = async (sessionId) => {
  const response = await httpClient.patch(`/telemedicine/sessions/${sessionId}/start`);
  return response.data?.data || response.data;
};

/**
 * End the video session (doctor terminates the call)
 */
export const endTelemedicineSession = async (sessionId) => {
  const response = await httpClient.patch(`/telemedicine/sessions/${sessionId}/end`);
  return response.data?.data || response.data;
};

/**
 * Update session status (scheduled, active, completed, cancelled)
 */
export const updateSessionStatus = async (sessionId, status) => {
  const response = await httpClient.patch(`/telemedicine/sessions/${sessionId}/status`, { status });
  return response.data?.data || response.data;
};