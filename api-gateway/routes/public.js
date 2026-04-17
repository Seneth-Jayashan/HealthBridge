import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();

const services = {
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
};

const onProxyError = (err, req, res) => {
    console.error(`[Proxy Error] ${req.url}:`, err.message);
    res.status(502).json({
        success: false,
        message: 'Bad Gateway: The requested service is currently unavailable.'
    });
};


router.use('/api/payments', createProxyMiddleware({ target: services.payment, changeOrigin: true, onError: onProxyError }));

export default router;