import express from 'express';
import {
    getProfile,
    updateProfile,
    changePassword,
    getDoctorById,
    getPatientById,
    getAllUsers
} from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '@healthbridge/shared';

const router = express.Router();

// -- PUBLIC ROUTES --
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.put('/change-password', requireAuth, changePassword);

//-- PATTIENT ROUTES --
router.get('/doctors/:doctorId', requireAuth, requireRole('Patient'), getDoctorById);

// -- DOCTOR ROUTES --
router.get('/patients/:patientId', requireAuth, requireRole('Doctor'), getPatientById);

// --- ADMIN ROUTES ---
router.get('/admin/all', requireAuth, requireRole('Admin'), getAllUsers);

export default router;