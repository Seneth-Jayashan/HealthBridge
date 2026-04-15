import express from 'express';
import { requireAuth, requireRole } from '@healthbridge/shared';
import {
  getDoctorAvailabilityForBooking,
  createAppointment,
  getMyAppointments,
  cancelAppointmentByPatient,
  getDoctorAppointments,
  doctorDecision,
    getPatientOnlineAppointments,
    getDoctorOnlineAppointments,
    getPatientOnlineAppointmentsInternal,
    getDoctorOnlineAppointmentsInternal,
    getAllOnlineAppointmentsInternal
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

// Doctor appointment actions
router.get('/appointments/doctor', requireAuth, requireRole('Doctor'), getDoctorAppointments);
router.post('/appointments/:id/decision', requireAuth, requireRole('Doctor'), doctorDecision);

export default router;
// ─── Patient routes ────────────────────────────────────
router.get('/my/online', verifyToken, getPatientOnlineAppointments);

// ─── Doctor routes ─────────────────────────────────────
router.get('/doctor/my/online', verifyToken, getDoctorOnlineAppointments);
router.patch('/:id/status', verifyToken, updateAppointmentStatus);

// ─── [INTERNAL API] Routes for service-to-service communication ──
// These endpoints are called by the telemedicine service with service-to-service authentication
router.get('/internal/patient/online/:userId', getPatientOnlineAppointmentsInternal);
router.get('/internal/doctor/online/:userId', getDoctorOnlineAppointmentsInternal);
router.get('/internal/appointments/online', getAllOnlineAppointmentsInternal);

export default router;
