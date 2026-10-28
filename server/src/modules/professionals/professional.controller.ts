import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  professionalService,
  ProfessionalService,
} from './professional.service.js';
import { updateProfessionalProfileSchema } from './professional.types.js';

const doctorSearchQuerySchema = z.object({
  specialty: z.string().optional(),
  search: z.string().optional(),
  minFee: z.coerce.number().min(0).optional(),
  maxFee: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const adminPendingQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(50, 'Limit cannot exceed 50').default(20),
});

const adminActionParamsSchema = z.object({
  id: z.string().uuid('Invalid professional ID'),
});

const rejectBodySchema = z.object({
  rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters').max(500),
});

export class ProfessionalController {
  constructor(private service: ProfessionalService = professionalService) {}

  public getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await this.service.getProfileByUserId(req.user!.id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  });

  public updateMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = updateProfessionalProfileSchema.parse(req.body);
    const updated = await this.service.updateProfile(req.user!.id, data);
    res.status(200).json({
      success: true,
      data: updated,
      message: 'Professional profile updated successfully',
    });
  });

  public getPending = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = adminPendingQuerySchema.parse(req.query);

    const result = await this.service.getPendingDoctors(page, limit);
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

  public approveDoctor = asyncHandler(async (req: Request, res: Response) => {
    const { id } = adminActionParamsSchema.parse(req.params);
    const approved = await this.service.approveDoctor(id);
    res.status(200).json({
      success: true,
      data: approved,
      message: 'Doctor approved successfully. Doctor is now visible in public directory.',
    });
  });

  public rejectDoctor = asyncHandler(async (req: Request, res: Response) => {
    const { id } = adminActionParamsSchema.parse(req.params);
    const { rejectionReason } = rejectBodySchema.parse(req.body);
    const rejected = await this.service.rejectDoctor(id, rejectionReason);
    res.status(200).json({
      success: true,
      data: rejected,
      message: 'Doctor application rejected.',
    });
  });

  public getApprovedDoctors = asyncHandler(async (req: Request, res: Response) => {
    const query = doctorSearchQuerySchema.parse(req.query);
    const result = await this.service.getApprovedDoctors({
      specialtySlug: query.specialty,
      search: query.search,
      minFee: query.minFee,
      maxFee: query.maxFee,
      page: query.page,
      limit: query.limit,
    });

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
}

export const professionalController = new ProfessionalController();
