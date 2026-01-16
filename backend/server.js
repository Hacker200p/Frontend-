import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import HealthMonitor from './utils/healthMonitor.js';
import RequestQueueManager from './middleware/requestQueue.js';
import GracefulShutdown from './utils/gracefulShutdown.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import canteenRoutes from './routes/canteenRoutes.js';
import contractRoutes from './routes/contractRoutes.js';

// Initialize express
const app = express();
const server = http.createServer(app);

// Initialize health monitor
const healthMonitor = new HealthMonitor({
  maxMemoryPercent: 85,
  maxCpuPercent: 90,
  checkInterval: 10000,
});
healthMonitor.start();

// Initialize request queue manager
const requestQueue = new RequestQueueManager({
  maxQueueSize: 1000,
  maxConcurrent: 100,
  requestTimeout: 30000,
});

// Initialize graceful shutdown
const gracefulShutdown = new GracefulShutdown(server, {
  timeout: 30000,
  onShutdown: async () => {
    console.log('Closing database connections...');
    healthMonitor.stop();
    // Add any cleanup logic here
  },
});
gracefulShutdown.init();

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// Connect to database
connectDB();

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Apply graceful shutdown middleware first
app.use(gracefulShutdown.middleware());

// Apply request queue middleware
app.use(requestQueue.middleware());

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Compression with better settings
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Production logging - more concise
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400, // Only log errors in production
  }));
}

// Rate limiting (tunable via env vars and disabled in development)
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || (15 * 60 * 1000), 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 600 : 1200), 10);
const RATE_LIMIT_ENABLED = (process.env.RATE_LIMIT_ENABLED || (process.env.NODE_ENV === 'production' ? 'true' : 'false')).toLowerCase() === 'true';

if (RATE_LIMIT_ENABLED) {
  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);
  console.log(`Rate limiting enabled: max ${RATE_LIMIT_MAX} reqs / ${RATE_LIMIT_WINDOW_MS / 60000} min`);
} else {
  console.log('Rate limiting disabled for this environment.');
}

// Socket.IO - Real-time order tracking
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-order-room', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`Socket ${socket.id} joined order room: ${orderId}`);
  });

  socket.on('order-status-update', (data) => {
    io.to(`order-${data.orderId}`).emit('order-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Cache middleware for performance
import { cacheStrategies } from './middleware/cacheMiddleware.js';

// Public routes (no authentication required)
import { searchHostels } from './controllers/tenantController.js';
app.get('/api/hostels/search', cacheStrategies.dynamic, searchHostels);

// Mapbox token endpoint - cache for 1 hour
app.get('/api/config/mapbox-token', cacheStrategies.semiStatic, (req, res) => {
  res.json({ success: true, token: process.env.VITE_MAPBOX_TOKEN || '' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/canteen', canteenRoutes);
app.use('/api/contract', contractRoutes);

// Health check - cache for 30 seconds
app.get('/api/health', cacheStrategies.dynamic, (req, res) => {
  const healthStatus = healthMonitor.getStatus();
  const queueStats = requestQueue.getStats();
  
  res.json({ 
    success: true, 
    message: 'SafeStay Hub API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    health: healthStatus,
    queue: queueStats,
  });
});

// Metrics endpoint for monitoring
app.get('/api/metrics', (req, res) => {
  const healthStatus = healthMonitor.getStatus();
  const queueStats = requestQueue.getStats();
  
  res.json({
    success: true,
    metrics: {
      health: healthStatus,
      requests: queueStats,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
