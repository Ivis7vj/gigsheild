import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkerDashboard from '../pages/WorkerDashboard';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../api/client', () => ({
  default: { get: (...args) => mockGet(...args), post: (...args) => mockPost(...args) },
  apiRequest: async (fn) => fn(),
  isDebugMode: () => false,
  normalizeApiError: (error) => ({ message: error?.message || 'error', status: error?.status || null }),
}));

describe('WorkerDashboard', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it('renders data from backend and toggles tab', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { full_name: 'Ramesh Kumar', worker_id: 'WRK1', city: 'Mumbai', zone: 'Zone 1' } })
      .mockResolvedValueOnce({ data: { status: 'Active' } })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: { risk_pulse: { city_score: 20, zones: [] } } })
      .mockResolvedValueOnce({ data: { trust_score: 88, clean_claims: 3 } })
      .mockResolvedValueOnce({ data: { high_risk_today: false } });

    render(<MemoryRouter><WorkerDashboard /></MemoryRouter>);
    expect(await screen.findByText('Ramesh Kumar')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open Analytics' }));
    expect(screen.getByText('Risk analytics')).toBeInTheDocument();
  });

  it('shows error UI when backend fails', async () => {
    mockGet.mockRejectedValue(new Error('Backend down'));
    render(<MemoryRouter><WorkerDashboard /></MemoryRouter>);
    expect(await screen.findByText('Unable to load dashboard')).toBeInTheDocument();
    expect(screen.getByText('Backend down')).toBeInTheDocument();
  });

  it('handles policy toggle action', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { full_name: 'Ramesh Kumar' } })
      .mockResolvedValueOnce({ data: { status: 'Inactive' } })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { trust_score: 80 } })
      .mockResolvedValueOnce({ data: { high_risk_today: false } });
    mockPost.mockResolvedValueOnce({ data: { status: 'Active' } });

    render(<MemoryRouter><WorkerDashboard /></MemoryRouter>);
    await screen.findByText('Ramesh Kumar');
    await userEvent.click(screen.getByRole('button', { name: /Activate policy/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/policy/toggle'));
  });
});
