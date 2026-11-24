import { Request } from 'express';
import { Role, UserStatus } from '@prisma/client';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  status?: UserStatus;
  isEmailVerified?: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  isEmailVerified: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface UserResponseDto {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  isEmailVerified: boolean;
  hasPassword?: boolean;
  createdAt: Date;
  patient?: {
    id: string;
    name: string;
    phone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    bloodGroup: string | null;
    allergies: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  } | null;
  professional?: {
    id: string;
    name: string | null;
    profession: string;
    specialtyId: string | null;
    verificationStatus: string;
    consultationFee: number | null;
    bio: string | null;
  } | null;
}
