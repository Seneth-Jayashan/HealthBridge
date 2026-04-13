import express from 'express';
import { 
    addOrUpdateDoctorReview, 
    deleteDoctorReview 
} from '../controllers/patient.doctor.controller.js';
import { requireAuth, requireRole } from '@healthbridge/shared';

const router = express.Router({ mergeParams: true });

// ==========================================
// GLOBAL ROUTE PROTECTION
// ==========================================
// Only verified Patients can leave reviews
router.use(requireAuth, requireRole('Patient'));

// --- Doctor Review Routes ---

router.route('/:doctorId/reviews')
    .post(addOrUpdateDoctorReview)
    .delete(deleteDoctorReview);

export default router;