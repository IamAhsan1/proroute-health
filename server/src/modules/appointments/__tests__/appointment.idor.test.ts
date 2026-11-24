import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { AppointmentStatus, Prisma, Role, UserStatus } from '@prisma/client';
import { createApp } from '../../../app.js';
import { JwtService } from '../../auth/jwt.service.js';
import {
  appointmentRepository,
  AppointmentWithParticipants,
} from '../appointment.repository.js';

const APPOINTMENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PATIENT_A_USER_ID = '11111111-aaaa-4aaa-8aaa-111111111111';
const PATIENT_B_USER_ID = '22222222-bbbb-4bbb-8bbb-222222222222';
const DOCTOR_A_USER_ID = '33333333-cccc-4ccc-8ccc-333333333333';
const DOCTOR_B_USER_ID = '44444444-dddd-4ddd-8ddd-444444444444';

function makeToken(userId: string, role: Role) {
  return JwtService.generateTokens({
    id: userId,
    email: `${userId}@example.com`,
    role,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
  }).accessToken;
}

function makeMockAppointment(): AppointmentWithParticipants {
  const startTimeUtc = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now
  const endTimeUtc = new Date(startTimeUtc.getTime() + 30 * 60 * 1000);
  return {
    id: APPOINTMENT_ID,
    patientId: 'pat-a-id',
    professionalId: 'prof-a-id',
    startTimeUtc,
    endTimeUtc,
    status: AppointmentStatus.CONFIRMED,
    consultationFee: new Prisma.Decimal(150),
    notes: 'Follow-up',
    cancellationReason: null,
    cancelledByRole: null,
    cancelledAt: null,
    expiresAt: null,
    confirmedAt: new Date(),
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: {
      id: 'pat-a-id',
      userId: PATIENT_A_USER_ID,
      name: 'Patient A',
      phone: '+1234567890',
      user: {
        id: PATIENT_A_USER_ID,
        email: 'patient.a@example.com',
      },
    },
    professional: {
      id: 'prof-a-id',
      userId: DOCTOR_A_USER_ID,
      name: 'Dr. A',
      timezone: 'Asia/Karachi',
      consultationFee: new Prisma.Decimal(150),
      user: {
        id: DOCTOR_A_USER_ID,
        email: 'doctor.a@example.com',
      },
      specialty: {
        id: 'spec-1',
        name: 'Cardiology',
        slug: 'cardiology',
      },
    },
    statusHistory: [],
  };
}

describe('Appointment IDOR & RBAC Authorization (SEC-03)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(appointmentRepository, 'findByIdWithParticipants').mockResolvedValue(
      makeMockAppointment()
    );
  });

  it('rejects unauthenticated access to /api/v1/appointments/me with 401', async () => {
    const res = await request(app).get('/api/v1/appointments/me');
    expect(res.status).toBe(401);
  });

  it('blocks Patient B from viewing Patient A appointment (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${makeToken(PATIENT_B_USER_ID, Role.PATIENT)}`);

    expect(res.status).toBe(403);
  });

  it('blocks Patient B from cancelling Patient A appointment (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/v1/appointments/${APPOINTMENT_ID}/cancel`)
      .set('Authorization', `Bearer ${makeToken(PATIENT_B_USER_ID, Role.PATIENT)}`)
      .send({ reason: 'Malicious cancel attempt' });

    expect(res.status).toBe(403);
  });

  it('blocks Doctor B from updating Doctor A appointment status (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/v1/appointments/${APPOINTMENT_ID}/status`)
      .set('Authorization', `Bearer ${makeToken(DOCTOR_B_USER_ID, Role.DOCTOR)}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(403);
  });

  it('blocks Patient A from calling Doctor-only /status endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/v1/appointments/${APPOINTMENT_ID}/status`)
      .set('Authorization', `Bearer ${makeToken(PATIENT_A_USER_ID, Role.PATIENT)}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(403);
  });

  it('allows Patient A to view their own appointment (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/v1/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${makeToken(PATIENT_A_USER_ID, Role.PATIENT)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(APPOINTMENT_ID);
  });

  it('allows Doctor A to transition their own CONFIRMED appointment to IN_PROGRESS (200 OK)', async () => {
    const currentAppointment = {
      ...makeMockAppointment(),
      startTimeUtc: new Date(Date.now() - 5 * 60 * 1000), // Within active window
      endTimeUtc: new Date(Date.now() + 25 * 60 * 1000),
    };
    vi.spyOn(appointmentRepository, 'findByIdWithParticipants').mockResolvedValue(currentAppointment);

    const updatedMock = {
      ...currentAppointment,
      status: AppointmentStatus.IN_PROGRESS,
      startedAt: new Date(),
    };

    vi.spyOn(appointmentRepository, 'transitionStatus').mockResolvedValue(updatedMock);

    const res = await request(app)
      .patch(`/api/v1/appointments/${APPOINTMENT_ID}/status`)
      .set('Authorization', `Bearer ${makeToken(DOCTOR_A_USER_ID, Role.DOCTOR)}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('rejects confirming a pending appointment if the 15-minute hold has expired', async () => {
    const expiredPendingAppointment = {
      ...makeMockAppointment(),
      status: AppointmentStatus.PENDING,
      expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
    };
    vi.spyOn(appointmentRepository, 'findByIdWithParticipants').mockResolvedValue(expiredPendingAppointment);

    const res = await request(app)
      .patch(`/api/v1/appointments/${APPOINTMENT_ID}/confirm`)
      .set('Authorization', `Bearer ${makeToken(PATIENT_A_USER_ID, Role.PATIENT)}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('This pending slot reservation has expired');
  });

  it('rejects marking an appointment as NO_SHOW if the start time is in the future', async () => {
    const futureAppointment = {
      ...makeMockAppointment(),
      startTimeUtc: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours in the future
      status: AppointmentStatus.CONFIRMED,
    };
    vi.spyOn(appointmentRepository, 'findByIdWithParticipants').mockResolvedValue(futureAppointment);

    const res = await request(app)
      .patch(`/api/v1/appointments/${APPOINTMENT_ID}/status`)
      .set('Authorization', `Bearer ${makeToken(DOCTOR_A_USER_ID, Role.DOCTOR)}`)
      .send({ status: 'NO_SHOW' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Cannot mark appointment as NO_SHOW before scheduled start time');
  });

  it('rejects transitioning to IN_PROGRESS if the appointment is more than 15 minutes in the future', async () => {
    const distantFutureAppointment = {
      ...makeMockAppointment(),
      startTimeUtc: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours away
      status: AppointmentStatus.CONFIRMED,
    };
    vi.spyOn(appointmentRepository, 'findByIdWithParticipants').mockResolvedValue(distantFutureAppointment);

    const res = await request(app)
      .patch(`/api/v1/appointments/${APPOINTMENT_ID}/status`)
      .set('Authorization', `Bearer ${makeToken(DOCTOR_A_USER_ID, Role.DOCTOR)}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Cannot start appointment more than 15 minutes before scheduled start time');
  });
});
