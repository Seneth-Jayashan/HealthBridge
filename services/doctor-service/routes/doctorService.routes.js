import express from 'express';
import { 
    getDoctorProfile, 
    updateDoctorProfile, 
    verifyDoctor,
    getAllDoctors
} from '../controllers/doctorService.controller.js';
import { requireAuth, requireRole } from '@healthbridge/shared';

const router = express.Router();

// ── Any logged in user ────────────────────────────────
router.get('/all', requireAuth, getAllDoctors);

// ── Admin only ────────────────────────────────────────
router.put('/admin/verify/:userId', requireAuth, requireRole('Admin'), verifyDoctor);

// ── Doctor only ───────────────────────────────────────
router.get('/profile', requireAuth, requireRole('Doctor'), getDoctorProfile);
router.put('/profile', requireAuth, requireRole('Doctor'), updateDoctorProfile);

export default router;