export interface RegisterPayload {
  email: string;
  password: string;
  role: 'PATIENT' | 'DOCTOR';
  name: string;
  phone?: string;
  bio?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  patient?: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  professional?: {
    id: string;
    profession: string;
    specialtyId: string | null;
    verificationStatus: string;
    consultationFee: number | null;
    bio: string | null;
  } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Array<{ field: string; message: string }>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    credentials: 'include', // Essential for HttpOnly cookie transport
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg =
      body.details?.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join(', ') ||
      body.error ||
      `HTTP Error ${res.status}`;
    throw new Error(errorMsg);
  }

  return body;
}

export const api = {
  register: (payload: RegisterPayload) =>
    request<ApiResponse<{ user: UserProfile; accessToken: string }>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    request<ApiResponse<{ user: UserProfile; accessToken: string }>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<ApiResponse<{ message: string }>>('/api/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<ApiResponse<UserProfile>>('/api/users/me', {
      method: 'GET',
    }),
};
