import express from 'express';
import { getPatientProfile, updatePatientProfile } from '../controllers/patientService.controller.js';
import { requireAuth, requireRole } from '@healthbridge/shared';

const router = express.Router();

// Both routes require the user to be logged in AND have the 'Patient' role
router.use(requireAuth, requireRole('Patient'));

router.route('/profile')
    .get(getPatientProfile)
    .put(updatePatientProfile);

export default router;