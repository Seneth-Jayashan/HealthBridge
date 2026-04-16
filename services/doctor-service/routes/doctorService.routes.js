import express from 'express';
import {
    getVerifiedDoctors,
    getDoctorProfile,
    updateDoctorProfile,
    uploadVerificationDocument,
    updateDoctorAvailability,
    getDoctorAvailability,
    checkConsultationFee,
    getDoctorByUserIdInternal,
    getDoctorAvailabilityInternal,
    reserveDoctorSlotInternal,
    releaseDoctorSlotInternal,
    getDoctorPatients,
    removePatientFromDoctorList
} from '../controllers/doctorService.controller.js'; 
import { requireAuth, requireRole, createUploadMiddleware } from '@healthbridge/shared';

const router = express.Router();

const uploadVerification = createUploadMiddleware(
    'doctor_verifications', 
    ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], 
    5 
);

// ==========================================
// INTERNAL / SERVICE-TO-SERVICE ROUTES
// ==========================================
router.get('/internal/payment/checkFee', checkConsultationFee);
router.get('/internal/get-doctor/:userId', getDoctorByUserIdInternal);


// ==========================================
// PUBLIC/PATIENT ROUTES (Authenticated users)
// ==========================================
router.route('/')
    .get(requireAuth, getVerifiedDoctors);

// ==========================================
// INTERNAL ROUTES (Service-to-service only)
// ==========================================
router.get('/internal/availability/:doctorId', getDoctorAvailabilityInternal);
router.post('/internal/availability/:doctorId/reserve', reserveDoctorSlotInternal);
router.post('/internal/availability/:doctorId/release', releaseDoctorSlotInternal);


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

router.route('/patients-list')
    .get(getDoctorPatients);
    
router.route('/patients-list/remove')
    .post(removePatientFromDoctorList);

// --- Verification Document Route ---
router.route('/verification-document')
    .post(uploadVerification.single('documentFile'), uploadVerificationDocument);

export default router;