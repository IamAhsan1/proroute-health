import { NotFoundError } from '../../utils/apiErrors.js';
import { SpecialtyRepository, specialtyRepository } from './specialty.repository.js';
import { SpecialtyResponseDto } from './specialty.types.js';

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
}

export const specialtyService = new SpecialtyService();
