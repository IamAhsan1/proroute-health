import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminVerificationsPage } from '../pages/AdminVerificationsPage';
import { axiosInstance } from '../../../api/axios';
import { UserProfile } from '../../../api/client';

describe('AdminVerificationsPage Component', () => {
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
  });

  const mockAdminUser: UserProfile = {
    id: 'admin-1',
    email: 'admin@proroute.health',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    isEmailVerified: true,
  };

  const mockPatientUser: UserProfile = {
    id: 'pat-1',
    email: 'patient@example.com',
    role: 'PATIENT',
    createdAt: new Date().toISOString(),
    isEmailVerified: true,
  };

  const mockPendingDoctor = {
    id: 'prof-pending-1',
    user: {
      id: 'user-doc-1',
      name: 'Dr. Gregory House',
      email: 'house@princetonplainsboro.edu',
      isEmailVerified: true,
    },
    specialty: {
      id: 'spec-diag',
      name: 'Diagnostic Medicine',
      slug: 'diagnostics',
    },
    licenseNumber: 'MD-998877',
    medicalBoard: 'State Medical Board',
    yearsOfExperience: 15,
    credentialDocumentUrl: 'https://docs.example.com/license.pdf',
    consultationFee: 250,
    bio: 'Board-certified diagnostician specializing in infectious diseases.',
    verificationStatus: 'PENDING' as const,
    createdAt: new Date().toISOString(),
  };

  it('renders loading state initially while fetching pending queue', () => {
    // Provide pending promise that never resolves during this check
    vi.spyOn(axiosInstance, 'get').mockImplementation(() => new Promise(() => {}));

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminVerificationsPage currentUser={mockAdminUser} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading pending verification queue...')).toBeDefined();
  });

  it('renders pending doctor records successfully in the regulatory audit table', async () => {
    vi.spyOn(axiosInstance, 'get').mockResolvedValue({
      data: {
        success: true,
        data: [mockPendingDoctor],
        pagination: { total: 1, page: 1, limit: 50 },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminVerificationsPage currentUser={mockAdminUser} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Gregory House')).toBeDefined();
    });

    expect(screen.getByText('house@princetonplainsboro.edu')).toBeDefined();
    expect(screen.getByText('MD-998877')).toBeDefined();
    expect(screen.getByText('State Medical Board')).toBeDefined();
    expect(screen.getByText('Diagnostic Medicine')).toBeDefined();
    expect(screen.getByText('Approve')).toBeDefined();
    expect(screen.getByText('Reject')).toBeDefined();
  });

  it('renders "Queue Clear!" empty state when no pending doctors exist', async () => {
    vi.spyOn(axiosInstance, 'get').mockResolvedValue({
      data: {
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 50 },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminVerificationsPage currentUser={mockAdminUser} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Queue Clear!')).toBeDefined();
    });
    expect(screen.getByText(/There are no pending doctor verification applications/i)).toBeDefined();
  });

  it('renders error state when API fails with 500 or network failure', async () => {
    vi.spyOn(axiosInstance, 'get').mockRejectedValue({
      response: {
        data: {
          success: false,
          message: 'Database connection failed',
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminVerificationsPage currentUser={mockAdminUser} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Verification Queue')).toBeDefined();
    });
    expect(screen.getByText('Database connection failed')).toBeDefined();
  });

  it('blocks non-admin users and displays restricted privilege warning', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminVerificationsPage currentUser={mockPatientUser} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Restricted Privilege Area')).toBeDefined();
    expect(screen.getByText('PATIENT')).toBeDefined();
  });
});
