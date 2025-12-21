import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { HistoryTab } from '@/components/ApprovalsView'

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

const mockHistoryItems = [
  {
    id: '1',
    requestNumber: 'WO-HIST-001',
    loanAccountId: 'loan-1',
    customerId: 'cust-1',
    customerName: 'John Doe',
    accountNumber: 'ACC-001',
    amount: 5000,
    originalBalance: 5000,
    reason: 'hardship',
    notes: 'Test notes',
    status: 'approved',
    priority: 'normal',
    requiresSeniorApproval: false,
    requestedAt: '2025-12-01T10:00:00Z',
    requestedByName: 'Jane Smith',
    approvalDetails: {
      decidedBy: 'user-1',
      decidedByName: 'Bob Wilson',
      decidedAt: '2025-12-02T14:00:00Z',
      comment: 'Approved for hardship relief',
    },
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-02T14:00:00Z',
  },
  {
    id: '2',
    requestNumber: 'WO-HIST-002',
    loanAccountId: 'loan-2',
    customerId: 'cust-2',
    customerName: 'Alice Brown',
    accountNumber: 'ACC-002',
    amount: 15000,
    originalBalance: 15000,
    reason: 'bankruptcy',
    notes: '',
    status: 'rejected',
    priority: 'urgent',
    requiresSeniorApproval: true,
    requestedAt: '2025-12-03T09:00:00Z',
    requestedByName: 'Charlie Davis',
    approvalDetails: {
      decidedBy: 'user-2',
      decidedByName: 'Diana Evans',
      decidedAt: '2025-12-04T11:00:00Z',
      comment: 'Insufficient documentation provided',
    },
    createdAt: '2025-12-03T09:00:00Z',
    updatedAt: '2025-12-04T11:00:00Z',
  },
]

function setupMockFetch(
  items = mockHistoryItems,
  totalDocs = mockHistoryItems.length
) {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          docs: items,
          totalDocs,
          limit: 20,
          page: 1,
          totalPages: Math.ceil(totalDocs / 20),
          hasNextPage: false,
          hasPrevPage: false,
        }),
    })
  })
}

describe('HistoryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Rendering', () => {
    it('should render history tab container', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('history-tab')).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })
      expect(screen.getByTestId('history-loading')).toBeInTheDocument()
    })

    it('should show filters', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('history-filters')).toBeInTheDocument()
      })
    })

    it('should show history items', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('WO-HIST-001')).toBeInTheDocument()
        expect(screen.getByText('WO-HIST-002')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no history', async () => {
      setupMockFetch([], 0)
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('history-empty')).toBeInTheDocument()
        expect(screen.getByText('No History Records')).toBeInTheDocument()
      })
    })
  })

  describe('Status Display', () => {
    it('should show approved badge for approved items', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('✓ Approved')).toBeInTheDocument()
      })
    })

    it('should show rejected badge for rejected items', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('✕ Rejected')).toBeInTheDocument()
      })
    })
  })

  describe('Row Interaction', () => {
    it('should open detail drawer when row is clicked', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('history-row-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('history-row-1'))

      await waitFor(() => {
        expect(screen.getByText('Audit Record Details')).toBeInTheDocument()
      })
    })

    it('should show decision details in drawer', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('history-row-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('history-row-1'))

      await waitFor(() => {
        // Check drawer is open
        expect(screen.getByText('Audit Record Details')).toBeInTheDocument()
      })

      // Decision details should be visible in drawer
      expect(screen.getByText('Approved for hardship relief')).toBeInTheDocument()
    })

    it('should show audit notice in drawer', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('history-row-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('history-row-1'))

      await waitFor(() => {
        expect(screen.getByText(/immutable audit record/)).toBeInTheDocument()
      })
    })
  })

  describe('Filters', () => {
    it('should have status filter', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument()
      })
    })

    it('should have date filters', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('start-date-filter')).toBeInTheDocument()
        expect(screen.getByTestId('end-date-filter')).toBeInTheDocument()
      })
    })

    it('should show reset button when filters are active', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('status-filter'), { target: { value: 'approved' } })

      await waitFor(() => {
        expect(screen.getByTestId('reset-filters')).toBeInTheDocument()
      })
    })
  })

  describe('Sort', () => {
    it('should have sort select', async () => {
      setupMockFetch()
      render(<HistoryTab />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('history-sort')).toBeInTheDocument()
      })
    })
  })
})
