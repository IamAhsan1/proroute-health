import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { processExpirationJob } from '../appointment-expiration.worker.js';

describe('Appointment Expiration Worker (processExpirationJob)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('expires a PENDING appointment and records audit status history', async () => {
    const appointmentId = 'apt-pending-123';

    const mockFindUnique = vi.fn().mockResolvedValue({
      id: appointmentId,
      status: AppointmentStatus.PENDING,
    });
    const mockUpdate = vi.fn().mockResolvedValue({
      id: appointmentId,
      status: AppointmentStatus.EXPIRED,
    });
    const mockHistoryCreate = vi.fn().mockResolvedValue({
      id: 'history-1',
      appointmentId,
      fromStatus: AppointmentStatus.PENDING,
      toStatus: AppointmentStatus.EXPIRED,
      reason: 'Reservation hold expired after 15 minutes',
    });

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        appointment: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
        appointmentStatusHistory: {
          create: mockHistoryCreate,
        },
      };
      return callback(tx);
    });

    const result = await processExpirationJob(appointmentId);

    expect(result).toBe(true);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: appointmentId },
      select: { id: true, status: true },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.EXPIRED },
    });
    expect(mockHistoryCreate).toHaveBeenCalledWith({
      data: {
        appointmentId,
        fromStatus: AppointmentStatus.PENDING,
        toStatus: AppointmentStatus.EXPIRED,
        reason: 'Reservation hold expired after 15 minutes',
      },
    });
  });

  it('skips expiration when appointment is already CONFIRMED (idempotent no-op)', async () => {
    const appointmentId = 'apt-confirmed-456';

    const mockFindUnique = vi.fn().mockResolvedValue({
      id: appointmentId,
      status: AppointmentStatus.CONFIRMED,
    });
    const mockUpdate = vi.fn();
    const mockHistoryCreate = vi.fn();

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        appointment: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
        appointmentStatusHistory: {
          create: mockHistoryCreate,
        },
      };
      return callback(tx);
    });

    const result = await processExpirationJob(appointmentId);

    expect(result).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockHistoryCreate).not.toHaveBeenCalled();
  });

  it('skips expiration when appointment is already CANCELLED (idempotent no-op)', async () => {
    const appointmentId = 'apt-cancelled-789';

    const mockFindUnique = vi.fn().mockResolvedValue({
      id: appointmentId,
      status: AppointmentStatus.CANCELLED,
    });
    const mockUpdate = vi.fn();
    const mockHistoryCreate = vi.fn();

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        appointment: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
        appointmentStatusHistory: {
          create: mockHistoryCreate,
        },
      };
      return callback(tx);
    });

    const result = await processExpirationJob(appointmentId);

    expect(result).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockHistoryCreate).not.toHaveBeenCalled();
  });

  it('returns false when appointment does not exist in database', async () => {
    const appointmentId = 'apt-non-existent';

    const mockFindUnique = vi.fn().mockResolvedValue(null);
    const mockUpdate = vi.fn();

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        appointment: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      };
      return callback(tx);
    });

    const result = await processExpirationJob(appointmentId);

    expect(result).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

