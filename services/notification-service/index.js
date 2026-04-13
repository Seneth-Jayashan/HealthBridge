import 'dotenv/config';
import express from 'express';
import { errorHandler } from '@healthbridge/shared';
import connectDB from './config/db.js';
import notificationRoutes from './routes/notification.routes.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware to parse JSON payloads
app.use(express.json());

// Mount the routes
app.use('/', notificationRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Notification Service is healthy' });
});

// Attach the shared error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🔐 Notification Service running on port ${PORT}`);
});