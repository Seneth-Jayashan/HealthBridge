require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const symptomRoutes = require('./routes/symptomRoutes');
const historyRoutes = require('./routes/historyRoutes');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5007;
app.use(cookieParser());

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// ─── Rate Limiting ───────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/ai', limiter);

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/ai/symptoms', symptomRoutes);
app.use('/api/ai/history', historyRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'ai-service', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Database + Server ────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthbridge-ai', {
    dbName: process.env.MONGO_DB_NAME || 'healthbridge_ai_db'
  })
  .then(() => {
    logger.info('MongoDB connected for AI Service');
    app.listen(PORT, () => logger.info(`AI Service running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

module.exports = app;