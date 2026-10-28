import { axiosInstance } from '../api/axios';

export interface PublicDoctor {
  id: string;
  name: string;
  specialty: {
    id: string;
    name: string;
    slug: string;
  } | null;
  bio: string | null;
  consultationFee: number | null;
  yearsOfExperience: number | null;
  verificationStatus: 'APPROVED';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface DoctorProfile {
  id: string;
  profession: string;
  specialtyId: string | null;
  specialty: {
    id: string;
    name: string;
    slug: string;
  } | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  consultationFee: number | null;
  bio: string | null;
  licenseNumber: string | null;
  medicalBoard: string | null;
  yearsOfExperience: number | null;
  credentialDocumentUrl: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDoctorProfilePayload {
  specialtyId?: string;
  consultationFee?: number;
  bio?: string;
  licenseNumber?: string;
  medicalBoard?: string;
  yearsOfExperience?: number;
  credentialDocumentUrl?: string;
}

export interface PendingDoctor {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    isEmailVerified: boolean;
  };
  specialty: {
    id: string;
    name: string;
    slug: string;
  } | null;
  licenseNumber: string | null;
  medicalBoard: string | null;
  yearsOfExperience: number | null;
  credentialDocumentUrl: string | null;
  consultationFee: number | null;
  bio: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const doctorService = {
  // Public directory discovery
  async getPublicDoctors(params?: {
    specialtyId?: string;
    search?: string;
    maxFee?: number;
    page?: number;
    limit?: number;
  }): Promise<{ doctors: PublicDoctor[]; pagination: PaginationMeta }> {
    const res = await axiosInstance.get<PaginatedApiResponse<PublicDoctor>>('/api/doctors', { params });
    return {
      doctors: res.data.data,
      pagination: res.data.pagination,
    };
  },

  // Doctor authenticated /me endpoints
  async getMyDoctorProfile(): Promise<DoctorProfile> {
    const res = await axiosInstance.get<ApiResponse<DoctorProfile>>('/api/professionals/me');
    return res.data.data;
  },

  async updateMyDoctorProfile(payload: UpdateDoctorProfilePayload): Promise<DoctorProfile> {
    const res = await axiosInstance.patch<ApiResponse<DoctorProfile>>('/api/professionals/me', payload);
    return res.data.data;
  },

  // Admin verification endpoints
  async getPendingDoctors(page = 1, limit = 20): Promise<{ pendingDoctors: PendingDoctor[]; pagination: PaginationMeta }> {
    const res = await axiosInstance.get<PaginatedApiResponse<PendingDoctor>>('/api/admin/doctors/pending', {
      params: { page, limit },
    });
    return {
      pendingDoctors: res.data.data,
      pagination: res.data.pagination,
    };
  },

  async approveDoctor(professionalId: string): Promise<ApiResponse<DoctorProfile>> {
    const res = await axiosInstance.patch<ApiResponse<DoctorProfile>>(`/api/admin/doctors/${professionalId}/approve`);
    return res.data;
  },

  async rejectDoctor(professionalId: string, rejectionReason: string): Promise<ApiResponse<DoctorProfile>> {
    const res = await axiosInstance.patch<ApiResponse<DoctorProfile>>(`/api/admin/doctors/${professionalId}/reject`, {
      rejectionReason,
    });
    return res.data;
  },
};
