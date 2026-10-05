import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { userRepository } from '../user.repository.js';
import { JwtService } from '../../auth/jwt.service.js';
import { Role } from '@prisma/client';
import { UserWithProfile } from '../../auth/auth.repository.js';

describe('IDOR/BOLA Protection — /api/users/me', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const userA = {
    id: 'user-a-uuid',
    email: 'userA@example.com',
    role: Role.PATIENT,
  };

  const userB = {
    id: 'user-b-uuid',
    email: 'userB@example.com',
    role: Role.PATIENT,
  };

  const mockUserAProfile: UserWithProfile = {
    id: userA.id,
    email: userA.email,
    passwordHash: 'hashA',
    role: Role.PATIENT,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: {
      id: 'patient-a-uuid',
      userId: userA.id,
      name: 'User A Name',
      phone: '111-222-3333',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    professional: null,
  };

  const mockUserBProfile: UserWithProfile = {
    id: userB.id,
    email: userB.email,
    passwordHash: 'hashB',
    role: Role.PATIENT,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: {
      id: 'patient-b-uuid',
      userId: userB.id,
      name: 'User B Private Medical Data',
      phone: '999-888-7777',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    professional: null,
  };

  it('should reject unauthenticated request to /api/users/me with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return User A profile when authenticated as User A', async () => {
    const tokenA = JwtService.generateTokens(userA).accessToken;

    vi.spyOn(userRepository, 'findProfileByUserId').mockImplementation(async (id: string) => {
      if (id === userA.id) return mockUserAProfile;
      if (id === userB.id) return mockUserBProfile;
      return null;
    });

    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(userA.id);
    expect(res.body.data.email).toBe(userA.email);
    expect(res.body.data.patient.name).toBe('User A Name');
  });

  it('should update User A profile when authenticated as User A', async () => {
    const tokenA = JwtService.generateTokens(userA).accessToken;

    const updatedUserA: UserWithProfile = {
      ...mockUserAProfile,
      patient: {
        ...mockUserAProfile.patient!,
        name: 'User A Updated',
      },
    };

    vi.spyOn(userRepository, 'updateProfile').mockResolvedValue(updatedUserA);

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'User A Updated' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patient.name).toBe('User A Updated');
    expect(userRepository.updateProfile).toHaveBeenCalledWith(userA.id, { name: 'User A Updated' });
  });

  it('IDOR Defense: confirms that attempting to request User B by URL parameter /api/users/:id fails (404/not routed)', async () => {
    const tokenA = JwtService.generateTokens(userA).accessToken;

    // Attacker User A attempts to tamper with endpoint using User B's UUID
    const res = await request(app)
      .get(`/api/users/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    // Because private resources ONLY exist under /me, direct ID targeting is completely unrouted
    expect(res.status).toBe(404);
  });
});
