import express from 'express';
import { requireAuth, requireRole } from '@healthbridge/shared';
import { 
    getPatientById,
    uploadMedicalReport,
    deleteMedicalReport
 } from '../controllers/doctor.patient.controller.js';

const router = express.Router();

// -- DOCTOR ROUTES --
router.get('/patients/:patientId', requireAuth, requireRole('Doctor'), getPatientById);
router.post('/patients/:patientId/reports', requireAuth, requireRole('Doctor'), uploadMedicalReport);
router.delete('/patients/:patientId/reports/:reportId', requireAuth, requireRole('Doctor'), deleteMedicalReport);

export default router;
