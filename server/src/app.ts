import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { httpLogger, logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { globalApiRateLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import specialtyRoutes from './modules/specialties/specialty.routes.js';
import professionalRoutes from './modules/professionals/professional.routes.js';
import adminDoctorRoutes from './modules/professionals/admin.routes.js';
import doctorRoutes from './modules/professionals/doctor.routes.js';
import { doctorAvailabilityRoutes } from './modules/availability/availability.routes.js';

export const createApp = (): Application => {
  const app: Application = express();

  // Baseline Security & Middleware
  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(httpLogger);
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Deep Health Check endpoint (verifies server and database connectivity)
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      // Probe PostgreSQL database connection
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'ProRoute API',
      });
    } catch (err: unknown) {
      logger.error({ err }, 'Deep health check failed: database is unreachable');
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: 'Database unreachable',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'ProRoute API',
      });
    }
  });

  // Apply Global API Rate Limiter to all canonical /api/v1 routes
  app.use('/api/v1', globalApiRateLimiter);

  // Canonical REST API v1 Routing
  const mountRoutes = (prefix: string) => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/users`, userRoutes);
    app.use(`${prefix}/specialties`, specialtyRoutes);
    app.use(`${prefix}/professionals`, professionalRoutes);
    app.use(`${prefix}/admin/doctors`, adminDoctorRoutes);
    app.use(`${prefix}/doctors`, doctorRoutes);
    app.use(`${prefix}/doctor/availability`, doctorAvailabilityRoutes);
  };

  mountRoutes('/api/v1');

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
