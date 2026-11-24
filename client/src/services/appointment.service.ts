import { axiosInstance } from '../api/axios';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW';

export interface AppointmentParticipantPatient {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  user?: {
    id: string;
    email: string;
  };
}

export interface AppointmentParticipantProfessional {
  id: string;
  userId: string;
  name: string | null;
  timezone: string;
  consultationFee: number | null;
  user?: {
    id: string;
    email: string;
  };
  specialty?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface AppointmentStatusHistoryDto {
  id: string;
  fromStatus: AppointmentStatus | null;
  toStatus: AppointmentStatus;
  changedBy: string | null;
  reason: string | null;
  createdAt: string;
}

export interface AppointmentDto {
  id: string;
  patientId: string;
  professionalId: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: AppointmentStatus;
  consultationFee: number | null;
  notes: string | null;
  cancellationReason: string | null;
  cancelledByRole: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN' | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: AppointmentParticipantPatient;
  professional?: AppointmentParticipantProfessional;
  statusHistory?: AppointmentStatusHistoryDto[];
}

export interface ReserveSlotPayload {
  professionalId: string;
  startTimeUtc: string;
  endTimeUtc: string;
  notes?: string;
}

export interface ListAppointmentsQuery {
  scope?: 'upcoming' | 'past' | 'all';
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface PaginatedAppointmentsResponse {
  success: boolean;
  data: AppointmentDto[];
  pagination: PaginationMeta;
}

export interface SingleAppointmentResponse {
  success: boolean;
  data: AppointmentDto;
  message?: string;
}

export class AppointmentService {
  /**
   * Reserves a consultation slot for the authenticated patient (POST /api/v1/appointments).
   */
  async reserveSlot(payload: ReserveSlotPayload): Promise<AppointmentDto> {
    const res = await axiosInstance.post<SingleAppointmentResponse>('/api/v1/appointments', payload);
    return res.data.data;
  }

  /**
   * Pre-Phase 5 confirmation bridge for PENDING hold (PATCH /api/v1/appointments/:id/confirm).
   */
  async confirmPendingAppointment(appointmentId: string): Promise<AppointmentDto> {
    const res = await axiosInstance.patch<SingleAppointmentResponse>(
      `/api/v1/appointments/${appointmentId}/confirm`
    );
    return res.data.data;
  }

  /**
   * Fetches paginated appointments for the authenticated user (GET /api/v1/appointments/me).
   */
  async getMyAppointments(query: ListAppointmentsQuery = {}): Promise<PaginatedAppointmentsResponse> {
    const params = new URLSearchParams();
    if (query.scope) params.set('scope', query.scope);
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await axiosInstance.get<PaginatedAppointmentsResponse>(
      `/api/v1/appointments/me${queryString}`
    );
    return res.data;
  }

  /**
   * Fetches a single appointment detail by ID (GET /api/v1/appointments/:id).
   */
  async getAppointmentById(appointmentId: string): Promise<AppointmentDto> {
    const res = await axiosInstance.get<SingleAppointmentResponse>(
      `/api/v1/appointments/${appointmentId}`
    );
    return res.data.data;
  }

  /**
   * Cancels an appointment (PATCH /api/v1/appointments/:id/cancel).
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<AppointmentDto> {
    const res = await axiosInstance.patch<SingleAppointmentResponse>(
      `/api/v1/appointments/${appointmentId}/cancel`,
      { reason }
    );
    return res.data.data;
  }

  /**
   * Doctor status transition (PATCH /api/v1/appointments/:id/status).
   */
  async updateStatus(
    appointmentId: string,
    status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW',
    reason?: string
  ): Promise<AppointmentDto> {
    const res = await axiosInstance.patch<SingleAppointmentResponse>(
      `/api/v1/appointments/${appointmentId}/status`,
      { status, reason }
    );
    return res.data.data;
  }
}

export const appointmentService = new AppointmentService();
