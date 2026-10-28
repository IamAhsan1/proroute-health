import { Specialty } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export class SpecialtyRepository {
  public async findAllActive(): Promise<Specialty[]> {
    return prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  public async findBySlug(slug: string): Promise<Specialty | null> {
    return prisma.specialty.findUnique({
      where: { slug },
    });
  }

  public async findById(id: string): Promise<Specialty | null> {
    return prisma.specialty.findUnique({
      where: { id },
    });
  }
}

export const specialtyRepository = new SpecialtyRepository();
