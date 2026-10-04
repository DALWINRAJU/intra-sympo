const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const environment = require('./config/environment');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const dns = require('dns');
const app = express();


// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: environment.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate limiting (Tuned for 100+ students on shared college/symposium Wi-Fi IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20000, // High capacity for shared college NAT/Wi-Fi gateways
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging
if (environment.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    message: 'Technical Quiz API is running',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: environment.nodeEnv,
      database: dbStatus,
    },
  });
});

// API Routes (will be added in later phases)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/session', require('./routes/sessionRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 404 handler
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
