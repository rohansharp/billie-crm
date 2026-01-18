import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEventHistory } from '@/hooks/queries/useEventHistory'
import React from 'react'

const mockFetch = vi.fn()
global.fetch = mockFetch

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockEvents = {
  events: [
    {
      id: 'evt-1',
      timestamp: '2026-01-18T10:00:00Z',
      stream: 'loan-account',
      eventType: 'disbursed',
      version: 1,
      data: { amount: 1000 },
    },
    {
      id: 'evt-2',
      timestamp: '2026-01-18T11:00:00Z',
      stream: 'ecl',
      eventType: 'ecl_recalculated',
      version: 2,
      data: { eclAmount: 50 },
    },
  ],
  nextCursor: 'cursor-abc',
  hasMore: true,
}

describe('useEventHistory', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should fetch event history successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEvents),
    })

    const { result } = renderHook(
      () => useEventHistory({ accountId: 'acc-123', limit: 50 }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.events).toHaveLength(2)
    expect(result.current.data?.hasMore).toBe(true)
  })

  it('should not fetch when accountId is empty', async () => {
    const { result } = renderHook(() => useEventHistory({ accountId: '' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.isFetching).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should apply filters to query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEvents),
    })

    renderHook(
      () =>
        useEventHistory({
          accountId: 'acc-123',
          limit: 25,
          stream: 'ecl',
          eventType: 'ecl_recalculated',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const calledUrl = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('/api/investigation/events/acc-123')
    expect(calledUrl).toContain('limit=25')
    expect(calledUrl).toContain('stream=ecl')
    expect(calledUrl).toContain('eventType=ecl_recalculated')
  })
})
