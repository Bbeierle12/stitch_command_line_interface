import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimit';
import { logger } from './utils/logger';

dotenv.config();

// Import routes
import authJwtRoutes from './routes/auth-jwt';
import ciRoutes from './routes/ci';
import commandRoutes from './routes/commands';
import editorRoutes from './routes/editor';
import llmRoutes from './routes/llm';
import logsRoutes from './routes/logs';
import networkRoutes from './routes/network';
import notificationsRoutes from './routes/notifications';
import previewRoutes from './routes/preview';
import securityRoutes from './routes/security';
import snapshotsRoutes from './routes/snapshots';
import systemRoutes from './routes/system';
import ideRoutes from './routes/ide';

// Import authentication middleware
import { authenticateToken, requireDeveloper } from './middleware/auth';

// Import services for initialization
import { workspaceService } from './services/workspaceService';

const app: Application = express();

// Disable x-powered-by header
app.disable('x-powered-by');

// Security middleware
app.use(helmet());

// CORS with strict allowlist validation
const corsAllowlist = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:5173'];
const corsCredentials = process.env.CORS_CREDENTIALS === 'true';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowlist
      if (corsAllowlist.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Health endpoint (public, no auth required)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), version: process.env.npm_package_version || '1.0.0' });
});

// Initialize workspace
workspaceService.initialize().catch(err => {
  logger.error('Failed to initialize workspace:', err);
});

// Public routes - authentication endpoints (no auth required)
app.use('/v1/auth', rateLimiter, authJwtRoutes);

// Protected /v1 routes - require authentication
app.use('/v1', authenticateToken, rateLimiter);

// Protected /api routes - require authentication AND developer role
app.use('/api', authenticateToken, requireDeveloper, rateLimiter);

// API routes (all protected by global middleware above)
app.use('/v1/ci', ciRoutes);
app.use('/v1/commands', commandRoutes);
app.use('/v1/editor', editorRoutes);
app.use('/v1/llm', llmRoutes);
app.use('/v1/logs', logsRoutes);
app.use('/v1/network', networkRoutes);
app.use('/v1/notifications', notificationsRoutes);
app.use('/v1/preview', previewRoutes);
app.use('/v1/security', securityRoutes);
app.use('/v1/snapshots', snapshotsRoutes);
app.use('/v1/system', systemRoutes);
app.use('/api', ideRoutes); // IDE routes on /api prefix (protected by developer role)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
