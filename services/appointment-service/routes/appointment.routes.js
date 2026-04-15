import express from 'express';
import {
  bookAppointment,
  searchBySpecialty,
  getMyAppointments,
  getAppointmentStatus,
  getDoctorAppointments,
  modifyAppointment,
  cancelAppointment,
  updateAppointmentStatus
} from '../controllers/appointment.controller.js';
import { requireAuth, requireRole } from '@healthbridge/shared'; // ✅ Change this

const router = express.Router();

// Protect all routes with authentication
router.use(requireAuth);

// ─── Doctor routes (keep before /:id routes to avoid conflicts) ───────────────
router.get('/doctor/my', requireRole('Doctor'), getDoctorAppointments);
router.patch('/:id/status', requireRole('Doctor'), updateAppointmentStatus);

// ─── Patient routes ────────────────────────────────────────────────────────────
router.post('/book', bookAppointment);
router.get('/search', searchBySpecialty);
router.get('/my', getMyAppointments);
router.get('/:id/status', getAppointmentStatus);
router.put('/:id', modifyAppointment);
router.delete('/:id', cancelAppointment);

export default router;