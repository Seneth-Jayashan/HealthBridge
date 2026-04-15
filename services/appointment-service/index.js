import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import appointmentRoutes from './routes/appointment.routes.js';
import { errorHandler } from '@healthbridge/shared';

const app = express();
const PORT = process.env.PORT || 3004;

// ─── Middleware ────────────────────────────────────────
app.use(express.json());

// ─── Connect to MongoDB ────────────────────────────────
connectDB();

// ─── Routes ───────────────────────────────────────────
app.use('/', appointmentRoutes);

// ─── Health check ─────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Appointment Service is running',
        port: PORT
    });
});

// ─── Start server ─────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`📅 Appointment Service running on port ${PORT}`);
});