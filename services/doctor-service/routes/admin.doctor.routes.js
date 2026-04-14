import express from 'express';
import {
    getAllDoctors,
    getDoctorDetails,
    verifyDoctor
} from '../controllers/admin.doctor.controller.js'; // Adjust path based on your actual filename
import { requireAuth, requireRole } from '@healthbridge/shared';

const router = express.Router();

// ==========================================
// GLOBAL ROUTE PROTECTION
// ==========================================
// Protect all routes in this file: Must be logged in AND have the 'Admin' role
router.use(requireAuth, requireRole('Admin'));

// --- Admin Doctor Management Routes ---

// Get all doctors (with query parameters for status/search)
router.route('/')
    .get(getAllDoctors);

// Get specific doctor details (used by admins to review profiles/documents)
router.route('/:doctorId')
    .get(getDoctorDetails);

// Approve or Reject a doctor's verification request (and generate DR- ID)
router.route('/:doctorId/verify')
    .patch(verifyDoctor);

export default router;