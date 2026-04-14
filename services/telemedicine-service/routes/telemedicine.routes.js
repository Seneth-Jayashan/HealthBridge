import express from 'express';
import { requireAuth, requireRole } from '@healthbridge/shared';
import {
    createVideoSession,
    listMyVideoSessions,
    getVideoSessionById,
    issueVideoSessionToken,
    startVideoSession,
    endVideoSession
} from '../controllers/telemedicine.controller.js';

const router = express.Router();

router.use(requireAuth);

router.post('/sessions', requireRole('Doctor', 'Admin'), createVideoSession);
router.get('/sessions/my', requireRole('Doctor', 'Patient', 'Admin'), listMyVideoSessions);
router.get('/sessions/:sessionId', requireRole('Doctor', 'Patient', 'Admin'), getVideoSessionById);
router.post('/sessions/:sessionId/token', requireRole('Doctor', 'Patient'), issueVideoSessionToken);
router.patch('/sessions/:sessionId/start', requireRole('Doctor'), startVideoSession);
router.patch('/sessions/:sessionId/end', requireRole('Doctor'), endVideoSession);

export default router;