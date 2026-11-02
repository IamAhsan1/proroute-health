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

  public async findByName(name: string): Promise<Specialty | null> {
    return prisma.specialty.findUnique({
      where: { name },
    });
  }

  public async findAllAdmin(): Promise<(Specialty & { _count: { professionals: number } })[]> {
    return prisma.specialty.findMany({
      include: {
        _count: {
          select: { professionals: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  public async create(data: {
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
  }): Promise<Specialty> {
    return prisma.specialty.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || null,
        isActive: true,
      },
    });
  }

  public async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string | null;
      icon: string | null;
      isActive: boolean;
    }>
  ): Promise<Specialty> {
    return prisma.specialty.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<Specialty> {
    return prisma.specialty.delete({
      where: { id },
    });
  }

  public async countDoctors(specialtyId: string): Promise<number> {
    return prisma.professional.count({
      where: { specialtyId },
    });
  }
}

export const specialtyRepository = new SpecialtyRepository();
