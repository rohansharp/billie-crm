import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useApproveWriteOff } from '@/hooks/mutations/useApproveWriteOff'
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

describe('useApproveWriteOff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should expose mutation functions and states', () => {
    const { result } = renderHook(() => useApproveWriteOff(), {
      wrapper: createWrapper(),
    })

    expect(result.current.approveRequest).toBeDefined()
    expect(result.current.approveRequestAsync).toBeDefined()
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('should call command API endpoint with POST method', async () => {
    // Mock command API response (202 Accepted)
    const commandResponse = {
      eventId: 'evt-123',
      requestId: 'req-123',
      status: 'accepted',
      message: 'Event accepted',
    }

    // Mock polling response (projection found)
    const projectionResponse = {
      docs: [{
        id: 'doc-123',
        requestNumber: 'WO-TEST-001',
        requestId: 'req-123',
        status: 'approved',
        approvalDetails: {
          approvedBy: 'user-1',
          approvedByName: 'Test User',
          approvedAt: '2025-12-11T00:00:00Z',
          comment: 'Approved for testing',
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

    const { result } = renderHook(() => useApproveWriteOff(), {
      wrapper: createWrapper(),
    })

    const approvePromise = result.current.approveRequestAsync({
      requestId: 'req-123',
      requestNumber: 'WO-TEST-001',
      comment: 'Approved for testing',
    })

    // Fast-forward timers for polling
    await vi.runAllTimersAsync()

    await approvePromise

    // Verify command API was called
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/commands/writeoff/approve',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('should validate comment length before API call', async () => {
    const { result } = renderHook(() => useApproveWriteOff(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.approveRequestAsync({
        requestId: 'req-123',
        requestNumber: 'WO-TEST-001',
        comment: 'Short', // Less than MIN_APPROVAL_COMMENT_LENGTH
      })
    ).rejects.toThrow(`Approval comment must be at least ${MIN_APPROVAL_COMMENT_LENGTH} characters`)

    // Should NOT have called fetch
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should start in non-pending state', () => {
    const { result } = renderHook(() => useApproveWriteOff(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)
  })

  it('should handle command API errors gracefully', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Not authorized' } }),
    })

    const { result } = renderHook(() => useApproveWriteOff(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.approveRequestAsync({
        requestId: 'req-123',
        requestNumber: 'WO-TEST-001',
        comment: 'Valid approval comment',
      })
    ).rejects.toThrow('Not authorized')
  })

  it('should include requestNumber in command payload', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ eventId: 'evt-123', requestId: 'req-123', status: 'accepted' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          docs: [{
            id: 'doc-123',
            requestId: 'req-123',
            requestNumber: 'WO-20241211-ABCD',
            status: 'approved',
          }],
        }),
      })

    const { result } = renderHook(() => useApproveWriteOff(), {
      wrapper: createWrapper(),
    })

    const approvePromise = result.current.approveRequestAsync({
      requestId: 'req-123',
      requestNumber: 'WO-20241211-ABCD',
      comment: 'Approved after review',
    })

    await vi.runAllTimersAsync()
    await approvePromise

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(fetchCall[1].body)
    
    expect(body.requestId).toBe('req-123')
    expect(body.requestNumber).toBe('WO-20241211-ABCD')
    expect(body.comment).toBe('Approved after review')
  })
})
