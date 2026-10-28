import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { specialtyService, SpecialtyService } from './specialty.service.js';
import { specialtyParamsSchema } from './specialty.types.js';

export class SpecialtyController {
  constructor(private service: SpecialtyService = specialtyService) {}

  public getSpecialties = asyncHandler(async (_req: Request, res: Response) => {
    const specialties = await this.service.getAllSpecialties();
    res.status(200).json({
      success: true,
      data: specialties,
    });
  });

  public getSpecialtyBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = specialtyParamsSchema.parse(req.params);
    const specialty = await this.service.getSpecialtyBySlug(slug);
    res.status(200).json({
      success: true,
      data: specialty,
    });
  });
}

export const specialtyController = new SpecialtyController();
