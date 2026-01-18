import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useECLConfig } from '@/hooks/queries/useECLConfig'
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

const mockConfig = {
  overlayMultiplier: 1.2,
  overlayUpdatedAt: '2026-01-10T10:00:00Z',
  overlayUpdatedBy: 'user-1',
  overlayUpdatedByName: 'John Doe',
  pdRates: [
    { bucket: 'CURRENT', rate: 0.01, updatedAt: '2026-01-10T10:00:00Z', updatedBy: 'user-1' },
    { bucket: 'BUCKET_1', rate: 0.05, updatedAt: '2026-01-10T10:00:00Z', updatedBy: 'user-1' },
    { bucket: 'BUCKET_2', rate: 0.15, updatedAt: '2026-01-10T10:00:00Z', updatedBy: 'user-1' },
    { bucket: 'BUCKET_3', rate: 0.35, updatedAt: '2026-01-10T10:00:00Z', updatedBy: 'user-1' },
  ],
  lgd: 0.6,
}

describe('useECLConfig', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should fetch ECL config successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConfig),
    })

    const { result } = renderHook(() => useECLConfig(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.overlayMultiplier).toBe(1.2)
    expect(result.current.data?.pdRates).toHaveLength(4)
    expect(result.current.data?.lgd).toBe(0.6)
  })

  it('should handle fetch error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    const { result } = renderHook(() => useECLConfig(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Failed to fetch ECL configuration')
  })

  it('should call correct API endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConfig),
    })

    renderHook(() => useECLConfig(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/ecl-config')
  })
})
