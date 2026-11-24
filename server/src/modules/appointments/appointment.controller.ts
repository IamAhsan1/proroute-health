import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { appointmentService, AppointmentService } from './appointment.service.js';
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentStatusSchema,
} from './appointment.types.js';

const appointmentIdParamsSchema = z.object({
  id: z.string().uuid('Invalid appointment ID'),
});

export class AppointmentController {
  constructor(private service: AppointmentService = appointmentService) {}

  public reserveSlot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const input = createAppointmentSchema.parse(req.body);
    const appointment = await this.service.reserveSlot(req.user!.id, input);

    res.status(201).json({
      success: true,
      data: appointment,
      message:
        appointment.status === 'CONFIRMED'
          ? 'Appointment confirmed successfully'
          : 'Slot reserved for 15 minutes. Please confirm your booking.',
    });
  });

  public listMyAppointments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = listAppointmentsQuerySchema.parse(req.query);
    const result = await this.service.listMyAppointments(req.user!.id, req.user!.role, query);

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  });

  public getAppointmentById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = appointmentIdParamsSchema.parse(req.params);
    const appointment = await this.service.getAppointmentById(req.user!.id, req.user!.role, id);

    res.status(200).json({
      success: true,
      data: appointment,
    });
  });

  public cancelAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = appointmentIdParamsSchema.parse(req.params);
    const { reason } = cancelAppointmentSchema.parse(req.body ?? {});
    const updated = await this.service.cancelAppointment(req.user!.id, req.user!.role, id, reason);

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Appointment cancelled successfully',
    });
  });

  public confirmPendingAppointment = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = appointmentIdParamsSchema.parse(req.params);
      const updated = await this.service.confirmPendingAppointment(
        req.user!.id,
        req.user!.role,
        id
      );

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Appointment confirmed successfully',
      });
    }
  );

  public updateLifecycleStatus = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = appointmentIdParamsSchema.parse(req.params);
      const { status, reason } = updateAppointmentStatusSchema.parse(req.body);
      const updated = await this.service.updateLifecycleStatus(req.user!.id, id, status, reason);

      res.status(200).json({
        success: true,
        data: updated,
        message: `Appointment status updated to ${updated.status}`,
      });
    }
  );
}

export const appointmentController = new AppointmentController();
