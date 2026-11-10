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

export interface AdminSpecialty extends Specialty {
  doctorCount: number;
}

export interface AdminSpecialtiesResponse {
  success: boolean;
  data: AdminSpecialty[];
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const specialtyService = {
  async getActiveSpecialties(): Promise<Specialty[]> {
    const res = await axiosInstance.get<SpecialtiesResponse>('/api/v1/specialties');
    return res.data.data;
  },

  async getSpecialtyBySlug(slug: string): Promise<Specialty> {
    const res = await axiosInstance.get<SingleSpecialtyResponse>(`/api/v1/specialties/${slug}`);
    return res.data.data;
  },

  // Admin endpoints
  async getAllAdminSpecialties(): Promise<AdminSpecialty[]> {
    const res = await axiosInstance.get<AdminSpecialtiesResponse>('/api/v1/specialties/admin/all');
    return res.data.data;
  },

  async createSpecialty(payload: {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
  }): Promise<Specialty> {
    const res = await axiosInstance.post<ActionResponse>('/api/v1/specialties/admin', payload);
    return res.data.data;
  },

  async updateSpecialty(
    id: string,
    payload: {
      name?: string;
      description?: string | null;
      icon?: string | null;
      isActive?: boolean;
    }
  ): Promise<Specialty> {
    const res = await axiosInstance.patch<ActionResponse>(`/api/v1/specialties/admin/${id}`, payload);
    return res.data.data;
  },

  async deleteSpecialty(id: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/specialties/admin/${id}`);
  },
};
