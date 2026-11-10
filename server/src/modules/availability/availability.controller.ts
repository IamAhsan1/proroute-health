import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { availabilityService, AvailabilityService } from './availability.service.js';
import { CreateOverrideSchema, SetWeeklyScheduleSchema } from './availability.types.js';

export class AvailabilityController {
  constructor(private service: AvailabilityService = availabilityService) {}

  getSchedule = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const schedule = await this.service.getDoctorWeeklySchedule(userId);
      res.status(200).json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  };

  updateSchedule = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const parsed = SetWeeklyScheduleSchema.parse(req.body);
      const schedule = await this.service.setDoctorWeeklySchedule(userId, parsed);
      res.status(200).json({
        success: true,
        message: 'Availability schedule updated successfully',
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  };

  getOverrides = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
      const overrides = await this.service.getDoctorOverrides(userId, startDate, endDate);
      res.status(200).json({ success: true, data: overrides });
    } catch (error) {
      next(error);
    }
  };

  createOverride = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const parsed = CreateOverrideSchema.parse(req.body);
      const override = await this.service.addDoctorOverride(userId, parsed);
      res.status(201).json({
        success: true,
        message: 'Schedule override saved successfully',
        data: override,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteOverride = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await this.service.deleteDoctorOverride(userId, id);
      res.status(200).json({
        success: true,
        message: 'Schedule override removed successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const availabilityController = new AvailabilityController();
