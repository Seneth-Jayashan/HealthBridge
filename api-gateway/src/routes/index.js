import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();

const services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    patient: process.env.PATIENT_SERVICE_URL || 'http://localhost:3002',
    doctor: process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003',
    appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:3007',
    prescription: process.env.PRESCRIPTION_SERVICE_URL || 'http://localhost:3008'
};

const onProxyError = (err, req, res) => {
    console.error(`[Proxy Error] ${req.url}:`, err.message);
    res.status(502).json({
        success: false,
        message: 'Bad Gateway: The requested service is currently unavailable.'
    });
};

router.use('/api/auth', createProxyMiddleware({ target: services.auth, changeOrigin: true, onError: onProxyError }));
router.use('/api/patients', createProxyMiddleware({ target: services.patient, changeOrigin: true, onError: onProxyError }));
router.use('/api/doctors', createProxyMiddleware({ target: services.doctor, changeOrigin: true, onError: onProxyError }));
router.use('/api/appointments', createProxyMiddleware({ target: services.appointment, changeOrigin: true, onError: onProxyError }));
router.use('/api/payments', createProxyMiddleware({ target: services.payment, changeOrigin: true, onError: onProxyError }));
router.use('/api/notifications', createProxyMiddleware({ target: services.notification, changeOrigin: true, onError: onProxyError }));
router.use('/api/ai', createProxyMiddleware({ target: services.ai, changeOrigin: true, onError: onProxyError }));
router.use('/api/prescriptions', createProxyMiddleware({ target: services.prescription, changeOrigin: true, onError: onProxyError }));

export default router;