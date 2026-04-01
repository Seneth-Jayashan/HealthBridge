import 'dotenv/config';
import express from 'express';
import { errorHandler } from '@healthbridge/shared';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON payloads
app.use(express.json());

// Mount the routes
app.use('/', authRoutes);

// Attach the shared error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🔐 Auth Service running on port ${PORT}`);
});