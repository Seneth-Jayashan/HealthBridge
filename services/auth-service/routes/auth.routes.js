import express from 'express';
import {
	registerUser,
	loginUser,
	getMe,
	getInternalAdmins,
	getInternalUserById
} from '../controllers/auth.controller.js';
import { requireAuth, requireRole } from '@healthbridge/shared';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', requireAuth, getMe);

// --- INTERNAL SERVICE ROUTES ---
router.get('/internal/admins', getInternalAdmins);
router.get('/internal/users/:userId', getInternalUserById);

export default router;