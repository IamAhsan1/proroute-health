import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import {
  AppointmentStatus,
  Prisma,
  Role,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import { createApp } from '../../../app.js';
import { JwtService } from '../../auth/jwt.service.js';
import {
  appointmentRepository,
  BookSlotTransactionParams,
  BookSlotValidationContext,
  BookSlotValidationResult,
} from '../appointment.repository.js';
import { professionalService } from '../../professionals/professional.service.js';
import { ProfessionalWithDetails } from '../../professionals/professional.repository.js';
import { availabilityRepository } from '../../availability/availability.repository.js';

const DOCTOR_ID = '11111111-1111-4111-8111-111111111111';
const DOCTOR_USER_ID = '22222222-2222-4222-8222-222222222222';
const PATIENT_USER_ID_BASE = '33333333-3333-4333-8333-33333333330';

/**
 * Pick a date 3 days from now at 10:00-10:30 Asia/Karachi (UTC+5 -> 05:00-05:30 UTC),
 * which is guaranteed to satisfy the 2-hour advance notice and 14-day horizon rules.
 */
function getFutureSlotWindow() {
  const target = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const dateStr = target.toISOString().slice(0, 10);
  const dayOfWeek = new Date(`${dateStr}T12:00:00.000Z`).getUTCDay();
  const startTimeUtc = new Date(`${dateStr}T05:00:00.000Z`); // 10:00 Asia/Karachi
  const endTimeUtc = new Date(`${dateStr}T05:30:00.000Z`); // 10:30 Asia/Karachi
  return { dateStr, dayOfWeek, startTimeUtc, endTimeUtc };
}

function makePatientToken(index: number) {
  return JwtService.generateTokens({
    id: `${PATIENT_USER_ID_BASE}${index}`,
    email: `patient${index}@example.com`,
    role: Role.PATIENT,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
  }).accessToken;
}

describe('Appointment Booking & Concurrency Control (SEC-04)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows only 1 booking (201) and rejects 4 concurrent losers (409 SLOT_ALREADY_BOOKED)', async () => {
    const { dayOfWeek, startTimeUtc, endTimeUtc } = getFutureSlotWindow();

    vi.spyOn(appointmentRepository, 'findPatientByUserId').mockImplementation(async (userId) => ({
      id: `pat-${userId}`,
      userId,
      name: 'Test Patient',
    }));

    // Simulate PostgreSQL FOR UPDATE serialization + active appointment persistence
    let lockChain = Promise.resolve();
    const activeDoctorAppointments: {
      id: string;
      startTimeUtc: Date;
      endTimeUtc: Date;
      status: AppointmentStatus;
    }[] = [];

    vi.spyOn(appointmentRepository, 'bookSlotTransaction').mockImplementation(
      async (
        params: BookSlotTransactionParams,
        validator: (ctx: BookSlotValidationContext) => BookSlotValidationResult
      ) => {
        const previousLock = lockChain;
        let releaseLock!: () => void;
        lockChain = new Promise<void>((resolve) => {
          releaseLock = resolve;
        });

        await previousLock;
        try {
          // Yield a microtask so all 5 HTTP requests are genuinely in-flight concurrently
          await new Promise((r) => setTimeout(r, 10));

          const decision = validator({
            doctor: {
              id: DOCTOR_ID,
              userId: DOCTOR_USER_ID,
              verificationStatus: VerificationStatus.APPROVED,
              consultationFee: new Prisma.Decimal(100),
              timezone: 'Asia/Karachi',
            },
            rules: [
              {
                id: 'rule-1',
                professionalId: DOCTOR_ID,
                dayOfWeek,
                startTime: '09:00',
                endTime: '12:00',
                slotDuration: 30,
                bufferTime: 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            overrides: [],
            doctorOverlappingAppointments: activeDoctorAppointments.filter(
              (a) =>
                a.startTimeUtc.getTime() < params.endTimeUtc.getTime() &&
                a.endTimeUtc.getTime() > params.startTimeUtc.getTime()
            ),
            patientActiveAppointments: [],
          });

          const created = {
            id: `apt-${activeDoctorAppointments.length + 1}`,
            patientId: params.patientId,
            professionalId: params.professionalId,
            startTimeUtc: params.startTimeUtc,
            endTimeUtc: params.endTimeUtc,
            status: decision.status,
            consultationFee: decision.consultationFee,
            notes: params.notes ?? null,
            cancellationReason: null,
            cancelledByRole: null,
            cancelledAt: null,
            expiresAt: decision.expiresAt,
            confirmedAt: decision.confirmedAt,
            startedAt: null,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          activeDoctorAppointments.push({
            id: created.id,
            startTimeUtc: created.startTimeUtc,
            endTimeUtc: created.endTimeUtc,
            status: created.status,
          });

          return created;
        } finally {
          releaseLock();
        }
      }
    );

    const responses = await Promise.all(
      [1, 2, 3, 4, 5].map((i) =>
        request(app)
          .post('/api/v1/appointments')
          .set('Authorization', `Bearer ${makePatientToken(i)}`)
          .send({
            professionalId: DOCTOR_ID,
            startTimeUtc: startTimeUtc.toISOString(),
            endTimeUtc: endTimeUtc.toISOString(),
            notes: `Concurrent attempt ${i}`,
          })
      )
    );

    const createdResponses = responses.filter((r) => r.status === 201);
    const conflictResponses = responses.filter((r) => r.status === 409);

    expect(createdResponses).toHaveLength(1);
    expect(createdResponses[0].body.data.status).toBe('PENDING');
    expect(createdResponses[0].body.data.expiresAt).toBeTruthy();

    expect(conflictResponses).toHaveLength(4);
    for (const res of conflictResponses) {
      expect(res.body.code).toBe('SLOT_ALREADY_BOOKED');
    }
  });

  it('maps Prisma P2002 partial unique index violation to 409 SLOT_ALREADY_BOOKED', async () => {
    const { startTimeUtc, endTimeUtc } = getFutureSlotWindow();

    vi.spyOn(appointmentRepository, 'findPatientByUserId').mockResolvedValue({
      id: 'pat-1',
      userId: `${PATIENT_USER_ID_BASE}1`,
      name: 'Patient One',
    });

    vi.spyOn(appointmentRepository, 'bookSlotTransaction').mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      })
    );

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${makePatientToken(1)}`)
      .send({
        professionalId: DOCTOR_ID,
        startTimeUtc: startTimeUtc.toISOString(),
        endTimeUtc: endTimeUtc.toISOString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SLOT_ALREADY_BOOKED');
  });

  it('rejects arbitrary non-schedule timestamps with 400 Bad Request', async () => {
    const { dateStr, dayOfWeek } = getFutureSlotWindow();

    vi.spyOn(appointmentRepository, 'findPatientByUserId').mockResolvedValue({
      id: 'pat-1',
      userId: `${PATIENT_USER_ID_BASE}1`,
      name: 'Patient One',
    });

    vi.spyOn(appointmentRepository, 'bookSlotTransaction').mockImplementation(
      async (params, validator) => {
        validator({
          doctor: {
            id: DOCTOR_ID,
            userId: DOCTOR_USER_ID,
            verificationStatus: VerificationStatus.APPROVED,
            consultationFee: new Prisma.Decimal(100),
            timezone: 'Asia/Karachi',
          },
          rules: [
            {
              id: 'rule-1',
              professionalId: DOCTOR_ID,
              dayOfWeek,
              startTime: '09:00',
              endTime: '12:00',
              slotDuration: 30,
              bufferTime: 0,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          overrides: [],
          doctorOverlappingAppointments: [],
          patientActiveAppointments: [],
        });
        throw new Error('Should not reach create');
      }
    );

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${makePatientToken(1)}`)
      .send({
        professionalId: DOCTOR_ID,
        // 10:07 - 10:12 is not a valid 30-min expanded slot
        startTimeUtc: `${dateStr}T05:07:00.000Z`,
        endTimeUtc: `${dateStr}T05:12:00.000Z`,
      });

    expect(res.status).toBe(400);
  });

  it('auto-confirms free consultations (consultationFee = 0) immediately', async () => {
    const { dayOfWeek, startTimeUtc, endTimeUtc } = getFutureSlotWindow();

    vi.spyOn(appointmentRepository, 'findPatientByUserId').mockResolvedValue({
      id: 'pat-1',
      userId: `${PATIENT_USER_ID_BASE}1`,
      name: 'Patient One',
    });

    vi.spyOn(appointmentRepository, 'findByIdWithParticipants').mockResolvedValue(null);

    vi.spyOn(appointmentRepository, 'bookSlotTransaction').mockImplementation(
      async (params, validator) => {
        const decision = validator({
          doctor: {
            id: DOCTOR_ID,
            userId: DOCTOR_USER_ID,
            verificationStatus: VerificationStatus.APPROVED,
            consultationFee: new Prisma.Decimal(0),
            timezone: 'Asia/Karachi',
          },
          rules: [
            {
              id: 'rule-1',
              professionalId: DOCTOR_ID,
              dayOfWeek,
              startTime: '09:00',
              endTime: '12:00',
              slotDuration: 30,
              bufferTime: 0,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          overrides: [],
          doctorOverlappingAppointments: [],
          patientActiveAppointments: [],
        });

        return {
          id: 'apt-free-1',
          patientId: params.patientId,
          professionalId: params.professionalId,
          startTimeUtc: params.startTimeUtc,
          endTimeUtc: params.endTimeUtc,
          status: decision.status,
          consultationFee: decision.consultationFee,
          notes: null,
          cancellationReason: null,
          cancelledByRole: null,
          cancelledAt: null,
          expiresAt: decision.expiresAt,
          confirmedAt: decision.confirmedAt,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    );

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${makePatientToken(1)}`)
      .send({
        professionalId: DOCTOR_ID,
        startTimeUtc: startTimeUtc.toISOString(),
        endTimeUtc: endTimeUtc.toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.expiresAt).toBeNull();
    expect(res.body.data.confirmedAt).toBeTruthy();
  });

  it('excludes active PENDING and CONFIRMED appointments from GET /api/v1/doctors/:id/slots', async () => {
    const { dateStr, dayOfWeek, startTimeUtc, endTimeUtc } = getFutureSlotWindow();

    const mockDoctor: ProfessionalWithDetails = {
      id: DOCTOR_ID,
      userId: DOCTOR_USER_ID,
      name: 'Dr. Slot Subtract',
      profession: 'DOCTOR',
      specialtyId: 'spec-1',
      verificationStatus: VerificationStatus.APPROVED,
      consultationFee: new Prisma.Decimal(150),
      bio: 'Bio',
      licenseNumber: 'MD-1',
      medicalBoard: 'Board',
      yearsOfExperience: 10,
      credentialDocumentUrl: null,
      rejectionReason: null,
      verifiedAt: new Date(),
      timezone: 'Asia/Karachi',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: DOCTOR_USER_ID,
        email: 'doc@example.com',
        patient: null,
      },
      specialty: {
        id: 'spec-1',
        name: 'Cardiology',
        slug: 'cardiology',
      },
    };

    vi.spyOn(professionalService, 'getApprovedDoctorById').mockResolvedValue(
      mockDoctor as unknown as import('../../professionals/professional.types.js').ProfessionalProfileResponseDto
    );
    vi.spyOn(availabilityRepository, 'getAvailabilities').mockResolvedValue([
      {
        id: 'rule-1',
        professionalId: DOCTOR_ID,
        dayOfWeek,
        startTime: '09:00',
        endTime: '11:00',
        slotDuration: 30,
        bufferTime: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    vi.spyOn(availabilityRepository, 'getOverrides').mockResolvedValue([]);
    vi.spyOn(appointmentRepository, 'findActiveAppointmentsForDoctor').mockResolvedValue([
      {
        id: 'apt-booked-1',
        startTimeUtc, // 10:00 - 10:30 Asia/Karachi
        endTimeUtc,
        status: AppointmentStatus.CONFIRMED,
      },
    ]);

    const res = await request(app).get(
      `/api/v1/doctors/${DOCTOR_ID}/slots?startDate=${dateStr}&endDate=${dateStr}`
    );

    expect(res.status).toBe(200);
    const returnedStartTimes = res.body.data.slots.map((s: { startUtc: string }) => s.startUtc);
    expect(returnedStartTimes).not.toContain(startTimeUtc.toISOString());
    // 09:00, 09:30, 10:30 should still remain (3 of 4 slots)
    expect(res.body.data.slots).toHaveLength(3);
  });

  it('rejects appointment creation if doctor attempts to book with themselves', async () => {
    const { startTimeUtc, endTimeUtc } = getFutureSlotWindow();

    vi.spyOn(appointmentRepository, 'findPatientByUserId').mockResolvedValue({
      id: 'pat-doctor-self',
      userId: DOCTOR_USER_ID,
      name: 'Doctor Patient Profile',
    });

    vi.spyOn(appointmentRepository, 'bookSlotTransaction').mockImplementation(async (params, validator) => {
      // Execute the validator passing doctor with matching userId
      validator({
        doctor: {
          id: DOCTOR_ID,
          userId: DOCTOR_USER_ID, // Self-booking!
          verificationStatus: VerificationStatus.APPROVED,
          consultationFee: new Prisma.Decimal(100),
          timezone: 'Asia/Karachi',
        },
        rules: [],
        overrides: [],
        doctorOverlappingAppointments: [],
        patientActiveAppointments: [],
      });
      return {} as any;
    });

    const doctorToken = JwtService.generateTokens({
      id: DOCTOR_USER_ID,
      email: 'doctor.self@example.com',
      role: Role.PATIENT, // Doctor acting as patient
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    }).accessToken;

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        professionalId: DOCTOR_ID,
        startTimeUtc: startTimeUtc.toISOString(),
        endTimeUtc: endTimeUtc.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Doctors cannot book appointments with themselves');
  });

  it('rejects appointment creation if startTimeUtc is in the past', async () => {
    const pastStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pastEnd = new Date(pastStart.getTime() + 30 * 60 * 1000);

    const patientToken = makePatientToken(1);

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        professionalId: DOCTOR_ID,
        startTimeUtc: pastStart.toISOString(),
        endTimeUtc: pastEnd.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });
});
