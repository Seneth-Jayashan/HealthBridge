import express from 'express';
import {
    bookAppointment,
    searchBySpecialty,
    getMyAppointments,
    getAppointmentStatus,
    getDoctorAppointments,
    modifyAppointment,
    cancelAppointment,
    updateAppointmentStatus,
    getPatientOnlineAppointments,
    getDoctorOnlineAppointments,
    getPatientOnlineAppointmentsInternal,
    getDoctorOnlineAppointmentsInternal,
    getAllOnlineAppointmentsInternal
} from '../controllers/appointment.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// ─── Patient routes ────────────────────────────────────
router.post('/book', verifyToken, bookAppointment);
router.get('/search', verifyToken, searchBySpecialty);
router.get('/my', verifyToken, getMyAppointments);
router.get('/my/online', verifyToken, getPatientOnlineAppointments);
router.get('/:id/status', verifyToken, getAppointmentStatus);
router.put('/:id', verifyToken, modifyAppointment);
router.delete('/:id', verifyToken, cancelAppointment);

// ─── Doctor routes ─────────────────────────────────────
router.get('/doctor/my', verifyToken, getDoctorAppointments);
router.get('/doctor/my/online', verifyToken, getDoctorOnlineAppointments);
router.patch('/:id/status', verifyToken, updateAppointmentStatus);

// ─── [INTERNAL API] Routes for service-to-service communication ──
// These endpoints are called by the telemedicine service with service-to-service authentication
router.get('/internal/patient/online/:userId', getPatientOnlineAppointmentsInternal);
router.get('/internal/doctor/online/:userId', getDoctorOnlineAppointmentsInternal);
router.get('/internal/appointments/online', getAllOnlineAppointmentsInternal);

export default router;