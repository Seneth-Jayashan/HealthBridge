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
    getDoctorOnlineAppointments
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

export default router;