import httpClient from '../api/Axios';

const unwrapPayload = (response) => response?.data?.data ?? response?.data;

const toArray = (value) => (Array.isArray(value) ? value : []);

const requestWithPathFallback = async (primaryRequest, fallbackRequest) => {
  try {
    return await primaryRequest();
  } catch (err) {
    if (err?.response?.status !== 404 || !fallbackRequest) throw err;
    return fallbackRequest();
  }
};

// Patient: Fetch a doctor's available week days + time slots (sanitized)
export const getDoctorAvailabilityRequest = async (doctorId) => {
  // This endpoint lives under appointment-service (proxied at /api/appointments)
  const response = await httpClient.get(`/appointments/doctors/${doctorId}/availability`);
  return toArray(unwrapPayload(response));
};

// Patient: Create appointment (Pending)
// payload: {
//   doctorId,
//   dayOfWeek,
//   timeSlotId,
//   startTime,
//   endTime,
//   patientPhone?,
//   reason?,
//   notes?
// }
export const bookAppointmentRequest = async (payload) => {
  const response = await requestWithPathFallback(
    () => httpClient.post('/appointments/appointments', payload),
    () => httpClient.post('/appointments', payload)
  );
  return unwrapPayload(response);
};

// Patient: Get my appointments
export const getMyAppointmentsRequest = async () => {
  const response = await requestWithPathFallback(
    () => httpClient.get('/appointments/appointments/mine'),
    () => httpClient.get('/appointments/mine')
  );
  const payload = unwrapPayload(response);
  return Array.isArray(payload) ? payload : toArray(payload?.appointments);
};

// Patient: Cancel appointment (only Pending allowed)
export const cancelAppointmentRequest = async (id) => {
  const response = await requestWithPathFallback(
    () => httpClient.post(`/appointments/appointments/${id}/cancel`),
    () => httpClient.post(`/appointments/${id}/cancel`)
  );
  return unwrapPayload(response);
};

// Patient: Edit own pending appointment (reason/notes/phone)
export const updateAppointmentRequest = async (id, payload) => {
  const response = await requestWithPathFallback(
    () => httpClient.patch(`/appointments/appointments/${id}`, payload),
    () => httpClient.patch(`/appointments/${id}`, payload)
  );
  return unwrapPayload(response);
};

// Doctor: Get appointments for doctorId
export const getDoctorAppointmentsRequest = async (doctorId) => {
  const response = await requestWithPathFallback(
    () => httpClient.get('/appointments/appointments/doctor', { params: { doctorId } }),
    () => httpClient.get('/appointments/doctor', { params: { doctorId } })
  );
  const payload = unwrapPayload(response);
  return Array.isArray(payload) ? payload : toArray(payload?.appointments);
};

// Doctor: Accept/Reject a pending appointment
// decision: 'accept' | 'reject'
export const doctorDecisionRequest = async (id, { decision, doctorId, note } = {}) => {
  const response = await requestWithPathFallback(
    () => httpClient.post(`/appointments/appointments/${id}/decision`, { decision, doctorId, note }),
    () => httpClient.post(`/appointments/${id}/decision`, { decision, doctorId, note })
  );
  return unwrapPayload(response);
};

// Back-compat: old function name used "status"
// Maps to accept/reject only (online-only flow).
export const updateAppointmentStatusRequest = async (id, status, extra = {}) => {
  const normalized = String(status || '').toLowerCase();
  const decision = normalized === 'accepted' || normalized === 'confirm' || normalized === 'confirmed'
    ? 'accept'
    : normalized === 'rejected' || normalized === 'reject'
      ? 'reject'
      : null;

  if (!decision) {
    throw new Error("Only 'Accepted' or 'Rejected' are supported by the new backend.");
  }

  return doctorDecisionRequest(id, { decision, ...extra });
};

// Get all verified doctors from doctor-service
export const getAllDoctorsRequest = async (specialization = '') => {
  const params = specialization ? { specialization } : {};
  try {
    const response = await httpClient.get('/doctors', { params });
    const payload = unwrapPayload(response);
    return Array.isArray(payload) ? payload : toArray(payload?.doctors);
  } catch (err) {
    // Compatibility fallback for environments still exposing singular /doctor.
    if (err?.response?.status !== 404) throw err;
    const response = await httpClient.get('/doctor', { params });
    const payload = unwrapPayload(response);
    return Array.isArray(payload) ? payload : toArray(payload?.doctors);
  }
};