import 'dotenv/config';
import express from 'express';
import { errorHandler } from '@healthbridge/shared';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON payloads
app.use(express.json());

// Mount the routes
app.use('/', authRoutes);
app.use('/users', userRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'Auth Service is healthy' });
});

// Attach the shared error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🔐 Auth Service running on port ${PORT}`);
});