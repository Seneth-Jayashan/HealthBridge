import express from 'express';
import {
	registerUser,
	loginUser,
	getMe,
	getAllUsers,
	getInternalAdmins,
	getInternalUserById
} from '../controllers/auth.controller.js';
import { requireAuth, requireRole } from '@healthbridge/shared';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', requireAuth, getMe);

// --- ADMIN ROUTES ---
// Notice how we chain requireAuth AND requireRole('Admin') 
router.get('/admin/users', requireAuth, requireRole('Admin'), getAllUsers);

// --- INTERNAL SERVICE ROUTES ---
router.get('/internal/admins', getInternalAdmins);
router.get('/internal/users/:userId', getInternalUserById);

export default router;