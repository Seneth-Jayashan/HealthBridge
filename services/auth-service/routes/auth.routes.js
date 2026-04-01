import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '@healthbridge/shared';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', requireAuth, getMe);

export default router;