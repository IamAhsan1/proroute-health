import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { doctorService } from '../../../services/doctor.service';
import { specialtyService } from '../../../services/specialty.service';
import { UserProfile } from '../../../api/client';

describe('AdminDashboardPage Component (ADMIN vs SUPER_ADMIN)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.spyOn(doctorService, 'getPendingDoctors').mockResolvedValue({
      pendingDoctors: [],
      pagination: { total: 3, page: 1, limit: 50, totalPages: 1 },
    });

    vi.spyOn(doctorService, 'getPublicDoctors').mockResolvedValue({
      doctors: [],
      pagination: { total: 12, page: 1, limit: 1, totalPages: 12 },
    });

    vi.spyOn(specialtyService, 'getAllAdminSpecialties').mockResolvedValue([
      {
        id: 'spec-1',
        name: 'Cardiology',
        slug: 'cardiology',
        description: null,
        icon: null,
        isActive: true,
        doctorCount: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'spec-2',
        name: 'Dermatology',
        slug: 'dermatology',
        description: null,
        icon: null,
        isActive: false,
        doctorCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  });

  const adminUser: UserProfile = {
    id: 'admin-1',
    email: 'opsadmin@proroute.health',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    isEmailVerified: true,
  };

  const superAdminUser: UserProfile = {
    id: 'superadmin-1',
    email: 'root@proroute.health',
    role: 'SUPER_ADMIN',
    createdAt: new Date().toISOString(),
    isEmailVerified: true,
  };

  it('renders Clinical Operations overview for ADMIN without Super Admin Governance cards', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminDashboardPage currentUser={adminUser} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Admin Operations Console')).toBeDefined();
    expect(screen.getByText('Welcome back, opsadmin')).toBeDefined();
    expect(screen.getByText('Clinical Operations Role')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('3 Doctors')).toBeDefined();
      expect(screen.getByText('12 Active')).toBeDefined();
      expect(screen.getByText('1 / 2')).toBeDefined();
    });

    expect(screen.getByText('Doctor Verification Queue')).toBeDefined();
    expect(screen.getByText('Medical Specialties')).toBeDefined();
    expect(screen.getByText('Bookings & Appointments')).toBeDefined();
    expect(screen.queryByText('SUPER_ADMIN ONLY')).toBeNull();
    expect(screen.queryByText('Financials & Payout Ledger')).toBeNull();
  });

  it('renders Super Admin Governance overview and exclusive cards for SUPER_ADMIN', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminDashboardPage currentUser={superAdminUser} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Super Admin Governance')).toBeDefined();
    expect(screen.getByText('Welcome back, root')).toBeDefined();
    expect(screen.getByText('Root Privilege • Full System Access')).toBeDefined();
    expect(screen.getByText('SUPER_ADMIN ONLY')).toBeDefined();
    expect(screen.getByText('Financials & Payout Ledger')).toBeDefined();
    expect(screen.getByText('Compliance & Security Audit Logs')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Review Queue (3)')).toBeDefined();
    });
  });
});

