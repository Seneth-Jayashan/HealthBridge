import 'dotenv/config';
import express from 'express';
import { errorHandler } from '@healthbridge/shared';
import connectDB from './config/db.js';
import telemedicineRoutes from './routes/telemedicine.routes.js';

connectDB();

const app = express();
const PORT = process.env.PORT || 3008;

app.use(express.json());
app.use('/', telemedicineRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Telemedicine service is healthy' });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Telemedicine Service running on port ${PORT}`);
});