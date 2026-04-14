import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Analytics from '../pages/Analytics';

const mockGet = vi.fn();

vi.mock('../api/client', () => ({
  default: { get: (...args) => mockGet(...args) },
  apiRequest: async (fn) => fn(),
  normalizeApiError: (error) => ({ message: error?.message || 'error', status: error?.status || null }),
}));

describe('Analytics page', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('renders analytics with heatmap labels', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        total_premium: 400,
        total_payout: 300,
        disruptions_count: 2,
        risk_trends: [{ week: 'Week 1', score: 20 }],
        calendar_map: [{ date: '2026-04-10', disruption: 'Heavy Rainfall' }],
      },
    });

    render(<MemoryRouter><Analytics /></MemoryRouter>);
    expect(await screen.findByText('Disruption Heatmap')).toBeInTheDocument();
    expect(screen.getByText(/Time Zone: IST/)).toBeInTheDocument();
  });

  it('shows API failure state', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network unreachable'));
    render(<MemoryRouter><Analytics /></MemoryRouter>);
    expect(await screen.findByText('Analytics unavailable')).toBeInTheDocument();
  });
});
