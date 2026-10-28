import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { professionalRepository, ProfessionalWithDetails } from '../professional.repository.js';
import { VerificationStatus, Prisma } from '@prisma/client';

describe('Public Doctor Directory API (GET /api/doctors)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockApprovedDoctor: ProfessionalWithDetails = {
    id: 'prof-approved-1',
    userId: 'user-doc-approved',
    profession: 'DOCTOR',
    specialtyId: 'spec-cardio-1',
    verificationStatus: VerificationStatus.APPROVED,
    consultationFee: new Prisma.Decimal(150),
    bio: 'Board certified cardiologist',
    licenseNumber: 'MD-11223',
    medicalBoard: 'State Medical Council',
    yearsOfExperience: 12,
    credentialDocumentUrl: 'https://docs.example.com/license.pdf',
    rejectionReason: null,
    verifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-doc-approved',
      email: 'cardio.doc@example.com',
      patient: {
        name: 'Dr. Sarah Smith',
        phone: '+123456789',
      },
    },
    specialty: {
      id: 'spec-cardio-1',
      name: 'Cardiology',
      slug: 'cardiology',
    },
  };

  it('should return list of approved doctors without requiring authentication', async () => {
    vi.spyOn(professionalRepository, 'findApprovedDoctors').mockResolvedValue({
      items: [mockApprovedDoctor],
      total: 1,
    });

    const res = await request(app).get('/api/doctors');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Dr. Sarah Smith');
    expect(res.body.data[0].verificationStatus).toBe('APPROVED');
    expect(res.body.data[0].specialty.slug).toBe('cardiology');
  });

  it('should pass search and specialty filters to repository', async () => {
    const findSpy = vi.spyOn(professionalRepository, 'findApprovedDoctors').mockResolvedValue({
      items: [mockApprovedDoctor],
      total: 1,
    });

    const res = await request(app)
      .get('/api/doctors?specialty=cardiology&search=Sarah&minFee=100&maxFee=200&page=1&limit=10');

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith({
      specialtySlug: 'cardiology',
      search: 'Sarah',
      minFee: 100,
      maxFee: 200,
      page: 1,
      limit: 10,
    });
  });

  it('should return empty list when no approved doctors match criteria', async () => {
    vi.spyOn(professionalRepository, 'findApprovedDoctors').mockResolvedValue({
      items: [],
      total: 0,
    });

    const res = await request(app).get('/api/doctors?specialty=neurology');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination).toEqual({
      total: 0,
      page: 1,
      limit: 20,
    });
  });

  it('should reject requests with limit exceeding 50 with 400 Bad Request', async () => {
    const res = await request(app).get('/api/doctors?limit=51');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Error');
  });

  it('should reject requests with negative consultation fee with 400 Bad Request', async () => {
    const res = await request(app).get('/api/doctors?minFee=-10');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Error');
  });
});
