import express from 'express';
import { 
    addOrUpdateDoctorReview, 
    deleteDoctorReview,
    getDoctorByIdForPatient,
    addToPatientList
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

    
// --- Doctor Profile Route ---
router.route('/:doctorId')
    .get(getDoctorByIdForPatient);

// --- Add Patient to Doctor's List ---
router.route('/internal/add-to-patient-list')
    .post(addToPatientList);

export default router;