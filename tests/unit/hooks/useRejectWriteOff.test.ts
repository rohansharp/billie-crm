import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
    warning: vi.fn(),
  },
}))

// Mock error toast utility
vi.mock('@/lib/utils/error-toast', () => ({
  showErrorToast: vi.fn(),
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
    vi.useFakeTimers()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('should call command API endpoint with POST method', async () => {
    // Mock command API response (202 Accepted)
    const commandResponse = {
      eventId: 'evt-456',
      requestId: 'req-456',
      status: 'accepted',
      message: 'Event accepted',
    }

    // Mock polling response (projection found)
    const projectionResponse = {
      docs: [{
        id: 'doc-456',
        requestNumber: 'WO-TEST-002',
        requestId: 'req-456',
        status: 'rejected',
        approvalDetails: {
          rejectedBy: 'user-2',
          rejectedByName: 'Supervisor',
          rejectedAt: '2025-12-11T00:00:00Z',
          reason: 'Insufficient documentation',
        },
      }],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(commandResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(projectionResponse),
      })

    const { result } = renderHook(() => useRejectWriteOff(), {
      wrapper: createWrapper(),
    })

    const rejectPromise = result.current.rejectRequestAsync({
      requestId: 'req-456',
      requestNumber: 'WO-TEST-002',
      reason: 'Insufficient documentation',
    })

    // Fast-forward timers for polling
    await vi.runAllTimersAsync()

    await rejectPromise

    // Verify command API was called
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/commands/writeoff/reject',
      expect.objectContaining({
        method: 'POST',
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
        requestId: 'req-456',
        requestNumber: 'WO-TEST-002',
        reason: 'No docs', // Less than MIN_APPROVAL_COMMENT_LENGTH
      })
    ).rejects.toThrow(`Rejection reason must be at least ${MIN_APPROVAL_COMMENT_LENGTH} characters`)

    // Should NOT have called fetch
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should start in non-pending state', () => {
    const { result } = renderHook(() => useRejectWriteOff(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)
  })

  it('should handle command API errors gracefully', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Forbidden' } }),
    })

    const { result } = renderHook(() => useRejectWriteOff(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.rejectRequestAsync({
        requestId: 'req-456',
        requestNumber: 'WO-TEST-002',
        reason: 'Valid rejection reason',
      })
    ).rejects.toThrow('Forbidden')
  })

  it('should include requestNumber in command payload', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ eventId: 'evt-789', requestId: 'req-789', status: 'accepted' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          docs: [{
            id: 'doc-789',
            requestId: 'req-789',
            requestNumber: 'WO-20241211-WXYZ',
            status: 'rejected',
          }],
        }),
      })

    const { result } = renderHook(() => useRejectWriteOff(), {
      wrapper: createWrapper(),
    })

    const rejectPromise = result.current.rejectRequestAsync({
      requestId: 'req-789',
      requestNumber: 'WO-20241211-WXYZ',
      reason: 'Account has active payment plan',
    })

    await vi.runAllTimersAsync()
    await rejectPromise

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(fetchCall[1].body)
    
    expect(body.requestId).toBe('req-789')
    expect(body.requestNumber).toBe('WO-20241211-WXYZ')
    expect(body.reason).toBe('Account has active payment plan')
  })
})
