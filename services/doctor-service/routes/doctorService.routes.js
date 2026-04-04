import express from 'express';
import { getDoctorProfile, updateDoctorProfile, verifyDoctor } from '../controllers/doctorService.controller.js';
import { requireAuth, requireRole } from '@healthbridge/shared';

const router = express.Router();

// --- ADMIN ROUTES ---
// Must go BEFORE the generic router.use() block so it doesn't get caught in the Doctor role check
router.put('/admin/verify/:userId', requireAuth, requireRole('Admin'), verifyDoctor);

// These routes require the user to be logged in AND have the 'Doctor' role
router.use(requireAuth, requireRole('Doctor'));

router.route('/profile')
    .get(getDoctorProfile)
    .put(updateDoctorProfile);

export default router;