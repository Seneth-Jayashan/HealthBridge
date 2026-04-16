import express from 'express';
import { requireAuth, requireRole } from '@healthbridge/shared';
import {
    listMyVideoSessions,
    getVideoSessionById,
    issueVideoSessionToken,
    startVideoSession,
    endVideoSession,
    getOnlineAppointmentsWithSessions,
    updateSessionStatus,
    handlePaymentSuccess
} from '../controllers/telemedicine.controller.js';

const router = express.Router();

// ─── [INTERNAL API] Route (no auth required - called by appointment service after payment) ──
// Auto-creates video session after payment is completed
router.get('/internal/success/:appointmentId', handlePaymentSuccess);

router.use(requireAuth);

// Session Management (authenticated)
router.get('/sessions/my', requireRole('Doctor', 'Patient', 'Admin'), listMyVideoSessions);
router.get('/sessions/my/appointments', requireRole('Doctor', 'Patient', 'Admin'), getOnlineAppointmentsWithSessions);
router.get('/sessions/:sessionId', requireRole('Doctor', 'Patient', 'Admin'), getVideoSessionById);

// Session Controls (token, start, end, status)
router.post('/sessions/:sessionId/token', requireRole('Doctor', 'Patient'), issueVideoSessionToken);
router.patch('/sessions/:sessionId/start', requireRole('Doctor'), startVideoSession);
router.patch('/sessions/:sessionId/end', requireRole('Doctor'), endVideoSession);
router.patch('/sessions/:sessionId/status', requireRole('Doctor'), updateSessionStatus);

export default router;