import { axiosInstance } from '../api/axios';

export interface TimeWindow {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isActive: boolean;
  windows: TimeWindow[];
  slotDuration: 15 | 30 | 45 | 60;
  bufferTime: 0 | 5 | 10 | 15;
}

export interface WeeklySchedule {
  timezone: string;
  days: DaySchedule[];
}

export interface ScheduleOverride {
  id: string;
  professionalId: string;
  date: string; // YYYY-MM-DD
  isBlocked: boolean;
  customStartTime: string | null;
  customEndTime: string | null;
  reason: string | null;
  createdAt: string;
}

export interface SlotDto {
  startUtc: string;
  endUtc: string;
  localStartTime: string;
  localEndTime: string;
  period: 'morning' | 'afternoon' | 'evening';
}

export interface DoctorSlotsResponse {
  doctorId: string;
  doctorName: string;
  specialty: string | null;
  consultationFee: number | null;
  timezone: string;
  slots: SlotDto[];
}

export const availabilityService = {
  async getWeeklySchedule(): Promise<WeeklySchedule> {
    const res = await axiosInstance.get<{ success: boolean; data: WeeklySchedule }>(
      '/api/v1/doctor/availability'
    );
    return res.data.data;
  },

  async updateWeeklySchedule(payload: WeeklySchedule): Promise<WeeklySchedule> {
    const res = await axiosInstance.put<{ success: boolean; data: WeeklySchedule }>(
      '/api/v1/doctor/availability',
      payload
    );
    return res.data.data;
  },

  async getOverrides(startDate?: string, endDate?: string): Promise<ScheduleOverride[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await axiosInstance.get<{ success: boolean; data: ScheduleOverride[] }>(
      `/api/v1/doctor/availability/overrides?${params.toString()}`
    );
    return res.data.data;
  },

  async createOverride(payload: {
    date: string;
    isBlocked: boolean;
    customStartTime?: string | null;
    customEndTime?: string | null;
    reason?: string | null;
  }): Promise<ScheduleOverride> {
    const res = await axiosInstance.post<{ success: boolean; data: ScheduleOverride }>(
      '/api/v1/doctor/availability/overrides',
      payload
    );
    return res.data.data;
  },

  async deleteOverride(id: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/doctor/availability/overrides/${id}`);
  },

  async getDoctorSlots(
    doctorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DoctorSlotsResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await axiosInstance.get<{ success: boolean; data: DoctorSlotsResponse }>(
      `/api/v1/doctors/${doctorId}/slots?${params.toString()}`
    );
    return res.data.data;
  },

  async getDoctorById(doctorId: string) {
    const res = await axiosInstance.get<{ success: boolean; data: any }>(
      `/api/v1/doctors/${doctorId}`
    );
    return res.data.data;
  },
};

