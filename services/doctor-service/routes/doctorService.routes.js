import express from 'express';
import {
    getVerifiedDoctors,
    getDoctorProfile,
    updateDoctorProfile,
    uploadVerificationDocument,
    updateDoctorAvailability,
    getDoctorAvailability
} from '../controllers/doctorService.controller.js'; // Adjust path if your filename differs
import { requireAuth, requireRole, createUploadMiddleware } from '@healthbridge/shared';

const router = express.Router();

// Configure File Upload Middleware for Verification Documents (e.g., Medical Licenses)
const uploadVerification = createUploadMiddleware(
    'doctor_verifications', 
    ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], 
    5 // 5MB limit is generally sufficient for ID/License uploads
);

// ==========================================
// PUBLIC ROUTES (Accessible by any authenticated user)
// ==========================================

// Patients need to access this route to search for doctors to book
router.route('/')
    .get(requireAuth, getVerifiedDoctors);


// ==========================================
// PRIVATE ROUTES (Accessible ONLY by Doctors)
// ==========================================

// Apply Doctor role protection to all subsequent routes in this file
router.use(requireAuth, requireRole('Doctor'));

// --- Profile Routes ---
router.route('/profile')
    .get(getDoctorProfile)
    .put(updateDoctorProfile);

// --- Availability Route ---
router.route('/availability')
    .get(getDoctorAvailability)
    .patch(updateDoctorAvailability);

// --- Verification Document Route ---
// Note: The frontend must send the file using the form-data key: 'documentFile'
router.route('/verification-document')
    .post(uploadVerification.single('documentFile'), uploadVerificationDocument);

export default router;