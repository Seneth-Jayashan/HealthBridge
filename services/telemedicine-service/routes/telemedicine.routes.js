import express from 'express';
import { requireAuth, requireRole } from '@healthbridge/shared';
import {
    listMyVideoSessions,
    issueVideoSessionToken,
    startVideoSession,
    endVideoSession,
    getPatientOnlineAppointments,
    getDoctorOnlineAppointments,
    handlePaymentSuccess
} from '../controllers/telemedicine.controller.js';

const router = express.Router();

// ─── [INTERNAL API] Route (no auth required - called by appointment service) ──
router.get('/internal/success/:appointmentId', handlePaymentSuccess);

router.use(requireAuth);

router.get('/sessions/my', requireRole('Doctor', 'Patient', 'Admin'), listMyVideoSessions);
router.get('/appointments/patient/:userId?', requireRole('Patient'), getPatientOnlineAppointments);
router.get('/appointments/doctor/:userId?', requireRole('Doctor'), getDoctorOnlineAppointments);
router.post('/sessions/:sessionId/token', requireRole('Doctor', 'Patient'), issueVideoSessionToken);
router.patch('/sessions/:sessionId/start', requireRole('Doctor'), startVideoSession);
router.patch('/sessions/:sessionId/end', requireRole('Doctor'), endVideoSession);

export default router;