import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvailabilityService } from '../availability.service.js';
import { AvailabilityRepository } from '../availability.repository.js';
import { NotFoundError } from '../../../utils/apiErrors.js';
import { Professional, VerificationStatus } from '@prisma/client';

describe('AvailabilityService', () => {
  let mockRepo: any;
  let service: AvailabilityService;

  const mockDoctor: Professional = {
    id: 'prof-doc-123',
    userId: 'user-doc-123',
    profession: 'DOCTOR',
    specialtyId: 'spec-1',
    verificationStatus: VerificationStatus.APPROVED,
    consultationFee: null,
    bio: null,
    licenseNumber: 'MD-123',
    medicalBoard: 'Board',
    yearsOfExperience: 5,
    credentialDocumentUrl: null,
    rejectionReason: null,
    verifiedAt: new Date(),
    timezone: 'Asia/Karachi',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepo = {
      findProfessionalByUserId: vi.fn(),
      findProfessionalById: vi.fn(),
      updateDoctorTimezone: vi.fn(),
      getAvailabilities: vi.fn(),
      replaceWeeklySchedule: vi.fn(),
      getOverrides: vi.fn(),
      findOverrideById: vi.fn(),
      upsertOverride: vi.fn(),
      deleteOverride: vi.fn(),
    } as unknown as AvailabilityRepository;

    service = new AvailabilityService(mockRepo);
  });

  describe('getDoctorWeeklySchedule', () => {
    it('should throw NotFoundError if doctor profile does not exist', async () => {
      mockRepo.findProfessionalByUserId.mockResolvedValue(null);

      await expect(service.getDoctorWeeklySchedule('unknown-user')).rejects.toThrow(NotFoundError);
    });

    it('should return default 7-day schedule if no existing rules are saved', async () => {
      mockRepo.findProfessionalByUserId.mockResolvedValue(mockDoctor);
      mockRepo.getAvailabilities.mockResolvedValue([]);

      const result = await service.getDoctorWeeklySchedule(mockDoctor.userId);

      expect(result.timezone).toBe('Asia/Karachi');
      expect(result.days).toHaveLength(7);
      // Monday (1) to Friday (5) should be active by default
      expect(result.days[1].isActive).toBe(true);
      expect(result.days[1].windows).toEqual([{ startTime: '09:00', endTime: '17:00' }]);
      // Sunday (0) & Saturday (6) inactive by default
      expect(result.days[0].isActive).toBe(false);
      expect(result.days[6].isActive).toBe(false);
    });

    it('should map existing database records with split shifts accurately', async () => {
      mockRepo.findProfessionalByUserId.mockResolvedValue(mockDoctor);
      mockRepo.getAvailabilities.mockResolvedValue([
        {
          id: 'av-1',
          professionalId: mockDoctor.id,
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '12:00',
          slotDuration: 45,
          bufferTime: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'av-2',
          professionalId: mockDoctor.id,
          dayOfWeek: 1, // Monday split shift
          startTime: '14:00',
          endTime: '18:00',
          slotDuration: 45,
          bufferTime: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getDoctorWeeklySchedule(mockDoctor.userId);

      const monday = result.days.find((d) => d.dayOfWeek === 1);
      expect(monday).toBeDefined();
      expect(monday?.isActive).toBe(true);
      expect(monday?.slotDuration).toBe(45);
      expect(monday?.bufferTime).toBe(10);
      expect(monday?.windows).toEqual([
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '18:00' },
      ]);
    });
  });

  describe('setDoctorWeeklySchedule', () => {
    it('should flatten schedule items and call repository replaceWeeklySchedule', async () => {
      mockRepo.findProfessionalByUserId.mockResolvedValue(mockDoctor);
      mockRepo.replaceWeeklySchedule.mockResolvedValue([]);
      mockRepo.getAvailabilities.mockResolvedValue([]);

      const input = {
        timezone: 'Asia/Karachi',
        days: [
          { dayOfWeek: 0, isActive: false, windows: [], slotDuration: 30 as const, bufferTime: 5 as const },
          {
            dayOfWeek: 1,
            isActive: true,
            windows: [{ startTime: '10:00', endTime: '16:00' }],
            slotDuration: 30 as const,
            bufferTime: 5 as const,
          },
          { dayOfWeek: 2, isActive: false, windows: [], slotDuration: 30 as const, bufferTime: 5 as const },
          { dayOfWeek: 3, isActive: false, windows: [], slotDuration: 30 as const, bufferTime: 5 as const },
          { dayOfWeek: 4, isActive: false, windows: [], slotDuration: 30 as const, bufferTime: 5 as const },
          { dayOfWeek: 5, isActive: false, windows: [], slotDuration: 30 as const, bufferTime: 5 as const },
          { dayOfWeek: 6, isActive: false, windows: [], slotDuration: 30 as const, bufferTime: 5 as const },
        ],
      };

      await service.setDoctorWeeklySchedule(mockDoctor.userId, input);

      expect(mockRepo.replaceWeeklySchedule).toHaveBeenCalledWith(
        mockDoctor.id,
        'Asia/Karachi',
        expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 1,
            startTime: '10:00',
            endTime: '16:00',
            isActive: true,
          }),
        ])
      );
    });
  });

  describe('overrides management', () => {
    it('should add a date override successfully', async () => {
      mockRepo.findProfessionalByUserId.mockResolvedValue(mockDoctor);
      const mockSavedOverride = {
        id: 'override-1',
        professionalId: mockDoctor.id,
        date: new Date('2026-12-25T00:00:00.000Z'),
        isBlocked: true,
        customStartTime: null,
        customEndTime: null,
        reason: 'Christmas Holiday',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepo.upsertOverride.mockResolvedValue(mockSavedOverride);

      const result = await service.addDoctorOverride(mockDoctor.userId, {
        date: '2026-12-25',
        isBlocked: true,
        reason: 'Christmas Holiday',
      });

      expect(result.isBlocked).toBe(true);
      expect(result.date).toBe('2026-12-25');
      expect(result.reason).toBe('Christmas Holiday');
    });

    it('should delete a date override when authorized', async () => {
      mockRepo.findProfessionalByUserId.mockResolvedValue(mockDoctor);
      mockRepo.deleteOverride.mockResolvedValue({ id: 'override-1' });

      await expect(service.deleteDoctorOverride(mockDoctor.userId, 'override-1')).resolves.toBeUndefined();
      expect(mockRepo.deleteOverride).toHaveBeenCalledWith(mockDoctor.id, 'override-1');
    });

    it('should throw NotFoundError when deleting nonexistent or unauthorized override', async () => {
      mockRepo.findProfessionalByUserId.mockResolvedValue(mockDoctor);
      mockRepo.deleteOverride.mockResolvedValue(null);

      await expect(service.deleteDoctorOverride(mockDoctor.userId, 'nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});

