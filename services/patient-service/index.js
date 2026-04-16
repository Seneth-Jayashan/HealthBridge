import 'dotenv/config';
import express from 'express';
import { errorHandler } from '@healthbridge/shared';
import connectDB from './config/db.js';
import patientServiceRoutes from './routes/patientService.routes.js';
import prescriptionRoutes from './routes/prescriptions.routes.js';
import doctorPatientRoutes from './routes/doctor.patient.routes.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware to parse JSON payloads
app.use(express.json());

// Mount the routes
app.use('/prescriptions', prescriptionRoutes);
app.use('/doctor', doctorPatientRoutes);
app.use('/', patientServiceRoutes);

// Attach the shared error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🔐 Patient Service running on port ${PORT}`);
});