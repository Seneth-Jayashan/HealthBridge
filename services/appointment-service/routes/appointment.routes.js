import express from 'express';
import { requireAuth, requireRole } from '@healthbridge/shared';
import {
  getDoctorAvailabilityForBooking,
  createAppointment,
  getMyAppointments,
  cancelAppointmentByPatient,
  updateAppointmentByPatient,
  getDoctorAppointments,
  doctorDecision,
  getPatientOnlineAppointmentsInternal,
  getDoctorOnlineAppointmentsInternal,
  getAllOnlineAppointmentsInternal,
  updatePaymentStatusInternal,
  getAppointmentByIdInternal
} from '../controllers/appointment.controller.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'Appointment routes healthy' });
});

// Patient browsing availability (proxy to doctor-service internal)
router.get('/doctors/:doctorId/availability', requireAuth, getDoctorAvailabilityForBooking);

// Patient appointment actions
router.post('/appointments', requireAuth, requireRole('Patient'), createAppointment);
router.get('/appointments/mine', requireAuth, requireRole('Patient'), getMyAppointments);
router.post('/appointments/:id/cancel', requireAuth, requireRole('Patient'), cancelAppointmentByPatient);
router.patch('/appointments/:id', requireAuth, requireRole('Patient'), updateAppointmentByPatient);

// Doctor appointment actions
router.get('/appointments/doctor', requireAuth, requireRole('Doctor'), getDoctorAppointments);
router.post('/appointments/:id/decision', requireAuth, requireRole('Doctor'), doctorDecision);


// ─── [INTERNAL API] Routes for service-to-service communication ──
// These endpoints are called by the telemedicine service with service-to-service authentication
router.get('/internal/patient/online/:userId', getPatientOnlineAppointmentsInternal);
router.get('/internal/doctor/online/:userId', getDoctorOnlineAppointmentsInternal);
router.get('/internal/appointments/online', getAllOnlineAppointmentsInternal);
router.get('/internal/appointments/:appointmentId', getAppointmentByIdInternal);

// payment status update endpoint 
router.post('/internal/confirm/:appointmentId', updatePaymentStatusInternal);


export default router;