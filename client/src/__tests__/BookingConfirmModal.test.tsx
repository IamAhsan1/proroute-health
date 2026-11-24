import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { BookingConfirmModal } from '../modules/public/components/booking/BookingConfirmModal';
import { appointmentService } from '../services/appointment.service';

describe('BookingConfirmModal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const mockDoctor = {
    id: 'doc-uuid-1',
    name: 'Dr. Gregory House',
    specialty: { name: 'Cardiology' },
    timezone: 'Asia/Karachi',
    consultationFee: 100,
  };

  const mockSlot = {
    startUtc: '2026-11-20T10:00:00.000Z',
    endUtc: '2026-11-20T10:30:00.000Z',
    localStartTime: '15:00',
    localEndTime: '15:30',
  };

  const renderComponent = (props: { isAuthenticated?: boolean; isOpen?: boolean }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <BookingConfirmModal
            isOpen={props.isOpen ?? true}
            onClose={vi.fn()}
            doctor={mockDoctor}
            slot={mockSlot}
            isAuthenticated={props.isAuthenticated ?? true}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders doctor details, fee, and selected slot time', () => {
    renderComponent({ isAuthenticated: true });

    expect(screen.getByText(/Dr\. Gregory House/i)).toBeDefined();
    expect(screen.getByText(/Cardiology/i)).toBeDefined();
    expect(screen.getByText(/\$100/i)).toBeDefined();
    expect(screen.getByText(/Scheduled Appointment Time/i)).toBeDefined();
  });

  it('displays "Sign In to Book" button when user is unauthenticated', () => {
    renderComponent({ isAuthenticated: false });

    expect(screen.getByText(/Sign In to Book/i)).toBeDefined();
    expect(screen.queryByText(/Confirm & Reserve Slot/i)).toBeNull();
  });

  it('displays "Confirm & Reserve Slot" when authenticated and triggers reserveSlot mutation', async () => {
    const reserveSpy = vi.spyOn(appointmentService, 'reserveSlot').mockResolvedValue({
      id: 'apt-created-1',
      patientId: 'patient-1',
      professionalId: mockDoctor.id,
      startTimeUtc: mockSlot.startUtc,
      endTimeUtc: mockSlot.endUtc,
      status: 'CONFIRMED',
      consultationFee: 100,
      notes: 'Headache',
      cancellationReason: null,
      cancelledByRole: null,
      cancelledAt: null,
      expiresAt: null,
      confirmedAt: '2026-11-20T08:00:00.000Z',
      startedAt: null,
      completedAt: null,
      createdAt: '2026-11-20T08:00:00.000Z',
      updatedAt: '2026-11-20T08:00:00.000Z',
    });

    renderComponent({ isAuthenticated: true });

    const notesInput = screen.getByPlaceholderText(/describe your symptoms/i);
    fireEvent.change(notesInput, { target: { value: 'Headache' } });

    const submitBtn = screen.getByText(/Confirm & Reserve Slot/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reserveSpy).toHaveBeenCalledWith({
        professionalId: mockDoctor.id,
        startTimeUtc: mockSlot.startUtc,
        endTimeUtc: mockSlot.endUtc,
        notes: 'Headache',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Appointment Confirmed!/i)).toBeDefined();
    });
  });

  it('handles 409 Conflict with inline error feedback and slot cache invalidation', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    vi.spyOn(appointmentService, 'reserveSlot').mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          success: false,
          error: 'This time slot is already reserved or booked',
          code: 'SLOT_ALREADY_BOOKED',
          requestId: 'req-409-conflict-abc',
        },
      },
    });

    renderComponent({ isAuthenticated: true });

    const submitBtn = screen.getByText(/Confirm & Reserve Slot/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Time Slot Already Reserved/i)).toBeDefined();
    });

    expect(
      screen.getByText(/This time slot was just reserved by another patient/i)
    ).toBeDefined();

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['doctor-slots', mockDoctor.id],
    });
  });
});
