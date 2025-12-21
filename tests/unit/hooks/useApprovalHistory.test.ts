import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useApprovalHistory,
  approvalHistoryQueryKey,
  type ApprovalHistoryOptions,
} from '@/hooks/queries/useApprovalHistory'

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

const mockHistoryResponse = {
  docs: [
    {
      id: '1',
      requestNumber: 'WO-001',
      status: 'approved',
      amount: 5000,
    },
  ],
  totalDocs: 1,
  limit: 20,
  page: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
}

describe('useApprovalHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Query Key Generation', () => {
    it('should generate query key with write-off-requests prefix', () => {
      const key = approvalHistoryQueryKey({})
      expect(key[0]).toBe('write-off-requests')
      expect(key[1]).toBe('history')
    })

    it('should include options in query key', () => {
      const options: ApprovalHistoryOptions = {
        page: 2,
        filters: { status: 'approved' },
      }
      const key = approvalHistoryQueryKey(options)
      expect(key[2]).toEqual(options)
    })

    it('should generate different keys for different options', () => {
      const key1 = approvalHistoryQueryKey({ page: 1 })
      const key2 = approvalHistoryQueryKey({ page: 2 })
      expect(key1).not.toEqual(key2)
    })
  })

  describe('Hook Behavior', () => {
    it('should fetch history on mount', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      const { result } = renderHook(() => useApprovalHistory(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(result.current.data?.docs).toHaveLength(1)
    })

    it('should return loading state initially', () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useApprovalHistory(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should return error state on fetch failure', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() => useApprovalHistory(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('Filter Construction', () => {
    it('should filter by approved status only', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      renderHook(
        () => useApprovalHistory({ filters: { status: 'approved' } }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callUrl).toContain('status')
      expect(callUrl).toContain('equals')
      expect(callUrl).toContain('approved')
    })

    it('should filter by rejected status only', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      renderHook(
        () => useApprovalHistory({ filters: { status: 'rejected' } }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callUrl).toContain('rejected')
    })

    it('should include both approved and rejected when status is all', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      renderHook(
        () => useApprovalHistory({ filters: { status: 'all' } }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      // Should use 'in' operator for both statuses
      expect(callUrl).toContain('in')
    })

    it('should include date range in query', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      renderHook(
        () =>
          useApprovalHistory({
            filters: {
              startDate: '2025-01-01',
              endDate: '2025-12-31',
            },
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callUrl).toContain('createdAt')
      expect(callUrl).toContain('2025-01-01')
      expect(callUrl).toContain('2025-12-31')
    })

    it('should include approver filter in query', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      renderHook(
        () => useApprovalHistory({ filters: { approver: 'user-123' } }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callUrl).toContain('decidedBy')
      expect(callUrl).toContain('user-123')
    })
  })

  describe('Sort Options', () => {
    it('should sort by newest first by default', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      renderHook(() => useApprovalHistory(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callUrl).toContain('sort')
      expect(callUrl).toContain('-updatedAt')
    })

    it('should sort by oldest when specified', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      renderHook(() => useApprovalHistory({ sort: 'oldest' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      // Should NOT have minus sign for ascending
      expect(callUrl).toContain('updatedAt')
      expect(callUrl).not.toContain('-updatedAt')
    })

    it('should sort by amount high when specified', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      renderHook(() => useApprovalHistory({ sort: 'amount-high' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callUrl).toContain('-amount')
    })

    it('should sort by amount low when specified', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      renderHook(() => useApprovalHistory({ sort: 'amount-low' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callUrl).toContain('amount')
      expect(callUrl).not.toContain('-amount')
    })
  })

  describe('Pagination', () => {
    it('should include page and limit in query', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoryResponse),
      })

      renderHook(() => useApprovalHistory({ page: 3, limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callUrl).toContain('page')
      expect(callUrl).toContain('3')
      expect(callUrl).toContain('limit')
      expect(callUrl).toContain('10')
    })
  })
})
