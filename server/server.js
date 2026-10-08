const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { mongoSanitize } = require('./middleware/securityMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const gigRoutes = require('./routes/gigRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const requestRoutes = require('./routes/requestRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const locationRoutes = require('./routes/locationRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const reportRoutes = require('./routes/reportRoutes');
const earningRoutes = require('./routes/earningRoutes');
const adminRoutes = require('./routes/adminRoutes');

const { seedInitialDataIfEmpty } = require('./seed');

connectDB()
  .then(() => {
    seedInitialDataIfEmpty();
  })
  .catch((err) => console.warn('DB Connect notice:', err.message));

const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: true, // Allow frontend origin
    credentials: true,
  })
);

// Body parser with size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// NoSQL query selector injection protection
app.use(mongoSanitize);

// General API rate limiter
app.use('/api', apiLimiter);

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/earnings', earningRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'NearbyGigs Secure Production API is active and protected.',
    version: '2.0.0',
    security: {
      helmet: 'active',
      rateLimiting: 'active',
      aadhaarDataMinimization: 'compliant',
      studentSafety: 'active',
    },
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`NearbyGigs Secure Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);
