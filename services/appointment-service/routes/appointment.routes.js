import express from 'express';
import {
    bookAppointment,
    searchBySpecialty,
    getMyAppointments,
    getAppointmentStatus,
    modifyAppointment,
    cancelAppointment,
    updateAppointmentStatus
} from '../controllers/appointment.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// ─── Patient routes ────────────────────────────────────
router.post('/book', verifyToken, bookAppointment);
router.get('/search', verifyToken, searchBySpecialty);
router.get('/my', verifyToken, getMyAppointments);
router.get('/:id/status', verifyToken, getAppointmentStatus);
router.put('/:id', verifyToken, modifyAppointment);
router.delete('/:id', verifyToken, cancelAppointment);

// ─── Doctor routes ─────────────────────────────────────
router.patch('/:id/status', verifyToken, updateAppointmentStatus);

export default router;