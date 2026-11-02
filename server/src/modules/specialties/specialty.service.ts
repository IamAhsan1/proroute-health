import { NotFoundError, ConflictError } from '../../utils/apiErrors.js';
import { SpecialtyRepository, specialtyRepository } from './specialty.repository.js';
import {
  SpecialtyResponseDto,
  CreateSpecialtyInput,
  UpdateSpecialtyInput,
} from './specialty.types.js';

export class SpecialtyService {
  constructor(private repo: SpecialtyRepository = specialtyRepository) {}

  public async getAllSpecialties(): Promise<SpecialtyResponseDto[]> {
    return this.repo.findAllActive();
  }

  public async getSpecialtyBySlug(slug: string): Promise<SpecialtyResponseDto> {
    const specialty = await this.repo.findBySlug(slug);
    if (!specialty || !specialty.isActive) {
      throw new NotFoundError(`Specialty '${slug}' not found`);
    }
    return specialty;
  }

  public async getAllAdminSpecialties() {
    const specialties = await this.repo.findAllAdmin();
    return specialties.map((item) => ({
      ...item,
      doctorCount: item._count.professionals,
    }));
  }

  public async createSpecialty(input: CreateSpecialtyInput) {
    const existingName = await this.repo.findByName(input.name.trim());
    if (existingName) {
      throw new ConflictError(`Specialty with name '${input.name}' already exists`);
    }

    const slug = (input.slug || input.name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existingSlug = await this.repo.findBySlug(slug);
    if (existingSlug) {
      throw new ConflictError(`Specialty slug '${slug}' already exists`);
    }

    return this.repo.create({
      name: input.name.trim(),
      slug,
      description: input.description?.trim(),
      icon: input.icon?.trim() || 'stethoscope',
    });
  }

  public async updateSpecialty(id: string, input: UpdateSpecialtyInput) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Specialty not found');
    }

    if (input.name && input.name.trim() !== existing.name) {
      const conflict = await this.repo.findByName(input.name.trim());
      if (conflict && conflict.id !== id) {
        throw new ConflictError(`Specialty with name '${input.name}' already exists`);
      }
    }

    return this.repo.update(id, {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description ? input.description.trim() : null }),
      ...(input.icon !== undefined && { icon: input.icon ? input.icon.trim() : null }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });
  }

  public async deleteSpecialty(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Specialty not found');
    }

    const doctorCount = await this.repo.countDoctors(id);
    if (doctorCount > 0) {
      throw new ConflictError(
        `Cannot permanently delete '${existing.name}' because ${doctorCount} doctor(s) are registered under it. You can deactivate it instead.`
      );
    }

    return this.repo.delete(id);
  }
}

export const specialtyService = new SpecialtyService();
