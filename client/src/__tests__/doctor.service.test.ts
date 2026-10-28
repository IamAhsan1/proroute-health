import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doctorService, PublicDoctor, PendingDoctor } from '../services/doctor.service';
import { axiosInstance } from '../api/axios';

describe('doctorService API contract unpacking', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockPublicDoctor: PublicDoctor = {
    id: 'doc-1',
    name: 'Dr. Gregory House',
    specialty: {
      id: 'spec-1',
      name: 'Diagnostic Medicine',
      slug: 'diagnostics',
    },
    bio: 'Board-certified diagnostician',
    consultationFee: 200,
    yearsOfExperience: 15,
    verificationStatus: 'APPROVED',
  };

  const mockPendingDoctor: PendingDoctor = {
    id: 'doc-pending-1',
    user: {
      id: 'u-1',
      name: 'Dr. John Watson',
      email: 'watson@example.com',
      isEmailVerified: true,
    },
    specialty: {
      id: 'spec-2',
      name: 'General Medicine',
      slug: 'general-medicine',
    },
    licenseNumber: 'MD-88899',
    medicalBoard: 'General Medical Council',
    yearsOfExperience: 10,
    credentialDocumentUrl: 'https://docs.example.com/license.pdf',
    consultationFee: 150,
    bio: 'Trauma & General practitioner',
    verificationStatus: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  it('correctly unpacks backend paginated array into { doctors, pagination }', async () => {
    // Simulates exact backend response envelope: { success: true, data: [...items], pagination: {...} }
    vi.spyOn(axiosInstance, 'get').mockResolvedValue({
      data: {
        success: true,
        data: [mockPublicDoctor],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
        },
      },
    });

    const result = await doctorService.getPublicDoctors();

    expect(result.doctors).toHaveLength(1);
    expect(result.doctors[0].id).toBe('doc-1');
    expect(result.doctors[0].name).toBe('Dr. Gregory House');
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.limit).toBe(20);
  });

  it('correctly unpacks backend pending queue array into { pendingDoctors, pagination }', async () => {
    // Simulates exact backend response envelope for /api/admin/doctors/pending
    vi.spyOn(axiosInstance, 'get').mockResolvedValue({
      data: {
        success: true,
        data: [mockPendingDoctor],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
        },
      },
    });

    const result = await doctorService.getPendingDoctors(1, 20);

    expect(result.pendingDoctors).toHaveLength(1);
    expect(result.pendingDoctors[0].id).toBe('doc-pending-1');
    expect(result.pendingDoctors[0].user.name).toBe('Dr. John Watson');
    expect(result.pendingDoctors[0].licenseNumber).toBe('MD-88899');
    expect(result.pagination.total).toBe(1);
  });

  it('handles empty results and preserves zero total pagination', async () => {
    vi.spyOn(axiosInstance, 'get').mockResolvedValue({
      data: {
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
        },
      },
    });

    const result = await doctorService.getPublicDoctors({ specialtyId: 'unknown' });

    expect(result.doctors).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});
