import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { specialtyService, SpecialtyService } from './specialty.service.js';
import {
  specialtyParamsSchema,
  specialtyIdParamSchema,
  createSpecialtySchema,
  updateSpecialtySchema,
} from './specialty.types.js';

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

  public getAllAdmin = asyncHandler(async (_req: Request, res: Response) => {
    const specialties = await this.service.getAllAdminSpecialties();
    res.status(200).json({
      success: true,
      data: specialties,
    });
  });

  public createSpecialty = asyncHandler(async (req: Request, res: Response) => {
    const input = createSpecialtySchema.parse(req.body);
    const created = await this.service.createSpecialty(input);
    res.status(201).json({
      success: true,
      data: created,
      message: `Medical specialty '${created.name}' created successfully.`,
    });
  });

  public updateSpecialty = asyncHandler(async (req: Request, res: Response) => {
    const { id } = specialtyIdParamSchema.parse(req.params);
    const input = updateSpecialtySchema.parse(req.body);
    const updated = await this.service.updateSpecialty(id, input);
    res.status(200).json({
      success: true,
      data: updated,
      message: `Specialty '${updated.name}' updated successfully.`,
    });
  });

  public deleteSpecialty = asyncHandler(async (req: Request, res: Response) => {
    const { id } = specialtyIdParamSchema.parse(req.params);
    await this.service.deleteSpecialty(id);
    res.status(200).json({
      success: true,
      message: 'Specialty deleted successfully.',
    });
  });
}

export const specialtyController = new SpecialtyController();
