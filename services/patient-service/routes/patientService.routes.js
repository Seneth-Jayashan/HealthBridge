import express from 'express';
import { 
    getPatientProfile, 
    updatePatientProfile,
    uploadMedicalReport,
    deleteMedicalReport,
    getIsProfileUpdated // <-- 1. Added new controller import
} from '../controllers/patientService.controller.js';
import { requireAuth, requireRole, createUploadMiddleware } from '@healthbridge/shared';

const router = express.Router();

// Configure File Upload Middleware
const uploadReport = createUploadMiddleware(
    'medical_reports', 
    ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], 
    10 
);

// Global Route Protection
router.use(requireAuth, requireRole('Patient'));

// --- Profile Routes ---
router.route('/profile')
    .get(getPatientProfile)
    .put(updatePatientProfile);

// --- NEW: Profile Status Route ---
router.route('/profile/status')
    .get(getIsProfileUpdated); // <-- 2. Added new route

// --- Medical Report Routes ---
router.route('/reports')
    .post(uploadReport.single('reportFile'), uploadMedicalReport);

router.route('/reports/:reportId')
    .delete(deleteMedicalReport);

export default router;