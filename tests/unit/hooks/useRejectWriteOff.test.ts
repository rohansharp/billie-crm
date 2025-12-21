import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRejectWriteOff } from '@/hooks/mutations/useRejectWriteOff'
import { MIN_APPROVAL_COMMENT_LENGTH } from '@/lib/constants'
import React from 'react'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Create a fresh query client for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  }
}

describe('useRejectWriteOff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('should expose mutation functions and states', () => {
    const { result } = renderHook(() => useRejectWriteOff(), {
      wrapper: createWrapper(),
    })

    expect(result.current.rejectRequest).toBeDefined()
    expect(result.current.rejectRequestAsync).toBeDefined()
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('should call correct API endpoint with PATCH method', async () => {
    const mockResponse = {
      doc: {
        id: 'req-123',
        requestNumber: 'WO-TEST-001',
        status: 'rejected',
        approvalDetails: {
          decidedBy: 'user-1',
          decidedByName: 'Test User',
          decidedAt: '2025-12-11T00:00:00Z',
          comment: 'Rejected for testing',
        },
      },
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useRejectWriteOff(), {
      wrapper: createWrapper(),
    })

    await result.current.rejectRequestAsync({
      requestId: 'req-123',
      reason: 'Rejected for testing',
      rejectorId: 'user-1',
      rejectorName: 'Test User',
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/write-off-requests/req-123',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('should validate reason length before API call', async () => {
    const { result } = renderHook(() => useRejectWriteOff(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.rejectRequestAsync({
        requestId: 'req-123',
        reason: 'Short', // Less than MIN_APPROVAL_COMMENT_LENGTH
        rejectorId: 'user-1',
      })
    ).rejects.toThrow(`Rejection reason must be at least ${MIN_APPROVAL_COMMENT_LENGTH} characters`)

    // Should NOT have called fetch
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should set isPending to true during mutation', async () => {
    let resolvePromise: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(pendingPromise)

    const { result } = renderHook(() => useRejectWriteOff(), {
      wrapper: createWrapper(),
    })

    // Start mutation
    result.current.rejectRequest({
      requestId: 'req-123',
      reason: 'Valid rejection reason',
      rejectorId: 'user-1',
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ doc: { requestNumber: 'WO-TEST' } }),
    })
  })

  it('should handle API errors gracefully', async () => {
    // Mock both initial call and retry (hook has retry: 1)
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Not authorized' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Not authorized' }),
      })

    const { result } = renderHook(() => useRejectWriteOff(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.rejectRequestAsync({
        requestId: 'req-123',
        reason: 'Valid rejection reason',
        rejectorId: 'user-1',
      })
    ).rejects.toThrow('Not authorized')
  })

  it('should send status as rejected in API call', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ doc: { requestNumber: 'WO-TEST' } }),
    })

    const { result } = renderHook(() => useRejectWriteOff(), {
      wrapper: createWrapper(),
    })

    await result.current.rejectRequestAsync({
      requestId: 'req-123',
      reason: 'This request is rejected',
      rejectorId: 'user-1',
    })

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(options.body)

    expect(body.status).toBe('rejected')
    expect(body.approvalDetails.comment).toBe('This request is rejected')
  })
})
