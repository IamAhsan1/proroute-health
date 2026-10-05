import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { Response } from 'express';
import cookieParser from 'cookie-parser';
import { Role } from '@prisma/client';
import { authenticate } from '../auth.middleware.js';
import { requireRole } from '../rbac.middleware.js';
import { JwtService } from '../../modules/auth/jwt.service.js';
import { AuthenticatedRequest } from '../../modules/auth/auth.types.js';

describe('RBAC & Auth Middleware', () => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  // Doctor-only protected route
  app.get(
    '/api/test/doctor-only',
    authenticate,
    requireRole(Role.DOCTOR),
    (req: AuthenticatedRequest, res: Response) => {
      res.json({ success: true, data: `Welcome Dr. ${req.user?.email}` });
    }
  );

  // Admin-only protected route
  app.get(
    '/api/test/admin-only',
    authenticate,
    requireRole(Role.ADMIN),
    (_req: AuthenticatedRequest, res: Response) => {
      res.json({ success: true, data: 'Admin area' });
    }
  );

  it('should return 401 Unauthorized when no token is supplied', async () => {
    const res = await request(app).get('/api/test/doctor-only');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('No token provided');
  });

  it('should return 401 Unauthorized when token signature is invalid', async () => {
    const res = await request(app)
      .get('/api/test/doctor-only')
      .set('Authorization', 'Bearer invalid-garbage-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid or expired token');
  });

  it('should return 403 Forbidden when Patient attempts Doctor-only endpoint', async () => {
    const patientToken = JwtService.generateTokens({
      id: 'patient-id',
      email: 'patient@example.com',
      role: Role.PATIENT,
    }).accessToken;

    const res = await request(app)
      .get('/api/test/doctor-only')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Insufficient privileges');
  });

  it('should return 200 OK when Doctor accesses Doctor-only endpoint via Bearer header', async () => {
    const doctorToken = JwtService.generateTokens({
      id: 'doctor-id',
      email: 'doctor@example.com',
      role: Role.DOCTOR,
    }).accessToken;

    const res = await request(app)
      .get('/api/test/doctor-only')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toContain('Welcome Dr. doctor@example.com');
  });

  it('should return 200 OK when Doctor accesses Doctor-only endpoint via access_token Cookie', async () => {
    const doctorToken = JwtService.generateTokens({
      id: 'doctor-id',
      email: 'doctor@example.com',
      role: Role.DOCTOR,
    }).accessToken;

    const res = await request(app)
      .get('/api/test/doctor-only')
      .set('Cookie', [`access_token=${doctorToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toContain('Welcome Dr. doctor@example.com');
  });
});
