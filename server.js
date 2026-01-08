const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Import routes
const authRoutes = require('./cambus-backend/src/routes/auth.routes');
const routesRoutes = require('./cambus-backend/src/routes/routes.routes');
const busesRoutes = require('./cambus-backend/src/routes/buses.routes');
const operatorRoutes = require('./cambus-backend/src/routes/bus-operators.routes');
const schedulesRoutes = require('./cambus-backend/src/routes/schedules.routes');
const bookingsRoutes = require('./cambus-backend/src/routes/bookings.routes');
const seatsRoutes = require('./cambus-backend/src/routes/seats.routes');
const messagesRoutes = require('./cambus-backend/src/routes/messages.routes');
const adminRoutes = require('./cambus-backend/src/routes/admin.routes');

// Error handler middleware
const errorHandler = require('./cambus-backend/src/middleware/errorHandler');

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'CamBus API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/buses', busesRoutes);
app.use('/api/bus-operators', operatorRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/seats', seatsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 CamBus API Server running on port ${PORT}`);
});

