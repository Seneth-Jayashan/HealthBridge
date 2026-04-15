import httpClient from '../api/Axios';

// ==========================================
// PATIENT ACTIONS
// ==========================================

/**
 * Initializes a new payment and gets the PayHere checkout hash/details.
 * @param {Object} paymentData - { patientId, doctorId, appointmentId, currency }
 */
export const createPayment = async (paymentData) => {
  const response = await httpClient.post('/payments/create', paymentData);
  return response.data?.data || response.data;
};

/**
 * Gets the payment status by the generated Order ID (e.g., ORD-0001).
 * @param {string} orderId 
 */
export const getPaymentStatus = async (orderId) => {
  const response = await httpClient.get(`/payments/status/${orderId}`);
  return response.data?.data || response.data;
};


/**
 * Gets all payments for the currently logged-in patient.
 */
export const getMyPayments = async () => {
  const response = await httpClient.get('/payments/my-payments');
  return response.data?.data || response.data;
};


// ==========================================
// DOCTOR ACTIONS
// ==========================================

/**
 * Gets all payments belonging to the currently logged-in doctor.
 */
export const getMyDoctorPayments = async () => {
  const response = await httpClient.get('/payments/doctor/payments');
  return response.data?.data || response.data;
};


// ==========================================
// ADMIN ACTIONS
// ==========================================

export const getAllPayments = async () => {
  const response = await httpClient.get('/payments');
  return response.data?.data || response.data;
};

export const getPaymentById = async (id) => {
  const response = await httpClient.get(`/payments/${id}`);
  return response.data?.data || response.data;
};

export const getPaymentsForPatient = async (patientId) => {
  const response = await httpClient.get(`/payments/patient/${patientId}`);
  return response.data?.data || response.data;
};

export const getPaymentsForDoctor = async (doctorId) => {
  const response = await httpClient.get(`/payments/doctor/${doctorId}`);
  return response.data?.data || response.data;
};

export const getAdminPaymentStatusByOrderId = async (orderId) => {
  const response = await httpClient.get(`/payments/status/order/${orderId}`);
  return response.data?.data || response.data;
};

// -----------------------------------------
// ALL USERS (PATIENTS, DOCTORS & ADMIN) CAN ACCESS THESE ENDPOINTS
// -----------------------------------------

/**
 * Gets the payment status specifically for a booked appointment.
 * @param {string} appointmentId 
 */
export const getAppointmentPaymentStatus = async (appointmentId) => {
  const response = await httpClient.get(`/payments/appointment-status/${appointmentId}`);
  return response.data?.data || response.data;
};