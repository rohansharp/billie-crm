import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useLedgerHealth, ledgerHealthQueryKey } from '@/hooks/queries/useLedgerHealth'

// Create query client wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const mockHealthResponse = {
  status: 'connected',
  latencyMs: 150,
  message: 'Ledger Connected',
  checkedAt: '2025-12-11T10:00:00Z',
}

describe('useLedgerHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Query Key', () => {
    it('should have correct query key structure', () => {
      expect(ledgerHealthQueryKey).toEqual(['ledger', 'health'])
    })
  })

  describe('Hook Behavior', () => {
    it('should fetch health on mount', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      })

      const { result } = renderHook(() => useLedgerHealth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/ledger/health')
    })

    it('should return loading state initially', () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useLedgerHealth(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should return connected status', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockHealthResponse, status: 'connected' }),
      })

      const { result } = renderHook(() => useLedgerHealth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      expect(result.current.message).toBe('Ledger Connected')
    })

    it('should return degraded status', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'degraded',
            latencyMs: 2500,
            message: 'Ledger Degraded - some operations may be slow',
            checkedAt: '2025-12-11T10:00:00Z',
          }),
      })

      const { result } = renderHook(() => useLedgerHealth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('degraded')
      })

      expect(result.current.latencyMs).toBe(2500)
    })

    it('should return offline status', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'offline',
            latencyMs: 0,
            message: 'Ledger Offline - read-only mode active',
            checkedAt: '2025-12-11T10:00:00Z',
          }),
      })

      const { result } = renderHook(() => useLedgerHealth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('offline')
      })
    })

    it('should return offline when fetch fails', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() => useLedgerHealth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('offline')
      })
    })

    it('should expose refetch function', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      })

      const { result } = renderHook(() => useLedgerHealth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('connected')
      })

      expect(typeof result.current.refetch).toBe('function')
    })

    it('should expose latencyMs', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockHealthResponse, latencyMs: 350 }),
      })

      const { result } = renderHook(() => useLedgerHealth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.latencyMs).toBe(350)
      })
    })
  })

  describe('Options', () => {
    it('should disable polling when enabled is false', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      })

      const { result } = renderHook(() => useLedgerHealth({ enabled: false }), {
        wrapper: createWrapper(),
      })

      // Should not fetch when disabled
      expect(result.current.isLoading).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
