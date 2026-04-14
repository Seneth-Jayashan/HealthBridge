import 'dotenv/config'; // Modern ES module way to load dotenv
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import verifyToken from './middlewares/auth.middleware.js';
import errorHandler from './middlewares/error.middleware.js';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost'], 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet()); 

app.use(verifyToken);
app.use('/', routes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is healthy' });
});

app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API endpoint not found on Gateway' });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 API Gateway is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});