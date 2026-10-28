import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { professionalRepository, ProfessionalWithDetails } from '../professional.repository.js';
import { JwtService } from '../../auth/jwt.service.js';
import { Role, VerificationStatus, Prisma } from '@prisma/client';

describe('Admin Doctor Verification API (/api/admin/doctors)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const adminToken = JwtService.generateTokens({
    id: 'admin-user-1',
    email: 'admin@proroute.health',
    role: Role.ADMIN,
    status: 'ACTIVE',
    isEmailVerified: true,
  }).accessToken;

  const doctorToken = JwtService.generateTokens({
    id: 'doc-user-1',
    email: 'doctor@example.com',
    role: Role.DOCTOR,
    status: 'ACTIVE',
    isEmailVerified: true,
  }).accessToken;

  const patientToken = JwtService.generateTokens({
    id: 'patient-user-1',
    email: 'patient@example.com',
    role: Role.PATIENT,
    status: 'ACTIVE',
    isEmailVerified: true,
  }).accessToken;

  const mockPendingDoctor: ProfessionalWithDetails = {
    id: 'a0000000-0000-4000-8000-000000000001',
    userId: 'user-doc-pending',
    profession: 'DOCTOR',
    specialtyId: 'spec-cardio-1',
    verificationStatus: VerificationStatus.PENDING,
    consultationFee: new Prisma.Decimal(120),
    bio: 'Experienced surgeon',
    licenseNumber: 'MD-55443',
    medicalBoard: 'General Medical Council',
    yearsOfExperience: 8,
    credentialDocumentUrl: 'https://docs.example.com/license.pdf',
    rejectionReason: null,
    verifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-doc-pending',
      email: 'pending.doc@example.com',
      patient: {
        name: 'Dr. Gregory House',
        phone: '+1987654321',
      },
    },
    specialty: {
      id: 'spec-cardio-1',
      name: 'Cardiology',
      slug: 'cardiology',
    },
  };

  describe('Authorization & RBAC', () => {
    it('should reject non-admin doctor with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/doctors/pending')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Insufficient privileges');
    });

    it('should reject patient with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/doctors/pending')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Insufficient privileges');
    });

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/doctors/pending');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/doctors/pending', () => {
    it('should return pending doctors with pagination metadata for admin', async () => {
      vi.spyOn(professionalRepository, 'findPending').mockResolvedValue({
        items: [mockPendingDoctor],
        total: 1,
      });

      const res = await request(app)
        .get('/api/admin/doctors/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].email).toBe('pending.doc@example.com');
      expect(res.body.data[0].verificationStatus).toBe('PENDING');
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(20);
    });

    it('should reject requests with limit exceeding 50 with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/admin/doctors/pending?limit=51')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'limit', message: 'Limit cannot exceed 50' }),
        ])
      );
    });

    it('should reject requests with limit less than 1 with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/admin/doctors/pending?limit=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'limit', message: 'Limit must be at least 1' }),
        ])
      );
    });

    it('should reject requests with page less than 1 with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/admin/doctors/pending?page=-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'page', message: 'Page must be at least 1' }),
        ])
      );
    });

    it('should reject non-numeric pagination parameters with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/admin/doctors/pending?page=abc&limit=xyz')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation Error');
    });

    it('should accept valid custom pagination parameters and pass to repository', async () => {
      const findSpy = vi.spyOn(professionalRepository, 'findPending').mockResolvedValue({
        items: [],
        total: 0,
      });

      const res = await request(app)
        .get('/api/admin/doctors/pending?page=3&limit=25')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(findSpy).toHaveBeenCalledWith(3, 25);
    });
  });

  describe('PATCH /api/admin/doctors/:id/approve', () => {
    it('should approve doctor with valid license and update status to APPROVED', async () => {
      vi.spyOn(professionalRepository, 'findById').mockResolvedValue(mockPendingDoctor);
      vi.spyOn(professionalRepository, 'updateVerificationStatus').mockResolvedValue({
        ...mockPendingDoctor,
        verificationStatus: VerificationStatus.APPROVED,
        verifiedAt: new Date(),
      });

      const res = await request(app)
        .patch(`/api/admin/doctors/${mockPendingDoctor.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('APPROVED');
      expect(res.body.message).toContain('Doctor approved successfully');
    });

    it('should reject approval if doctor does not have a license number', async () => {
      vi.spyOn(professionalRepository, 'findById').mockResolvedValue({
        ...mockPendingDoctor,
        licenseNumber: null,
      });

      const res = await request(app)
        .patch(`/api/admin/doctors/${mockPendingDoctor.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('cannot be approved without a verified license number');
    });
  });

  describe('PATCH /api/admin/doctors/:id/reject', () => {
    it('should reject doctor and record rejection reason', async () => {
      vi.spyOn(professionalRepository, 'findById').mockResolvedValue(mockPendingDoctor);
      vi.spyOn(professionalRepository, 'updateVerificationStatus').mockResolvedValue({
        ...mockPendingDoctor,
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: 'Medical license document is blurry and unreadable.',
      });

      const res = await request(app)
        .patch(`/api/admin/doctors/${mockPendingDoctor.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejectionReason: 'Medical license document is blurry and unreadable.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toBe('Medical license document is blurry and unreadable.');
    });

    it('should validate rejectionReason length and return 400 if too short', async () => {
      const res = await request(app)
        .patch(`/api/admin/doctors/${mockPendingDoctor.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejectionReason: 'No',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation Error');
    });
  });
});
