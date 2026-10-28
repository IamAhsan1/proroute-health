import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { specialtyRepository } from '../specialty.repository.js';
import { Specialty } from '@prisma/client';

describe('Specialties API', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockSpecialties: Specialty[] = [
    {
      id: 'spec-uuid-1',
      name: 'Cardiology',
      slug: 'cardiology',
      description: 'Cardiovascular health',
      icon: 'heart-pulse',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'spec-uuid-2',
      name: 'Dermatology',
      slug: 'dermatology',
      description: 'Skin health',
      icon: 'sparkles',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('GET /api/specialties', () => {
    it('should return list of all active specialties with 200 OK', async () => {
      vi.spyOn(specialtyRepository, 'findAllActive').mockResolvedValue(mockSpecialties);

      const res = await request(app).get('/api/specialties');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].slug).toBe('cardiology');
      expect(res.body.data[1].slug).toBe('dermatology');
    });

    it('should return empty list when no active specialties exist', async () => {
      vi.spyOn(specialtyRepository, 'findAllActive').mockResolvedValue([]);

      const res = await request(app).get('/api/specialties');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/specialties/:slug', () => {
    it('should return specific specialty by slug with 200 OK', async () => {
      vi.spyOn(specialtyRepository, 'findBySlug').mockResolvedValue(mockSpecialties[0]);

      const res = await request(app).get('/api/specialties/cardiology');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Cardiology');
      expect(res.body.data.slug).toBe('cardiology');
    });

    it('should return 404 Not Found when specialty slug does not exist', async () => {
      vi.spyOn(specialtyRepository, 'findBySlug').mockResolvedValue(null);

      const res = await request(app).get('/api/specialties/non-existent-specialty');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Specialty 'non-existent-specialty' not found");
    });

    it('should return 404 Not Found when specialty exists but isActive is false', async () => {
      vi.spyOn(specialtyRepository, 'findBySlug').mockResolvedValue({
        ...mockSpecialties[0],
        isActive: false,
      });

      const res = await request(app).get('/api/specialties/cardiology');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Specialty 'cardiology' not found");
    });
  });
});
