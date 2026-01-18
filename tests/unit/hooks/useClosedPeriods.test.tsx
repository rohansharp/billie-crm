import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useClosedPeriods } from '@/hooks/queries/useClosedPeriods'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useClosedPeriods', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should fetch closed periods successfully', async () => {
    const mockData = {
      periods: [
        {
          periodDate: '2025-12-31',
          closedAt: '2026-01-05T10:00:00Z',
          closedBy: 'user-1',
          closedByName: 'John Doe',
          totalAccounts: 1000,
          totalAccruedYield: 50000,
          totalECLAllowance: 25000,
          totalCarryingAmount: 975000,
        },
        {
          periodDate: '2025-11-30',
          closedAt: '2025-12-05T10:00:00Z',
          closedBy: 'user-2',
          closedByName: 'Jane Smith',
          totalAccounts: 980,
          totalAccruedYield: 48000,
          totalECLAllowance: 24000,
          totalCarryingAmount: 960000,
        },
      ],
      lastClosedPeriod: '2025-12-31',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { result } = renderHook(() => useClosedPeriods(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.periods).toHaveLength(2)
    expect(result.current.data?.lastClosedPeriod).toBe('2025-12-31')
    expect(result.current.data?.periods[0].closedByName).toBe('John Doe')
  })

  it('should handle fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useClosedPeriods(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Failed to fetch closed periods')
  })

  it('should return empty array when no periods', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ periods: [], lastClosedPeriod: undefined }),
    })

    const { result } = renderHook(() => useClosedPeriods(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.periods).toHaveLength(0)
    expect(result.current.data?.lastClosedPeriod).toBeUndefined()
  })

  it('should call correct API endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ periods: [], lastClosedPeriod: undefined }),
    })

    renderHook(() => useClosedPeriods(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/period-close/history')
  })
})
