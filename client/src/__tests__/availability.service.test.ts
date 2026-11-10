import { describe, it, expect, vi, beforeEach } from 'vitest';
import { availabilityService } from '../services/availability.service';
import { axiosInstance } from '../api/axios';

vi.mock('../api/axios', () => ({
  axiosInstance: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('availabilityService (Client)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch doctor weekly schedule', async () => {
    const mockSchedule = {
      timezone: 'Asia/Karachi',
      days: [
        { dayOfWeek: 1, isActive: true, windows: [{ startTime: '09:00', endTime: '17:00' }], slotDuration: 30, bufferTime: 5 },
      ],
    };

    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: { success: true, data: mockSchedule },
    });

    const result = await availabilityService.getWeeklySchedule();
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/doctor/availability');
    expect(result.timezone).toBe('Asia/Karachi');
    expect(result.days).toHaveLength(1);
  });

  it('should fetch doctor slots with date range query parameters', async () => {
    const mockSlotsResponse = {
      doctorId: 'doc-123',
      doctorName: 'Dr. Jane Smith',
      specialty: 'Cardiology',
      consultationFee: 150,
      timezone: 'Asia/Karachi',
      slots: [
        {
          startUtc: '2026-11-04T04:00:00.000Z',
          endUtc: '2026-11-04T04:30:00.000Z',
          localStartTime: '09:00',
          localEndTime: '09:30',
          period: 'morning',
        },
      ],
    };

    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: { success: true, data: mockSlotsResponse },
    });

    const result = await availabilityService.getDoctorSlots('doc-123', '2026-11-04', '2026-11-10');
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/api/v1/doctors/doc-123/slots?startDate=2026-11-04&endDate=2026-11-10'
    );
    expect(result.slots).toHaveLength(1);
    expect(result.slots[0].period).toBe('morning');
  });

  it('should create schedule override', async () => {
    const mockOverride = {
      id: 'ov-1',
      professionalId: 'doc-123',
      date: '2026-12-25',
      isBlocked: true,
      customStartTime: null,
      customEndTime: null,
      reason: 'Holiday',
      createdAt: '2026-11-03T00:00:00Z',
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { success: true, data: mockOverride },
    });

    const result = await availabilityService.createOverride({
      date: '2026-12-25',
      isBlocked: true,
      reason: 'Holiday',
    });

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/v1/doctor/availability/overrides', {
      date: '2026-12-25',
      isBlocked: true,
      reason: 'Holiday',
    });
    expect(result.isBlocked).toBe(true);
  });
});

