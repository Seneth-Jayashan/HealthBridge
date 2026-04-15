import express from 'express';
import { requireAuth, requireRole } from '@healthbridge/shared';

import {
    getPrescriptions,
    getPrescriptionByIdPatient,
    deletePrescriptionPatient
} from '../controllers/prescription.controller';

import {
    getDoctorPrescriptions,
    createPrescription,
    updatePrescription,
    deletePrescription,
    getPrescriptionById,
    getAllDoctorPrescriptions
} from '../controllers/doctor.prescription.controller';

const router = express.Router();

// Patient routes
router.get('/', requireAuth, requireRole('patient'), getPrescriptions);
router.get('/:id', requireAuth, requireRole('patient'), getPrescriptionByIdPatient);
router.delete('/:id', requireAuth, requireRole('patient'), deletePrescriptionPatient);

// Doctor routes
router.get('/doctor/', requireAuth, requireRole('doctor'), getDoctorPrescriptions);
router.post('/doctor/', requireAuth, requireRole('doctor'), createPrescription);
router.put('/doctor/:id', requireAuth, requireRole('doctor'), updatePrescription);
router.delete('/doctor/:id', requireAuth, requireRole('doctor'), deletePrescription);
router.get('/doctor/all', requireAuth, requireRole('doctor'), getAllDoctorPrescriptions);
router.get('/doctor/:id', requireAuth, requireRole('doctor'), getPrescriptionById);

export default router;