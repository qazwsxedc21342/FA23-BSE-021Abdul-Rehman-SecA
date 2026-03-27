import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { getDemoModeInfo } from './utils/runtime.js';
import logger from './utils/logger.js';
import { ApiError } from './utils/ApiError.js';
import { errorConverter, errorHandler } from './middlewares/error.js';
import { setupSwagger } from './utils/swagger.js';
import { initSocket } from './utils/socket.js';

// Routes
import authRoutes        from './routes/auth.js';
import packageRoutes     from './routes/packages.js';
import adRoutes          from './routes/ads.js';
import clientRoutes      from './routes/client.js';
import moderatorRoutes   from './routes/moderator.js';
import adminRoutes       from './routes/admin.js';
import analyticsRoutes   from './routes/analytics.js';
import questionRoutes    from './routes/questions.js';
import healthRoutes      from './routes/health.js';
import cronRoutes        from './routes/cron.js';
import categoryRoutes    from './routes/categories.js';
import cityRoutes        from './routes/cities.js';

// Cron scheduler
const demoInfo = getDemoModeInfo();
if (demoInfo.enabled) {
  const reason = demoInfo.forced ? 'DEMO_MODE=true' : (demoInfo.supabaseIssues.join(', ') || 'unknown');
  logger.warn(`⚠️  Demo mode enabled (${reason}). Cron jobs are disabled.`);
} else {
  await import('./cron/scheduler.js');
}

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Parsing ─────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev', { stream: { write: (message) => logger.info(message.trim()) } }));

// ─── Global Rate Limiter ────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/packages',    packageRoutes);
app.use('/api/ads',         adRoutes);
app.use('/api/categories',  categoryRoutes);
app.use('/api/cities',      cityRoutes);
app.use('/api/client',      clientRoutes);
app.use('/api/moderator',   moderatorRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/analytics',   analyticsRoutes);
app.use('/api/questions',   questionRoutes);
app.use('/api/health',      healthRoutes);
app.use('/api/cron',        cronRoutes);

// ─── API Documentation ────────────────────────────────────────
setupSwagger(app);

// ─── Root ping ──────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ message: 'AdFlow Pro API running ✓', version: '1.0.0' }));

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, _res, next) => next(new ApiError(404, 'Route not found')));

// ─── Global Error Handler ───────────────────────────────────
app.use(errorConverter);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`✅ AdFlow Pro server running on port ${PORT}`);
  logger.info(`   ENV: ${process.env.NODE_ENV}`);
  logger.info(`   Real-Time WebSockets Enabled ⚡`);
});

export default app;
