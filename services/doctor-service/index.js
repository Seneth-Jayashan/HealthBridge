import 'dotenv/config';
import express from 'express';
import path from 'path';
import { errorHandler } from '@healthbridge/shared';
import connectDB from './config/db.js';
import doctorRoutes from './routes/doctorService.routes.js';
import adminDoctorRoutes from './routes/admin.doctor.routes.js';
import patientDoctorRoutes from './routes/patient.doctor.routes.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware to parse JSON payloads
app.use(express.json());

// Serve locally stored verification documents when Cloudinary is unavailable.
app.use('/uploads', express.static(path.resolve('./public/uploads')));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Doctor Service is healthy' });
});

// Mount the routes
app.use('/admin', adminDoctorRoutes);
app.use('/patients', patientDoctorRoutes);
app.use('/', doctorRoutes);




// Attach the shared error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🔐 Doctor Service running on port ${PORT}`);
});