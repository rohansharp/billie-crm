import { describe, test, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EnhancedScheduleList } from '@/components/ServicingView/AccountPanel/EnhancedScheduleList'

// Mock the useScheduleWithStatus hook
vi.mock('@/hooks/queries', () => ({
  useScheduleWithStatus: vi.fn(),
}))

// Mock UI store with proper selector support
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn((selector: (state: unknown) => unknown) => {
    const state = {
      setHighlightedTransactionId: vi.fn(),
      setTransactionNavigationSource: vi.fn(),
      expandedPaymentNumber: null,
      setExpandedPaymentNumber: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

import { useScheduleWithStatus } from '@/hooks/queries'

const mockUseScheduleWithStatus = useScheduleWithStatus as ReturnType<typeof vi.fn>

// Test utilities
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('EnhancedScheduleList', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-18'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockInstalments = [
    {
      paymentNumber: 1,
      dueDate: '2026-01-15',
      scheduledAmount: '100.00',
      status: 'PAID',
      amountPaid: '100.00',
      amountRemaining: '0.00',
      paidDate: '2026-01-14',
      linkedTransactionIds: ['TXN-001'],
    },
    {
      paymentNumber: 2,
      dueDate: '2026-02-15',
      scheduledAmount: '100.00',
      status: 'PENDING',
      amountPaid: '0.00',
      amountRemaining: '100.00',
      linkedTransactionIds: [],
    },
    {
      paymentNumber: 3,
      dueDate: '2026-03-15',
      scheduledAmount: '100.00',
      status: 'PENDING',
      amountPaid: '0.00',
      amountRemaining: '100.00',
      linkedTransactionIds: [],
    },
  ]

  const mockSummary = {
    totalInstalments: 3,
    paidCount: 1,
    partialCount: 0,
    overdueCount: 0,
    pendingCount: 2,
    nextDueDate: '2026-02-15',
    nextDueAmount: '100.00',
    totalScheduled: '300.00',
    totalPaid: '100.00',
    totalRemaining: '200.00',
  }

  describe('Loading state', () => {
    test('shows loading indicator when fetching', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: [],
        summary: null,
        isLoading: true,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    test('shows error message with retry button', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: [],
        summary: null,
        isLoading: false,
        isError: true,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      expect(screen.getByText('Failed to load schedule')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    test('retry button calls refetch', () => {
      const mockRefetch = vi.fn()
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: [],
        summary: null,
        isLoading: false,
        isError: true,
        isFallback: false,
        refetch: mockRefetch,
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      fireEvent.click(screen.getByText('Retry'))
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Fallback state', () => {
    test('shows fallback message when service unavailable', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: [],
        summary: null,
        isLoading: false,
        isError: false,
        isFallback: true,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      expect(screen.getByText('Schedule status unavailable')).toBeInTheDocument()
    })
  })

  describe('Summary display', () => {
    test('shows instalment count', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: mockInstalments,
        summary: mockSummary,
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      expect(screen.getByText('3')).toBeInTheDocument() // Total instalments
    })

    test('shows paid count badge', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: mockInstalments,
        summary: mockSummary,
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      expect(screen.getByText(/1 Paid/)).toBeInTheDocument()
    })

    test('shows pending count badge', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: mockInstalments,
        summary: mockSummary,
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      expect(screen.getByText(/2 Pending/)).toBeInTheDocument()
    })

    test('shows total paid and remaining', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: mockInstalments,
        summary: mockSummary,
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      expect(screen.getByText('$100.00')).toBeInTheDocument() // Total paid
      expect(screen.getByText('$200.00')).toBeInTheDocument() // Total remaining
    })
  })

  describe('Expand/collapse toggle', () => {
    test('renders toggle button when instalments exist', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: mockInstalments,
        summary: mockSummary,
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      expect(screen.getByTestId('schedule-toggle')).toBeInTheDocument()
      expect(screen.getByText('View all 3 instalments')).toBeInTheDocument()
    })

    test('clicking toggle expands instalment list', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: mockInstalments,
        summary: mockSummary,
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByTestId('payment-list')).toBeInTheDocument()
      expect(screen.getByText('Hide instalments')).toBeInTheDocument()
    })

    test('toggle has correct aria-expanded attribute', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: mockInstalments,
        summary: mockSummary,
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      const toggle = screen.getByTestId('schedule-toggle')
      expect(toggle).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Instalment list display', () => {
    test('renders all instalments when expanded', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: mockInstalments,
        summary: mockSummary,
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByTestId('instalment-row-1')).toBeInTheDocument()
      expect(screen.getByTestId('instalment-row-2')).toBeInTheDocument()
      expect(screen.getByTestId('instalment-row-3')).toBeInTheDocument()
    })

    test('displays correct status for PAID instalment', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: mockInstalments,
        summary: mockSummary,
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByText('Paid')).toBeInTheDocument()
      expect(screen.getByText('✓')).toBeInTheDocument()
    })

    test('displays "Due (next)" for first pending instalment', () => {
      mockUseScheduleWithStatus.mockReturnValue({
        instalments: mockInstalments,
        summary: mockSummary,
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByText('Due (next)')).toBeInTheDocument()
    })
  })

  describe('Overdue status', () => {
    test('displays OVERDUE status correctly', () => {
      const overdueInstalments = [
        {
          paymentNumber: 1,
          dueDate: '2025-12-15',
          scheduledAmount: '100.00',
          status: 'OVERDUE',
          amountPaid: '0.00',
          amountRemaining: '100.00',
          linkedTransactionIds: [],
        },
      ]

      mockUseScheduleWithStatus.mockReturnValue({
        instalments: overdueInstalments,
        summary: {
          ...mockSummary,
          paidCount: 0,
          overdueCount: 1,
          pendingCount: 0,
        },
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByText('Overdue')).toBeInTheDocument()
      expect(screen.getByText('!')).toBeInTheDocument()
    })
  })

  describe('Partial status', () => {
    test('displays PARTIAL status with amounts', () => {
      const partialInstalments = [
        {
          paymentNumber: 1,
          dueDate: '2026-01-15',
          scheduledAmount: '100.00',
          status: 'PARTIAL',
          amountPaid: '50.00',
          amountRemaining: '50.00',
          linkedTransactionIds: [],
        },
      ]

      mockUseScheduleWithStatus.mockReturnValue({
        instalments: partialInstalments,
        summary: {
          ...mockSummary,
          paidCount: 0,
          partialCount: 1,
          pendingCount: 0,
        },
        isLoading: false,
        isError: false,
        isFallback: false,
        refetch: vi.fn(),
      })

      renderWithProviders(<EnhancedScheduleList accountId="LOAN-123" />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByText('Partial')).toBeInTheDocument()
      expect(screen.getByText('◐')).toBeInTheDocument()
      expect(screen.getByText('$50.00 paid')).toBeInTheDocument()
      expect(screen.getByText('$50.00 remaining')).toBeInTheDocument()
    })
  })
})
