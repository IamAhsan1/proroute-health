import { axiosInstance } from './axios';
import { AxiosError } from 'axios';

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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface GoogleAuthPayload {
  idToken: string;
  role?: 'PATIENT' | 'DOCTOR';
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  isEmailVerified?: boolean;
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

export function formatUserFriendlyError(
  body: {
    details?: Array<{ field: string; message: string }>;
    error?: string;
    message?: string;
  },
  status: number
): string {
  // 1. Zod input validation errors -> translate to natural human guidance
  if (body.details && body.details.length > 0) {
    const messages = body.details.map((d) => {
      const field = (d.field || '').toLowerCase();
      const msg = (d.message || '').toLowerCase();

      if (field.includes('password') || msg.includes('password')) {
        if (msg.includes('exceed 128') || msg.includes('too long')) {
          return 'Password is too long (maximum 128 characters).';
        }
        return 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, a number, and a special symbol.';
      }
      if (field.includes('email') || msg.includes('email')) {
        return 'Please enter a valid email address.';
      }
      if (field.includes('name') || msg.includes('name')) {
        return 'Please enter your full name.';
      }
      return d.message;
    });
    return Array.from(new Set(messages)).join(' ');
  }

  const raw = (body.error || body.message || '').trim();

  // 2. HTTP Status Code Fallbacks
  if (status === 413) {
    return 'The submitted request is too large. Please reduce input length and try again.';
  }
  if (status === 429) {
    return 'Too many attempts. Please wait a few moments before trying again.';
  }
  if (status >= 500) {
    return 'Our healthcare platform is momentarily experiencing issues. Please try again shortly.';
  }

  // 3. Natural user-facing mappings for security & auth exceptions
  if (/already exists|already registered|already in use|unique constraint/i.test(raw)) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (/invalid email or password|user not found|incorrect password/i.test(raw)) {
    return 'Incorrect email or password. Please verify your credentials and try again.';
  }
  if (/temporarily locked|account.*locked/i.test(raw)) {
    return 'Your account is temporarily locked for 15 minutes due to multiple failed login attempts. Please reset your password or try again later.';
  }
  if (/google/i.test(raw) && /sign in with google|registered with google/i.test(raw)) {
    return 'This account was created with Google Sign-In. Please click the "Sign in with Google" button.';
  }
  if (/invalid or expired.*reset|reset token.*expired|reset token.*invalid/i.test(raw)) {
    return 'This password reset link has expired or is invalid. Please request a new reset link.';
  }
  if (/invalid or expired.*verif|verification token/i.test(raw)) {
    return 'This email verification link has expired or is invalid. Please request a new verification link.';
  }
  if (/current password is incorrect/i.test(raw)) {
    return 'The current password you entered does not match our records.';
  }
  if (/compromised session|revoked or expired|session expired|unauthorized/i.test(raw)) {
    return 'Your session has expired. Please sign in again.';
  }

  // 4. Suppress generic technical phrases like "Validation Error" or raw HTTP exceptions
  if (/validation error/i.test(raw)) {
    return 'Please check your inputs and ensure all required fields are correctly completed.';
  }

  if (raw && !/http error|error\b/i.test(raw)) {
    return raw;
  }

  return 'A secure connection issue occurred. Please check your network and try again.';
}

async function request<T>(endpoint: string, options: { method?: string; data?: unknown; params?: unknown } = {}): Promise<T> {
  try {
    const res = await axiosInstance.request<T>({
      url: endpoint,
      method: options.method || 'GET',
      data: options.data,
      params: options.params,
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const status = error.response?.status || 500;
      const body = error.response?.data || {};
      throw new Error(formatUserFriendlyError(body, status), { cause: error });
    }
    throw error;
  }
}

export const api = {
  register: (payload: RegisterPayload) =>
    request<ApiResponse<{ user: UserProfile; accessToken: string }>>('/api/auth/register', {
      method: 'POST',
      data: payload,
    }),

  login: (payload: LoginPayload) =>
    request<ApiResponse<{ user: UserProfile; accessToken: string }>>('/api/auth/login', {
      method: 'POST',
      data: payload,
    }),

  logout: () =>
    request<ApiResponse<{ message: string }>>('/api/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<ApiResponse<UserProfile>>('/api/users/me', {
      method: 'GET',
    }),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    request<ApiResponse<{ message: string }>>('/api/auth/forgot-password', {
      method: 'POST',
      data: payload,
    }),

  resetPassword: (payload: ResetPasswordPayload) =>
    request<ApiResponse<{ message: string }>>('/api/auth/reset-password', {
      method: 'POST',
      data: payload,
    }),

  verifyEmail: (payload: VerifyEmailPayload) =>
    request<ApiResponse<{ message: string }>>('/api/auth/verify-email', {
      method: 'POST',
      data: payload,
    }),

  resendVerification: (payload: ResendVerificationPayload) =>
    request<ApiResponse<{ message: string }>>('/api/auth/resend-verification', {
      method: 'POST',
      data: payload,
    }),

  googleAuth: (payload: GoogleAuthPayload) =>
    request<ApiResponse<{ user: UserProfile; accessToken: string }>>('/api/auth/google', {
      method: 'POST',
      data: payload,
    }),

  changePassword: (payload: ChangePasswordPayload) =>
    request<ApiResponse<{ message: string }>>('/api/auth/change-password', {
      method: 'POST',
      data: payload,
    }),
};
