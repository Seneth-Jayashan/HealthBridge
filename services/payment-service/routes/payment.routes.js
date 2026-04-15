import express from 'express';

import { 
    createPayment,
    payHereWebhook,
    getPaymentStatus,
    getAllPayments,
    getPatientPayments, // Uses req.user.id
    getDoctorPayments, // Uses req.user.id
    getPaymentById,
    getPaymentStatusByOrderId,
    getPaymentsByDoctor, // Uses req.params.doctorId
    getPaymentsByPatient // Uses req.params.patientId
} from '../controllers/payment.controller.js';
import { requireAuth, requireRole } from '@healthbridge/shared';

const router = express.Router();

router.post('/payhere-webhook', payHereWebhook);

router.get('/appointment-status/:appointmentId', requireAuth, getPaymentStatus);

// ------------------------------------------
// PUBLIC/PATIENT ROUTES (Authenticated users)
// ------------------------------------------
router.post('/create', requireAuth, requireRole('patient'), createPayment);
router.get('/status/:orderId', requireAuth, requireRole('patient'), getPaymentStatusByOrderId);
// FIX: Changed from getPaymentsByPatient to getPatientPayments
router.get('/my-payments', requireAuth, requireRole('patient'), getPatientPayments); 

// ------------------------------------------
// DOCTOR ROUTES (Authenticated users with Doctor role)
// ------------------------------------------
// FIX: Changed from getPaymentsByDoctor to getDoctorPayments
router.get('/doctor/payments', requireAuth, requireRole('doctor'), getDoctorPayments); 

// ------------------------------------------
// ADMIN ROUTES (Authenticated users with Admin role)
// ------------------------------------------
router.get('/', requireAuth, requireRole('admin'), getAllPayments);
router.get('/:id', requireAuth, requireRole('admin'), getPaymentById);
// FIX: Changed from getPatientPayments to getPaymentsByPatient
router.get('/patient/:patientId', requireAuth, requireRole('admin'), getPaymentsByPatient);
// FIX: Changed from getDoctorPayments to getPaymentsByDoctor
router.get('/doctor/:doctorId', requireAuth, requireRole('admin'), getPaymentsByDoctor);
router.get('/status/order/:orderId', requireAuth, requireRole('admin'), getPaymentStatusByOrderId);

export default router;