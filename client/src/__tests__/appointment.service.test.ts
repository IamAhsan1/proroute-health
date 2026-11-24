import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appointmentService, AppointmentDto } from '../services/appointment.service';
import { axiosInstance } from '../api/axios';

describe('appointmentService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockAppointment: AppointmentDto = {
    id: 'apt-101',
    patientId: 'patient-1',
    professionalId: 'doc-1',
    startTimeUtc: '2026-11-20T09:00:00.000Z',
    endTimeUtc: '2026-11-20T09:30:00.000Z',
    status: 'PENDING',
    consultationFee: 150,
    notes: 'Initial checkup',
    cancellationReason: null,
    cancelledByRole: null,
    cancelledAt: null,
    expiresAt: '2026-11-20T09:15:00.000Z',
    confirmedAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: '2026-11-20T08:50:00.000Z',
    updatedAt: '2026-11-20T08:50:00.000Z',
    professional: {
      id: 'doc-1',
      userId: 'u-doc-1',
      name: 'Dr. Sarah Connor',
      timezone: 'Asia/Karachi',
      consultationFee: 150,
    },
  };

  it('reserveSlot sends POST to /api/v1/appointments and returns unpacked data', async () => {
    const postSpy = vi.spyOn(axiosInstance, 'post').mockResolvedValue({
      data: {
        success: true,
        data: mockAppointment,
      },
    });

    const payload = {
      professionalId: 'doc-1',
      startTimeUtc: '2026-11-20T09:00:00.000Z',
      endTimeUtc: '2026-11-20T09:30:00.000Z',
      notes: 'Initial checkup',
    };

    const result = await appointmentService.reserveSlot(payload);

    expect(postSpy).toHaveBeenCalledWith('/api/v1/appointments', payload);
    expect(result.id).toBe('apt-101');
    expect(result.status).toBe('PENDING');
  });

  it('confirmPendingAppointment sends PATCH to /api/v1/appointments/:id/confirm', async () => {
    const confirmedMock = { ...mockAppointment, status: 'CONFIRMED' as const };
    const patchSpy = vi.spyOn(axiosInstance, 'patch').mockResolvedValue({
      data: {
        success: true,
        data: confirmedMock,
      },
    });

    const result = await appointmentService.confirmPendingAppointment('apt-101');

    expect(patchSpy).toHaveBeenCalledWith('/api/v1/appointments/apt-101/confirm');
    expect(result.status).toBe('CONFIRMED');
  });

  it('getMyAppointments sends GET to /api/v1/appointments/me with query string', async () => {
    const getSpy = vi.spyOn(axiosInstance, 'get').mockResolvedValue({
      data: {
        success: true,
        data: [mockAppointment],
        pagination: { total: 1, page: 2, limit: 10, totalPages: 1 },
      },
    });

    const result = await appointmentService.getMyAppointments({
      scope: 'upcoming',
      page: 2,
      limit: 10,
    });

    expect(getSpy).toHaveBeenCalledWith(
      '/api/v1/appointments/me?scope=upcoming&page=2&limit=10'
    );
    expect(result.data).toHaveLength(1);
    expect(result.pagination.page).toBe(2);
  });

  it('getAppointmentById sends GET to /api/v1/appointments/:id', async () => {
    const getSpy = vi.spyOn(axiosInstance, 'get').mockResolvedValue({
      data: {
        success: true,
        data: mockAppointment,
      },
    });

    const result = await appointmentService.getAppointmentById('apt-101');

    expect(getSpy).toHaveBeenCalledWith('/api/v1/appointments/apt-101');
    expect(result.id).toBe('apt-101');
  });

  it('cancelAppointment sends PATCH to /api/v1/appointments/:id/cancel with reason', async () => {
    const cancelledMock = {
      ...mockAppointment,
      status: 'CANCELLED' as const,
      cancellationReason: 'Emergency reschedule',
    };
    const patchSpy = vi.spyOn(axiosInstance, 'patch').mockResolvedValue({
      data: {
        success: true,
        data: cancelledMock,
      },
    });

    const result = await appointmentService.cancelAppointment(
      'apt-101',
      'Emergency reschedule'
    );

    expect(patchSpy).toHaveBeenCalledWith(
      '/api/v1/appointments/apt-101/cancel',
      { reason: 'Emergency reschedule' }
    );
    expect(result.status).toBe('CANCELLED');
  });

  it('updateStatus sends PATCH to /api/v1/appointments/:id/status', async () => {
    const inProgressMock = {
      ...mockAppointment,
      status: 'IN_PROGRESS' as const,
    };
    const patchSpy = vi.spyOn(axiosInstance, 'patch').mockResolvedValue({
      data: {
        success: true,
        data: inProgressMock,
      },
    });

    const result = await appointmentService.updateStatus('apt-101', 'IN_PROGRESS');

    expect(patchSpy).toHaveBeenCalledWith(
      '/api/v1/appointments/apt-101/status',
      { status: 'IN_PROGRESS', reason: undefined }
    );
    expect(result.status).toBe('IN_PROGRESS');
  });
});
