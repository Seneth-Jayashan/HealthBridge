import 'dotenv/config';
import express from 'express';
import { errorHandler } from '@healthbridge/shared';
import connectDB from './config/db.js';
import paymentRoutes from './routes/payment.routes.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware to parse JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Payment Service is healthy' });
});

// Mount the routes
app.use('/', paymentRoutes);

// Attach the shared error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🔐 Payment Service running on port ${PORT}`);
});