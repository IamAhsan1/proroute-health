import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DoctorDirectoryPage } from '../pages/DoctorDirectoryPage';
import { axiosInstance } from '../../../api/axios';

describe('DoctorDirectoryPage Component', () => {
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

  const mockSpecialties = [
    {
      id: 'spec-cardio',
      name: 'Cardiology',
      slug: 'cardiology',
      description: 'Heart care',
      icon: 'cardiology',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockDoctors = [
    {
      id: 'doc-101',
      name: 'Dr. Sarah Connor',
      specialty: {
        id: 'spec-cardio',
        name: 'Cardiology',
        slug: 'cardiology',
      },
      bio: 'Leading cardiologist with 10 years experience',
      consultationFee: 180,
      yearsOfExperience: 10,
      verificationStatus: 'APPROVED',
    },
  ];

  it('renders doctor cards correctly when data is returned from API', async () => {
    vi.spyOn(axiosInstance, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/specialties') {
        return { data: { success: true, data: mockSpecialties } };
      }
      if (url === '/api/doctors') {
        return {
          data: {
            success: true,
            data: mockDoctors,
            pagination: { total: 1, page: 1, limit: 20 },
          },
        };
      }
      return { data: { success: true, data: [] } };
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DoctorDirectoryPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Sarah Connor')).toBeDefined();
    });

    // Specialty appears both as a filter chip and in the doctor card badge
    expect(screen.getAllByText('Cardiology').length).toBeGreaterThanOrEqual(2);
    // Fee is formatted with 2 decimal places ($180.00)
    expect(screen.getByText('$180.00')).toBeDefined();
    // Clinical experience text
    expect(screen.getByText(/10 years clinical exp/i)).toBeDefined();
    // Action button
    expect(screen.getByText('Book Slot')).toBeDefined();
  });

  it('renders empty state when no doctors match query', async () => {
    vi.spyOn(axiosInstance, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/specialties') {
        return { data: { success: true, data: mockSpecialties } };
      }
      if (url === '/api/doctors') {
        return {
          data: {
            success: true,
            data: [],
            pagination: { total: 0, page: 1, limit: 20 },
          },
        };
      }
      return { data: { success: true, data: [] } };
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DoctorDirectoryPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No Verified Doctors Found')).toBeDefined();
    });
    expect(screen.getByText('Reset all filters')).toBeDefined();
  });
});
