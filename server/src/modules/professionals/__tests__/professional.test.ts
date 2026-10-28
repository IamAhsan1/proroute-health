import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { professionalRepository, ProfessionalWithDetails } from '../professional.repository.js';
import { specialtyRepository } from '../../specialties/specialty.repository.js';
import { JwtService } from '../../auth/jwt.service.js';
import { Role, VerificationStatus, Prisma } from '@prisma/client';

describe('Professional Profile API (/api/professionals)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const verifiedDoctorToken = JwtService.generateTokens({
    id: 'doc-user-1',
    email: 'doctor@example.com',
    role: Role.DOCTOR,
    status: 'ACTIVE',
    isEmailVerified: true,
  }).accessToken;

  const unverifiedDoctorToken = JwtService.generateTokens({
    id: 'doc-user-2',
    email: 'unverified@example.com',
    role: Role.DOCTOR,
    status: 'ACTIVE',
    isEmailVerified: false,
  }).accessToken;

  const patientToken = JwtService.generateTokens({
    id: 'patient-user-1',
    email: 'patient@example.com',
    role: Role.PATIENT,
    status: 'ACTIVE',
    isEmailVerified: true,
  }).accessToken;

  const mockDoctorProfile: ProfessionalWithDetails = {
    id: 'prof-doc-1',
    userId: 'doc-user-1',
    profession: 'DOCTOR',
    specialtyId: 'spec-cardio-1',
    verificationStatus: VerificationStatus.PENDING,
    consultationFee: new Prisma.Decimal(150),
    bio: 'Cardiologist with 10 years experience',
    licenseNumber: 'MD-99881',
    medicalBoard: 'State Medical Council',
    yearsOfExperience: 10,
    credentialDocumentUrl: 'https://example.com/docs/license.pdf',
    rejectionReason: null,
    verifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'doc-user-1',
      email: 'doctor@example.com',
      patient: {
        name: 'Dr. Sarah Connor',
        phone: '+123456789',
      },
    },
    specialty: {
      id: 'spec-cardio-1',
      name: 'Cardiology',
      slug: 'cardiology',
    },
  };

  describe('GET /api/professionals/me', () => {
    it('should return doctor profile for authenticated doctor', async () => {
      vi.spyOn(professionalRepository, 'findByUserId').mockResolvedValue(mockDoctorProfile);

      const res = await request(app)
        .get('/api/professionals/me')
        .set('Authorization', `Bearer ${verifiedDoctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.licenseNumber).toBe('MD-99881');
      expect(res.body.data.specialty.name).toBe('Cardiology');
      expect(res.body.data.consultationFee).toBe(150);
    });

    it('should reject access if user is a Patient with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/professionals/me')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Insufficient privileges');
    });

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/professionals/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/professionals/me', () => {
    it('should update doctor profile and credentials when email is verified', async () => {
      vi.spyOn(professionalRepository, 'findByUserId').mockResolvedValue(mockDoctorProfile);
      vi.spyOn(specialtyRepository, 'findById').mockResolvedValue({
        id: 'spec-cardio-1',
        name: 'Cardiology',
        slug: 'cardiology',
        description: null,
        icon: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.spyOn(professionalRepository, 'updateProfile').mockResolvedValue({
        ...mockDoctorProfile,
        bio: 'Updated bio description',
      });

      const res = await request(app)
        .patch('/api/professionals/me')
        .set('Authorization', `Bearer ${verifiedDoctorToken}`)
        .send({
          bio: 'Updated bio description',
          yearsOfExperience: 12,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bio).toBe('Updated bio description');
    });

    it('should reject profile mutation when doctor email is not verified with 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/professionals/me')
        .set('Authorization', `Bearer ${unverifiedDoctorToken}`)
        .send({
          bio: 'Updated bio',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Email verification required');
    });

    it('should reject duplicate license number with 409 Conflict', async () => {
      vi.spyOn(professionalRepository, 'findByUserId').mockResolvedValue(mockDoctorProfile);
      vi.spyOn(professionalRepository, 'findByLicenseNumber').mockResolvedValue({
        id: 'other-prof-id',
        userId: 'other-user-id',
        profession: 'DOCTOR',
        specialtyId: null,
        verificationStatus: VerificationStatus.APPROVED,
        consultationFee: null,
        bio: null,
        licenseNumber: 'TAKEN-LICENSE-123',
        medicalBoard: 'Other Board',
        yearsOfExperience: 5,
        credentialDocumentUrl: null,
        rejectionReason: null,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .patch('/api/professionals/me')
        .set('Authorization', `Bearer ${verifiedDoctorToken}`)
        .send({
          licenseNumber: 'TAKEN-LICENSE-123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('A doctor with this license number already exists');
    });

    it('should reject invalid specialty ID with 400 Bad Request', async () => {
      vi.spyOn(professionalRepository, 'findByUserId').mockResolvedValue(mockDoctorProfile);
      vi.spyOn(specialtyRepository, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/professionals/me')
        .set('Authorization', `Bearer ${verifiedDoctorToken}`)
        .send({
          specialtyId: '00000000-0000-0000-0000-000000000000',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid medical specialty selected');
    });
  });
});
