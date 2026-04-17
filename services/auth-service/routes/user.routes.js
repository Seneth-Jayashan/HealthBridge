import express from 'express';
import {
    getProfile,
    updateProfile,
    changePassword,
    getDoctorById,
    getPatientById,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById
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
router.get('/all', requireAuth, requireRole('Admin'), getAllUsers);
router.get('/:userId', requireAuth, requireRole('Admin'), getUserById);
router.put('/:userId', requireAuth, requireRole('Admin'), updateUserById);
router.delete('/:userId', requireAuth, requireRole('Admin'), deleteUserById);

export default router;