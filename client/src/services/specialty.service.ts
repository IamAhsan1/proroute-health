import { axiosInstance } from '../api/axios';

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialtiesResponse {
  success: boolean;
  data: Specialty[];
}

export interface SingleSpecialtyResponse {
  success: boolean;
  data: Specialty;
}

export const specialtyService = {
  async getActiveSpecialties(): Promise<Specialty[]> {
    const res = await axiosInstance.get<SpecialtiesResponse>('/api/specialties');
    return res.data.data;
  },

  async getSpecialtyBySlug(slug: string): Promise<Specialty> {
    const res = await axiosInstance.get<SingleSpecialtyResponse>(`/api/specialties/${slug}`);
    return res.data.data;
  },
};
