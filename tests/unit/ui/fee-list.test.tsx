/**
 * Unit tests for FeeList component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FeeList, type SelectedFee } from '@/components/ServicingView/FeeList'

// Mock useTransactions
vi.mock('@/hooks/queries/useTransactions', () => ({
  useTransactions: vi.fn(),
  TRANSACTION_TYPES: [],
}))

// Mock useUIStore
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn((selector) =>
    selector({ readOnlyMode: false, setReadOnlyMode: vi.fn() })
  ),
}))

import { useTransactions } from '@/hooks/queries/useTransactions'

const mockTransactions = [
  {
    transactionId: 'TX-001',
    loanAccountId: 'LA-001',
    type: 'LATE_FEE',
    typeLabel: 'Late Fee',
    transactionDate: '2024-01-15T00:00:00Z',
    effectiveDate: '2024-01-15T00:00:00Z',
    principalDelta: '0',
    feeDelta: '25.00',
    totalDelta: '25.00',
    principalAfter: '1000.00',
    feeAfter: '25.00',
    totalAfter: '1025.00',
    description: 'Late payment fee',
    referenceType: '',
    referenceId: 'REF-001',
    createdBy: 'system',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    transactionId: 'TX-002',
    loanAccountId: 'LA-001',
    type: 'DISHONOUR_FEE',
    typeLabel: 'Dishonour Fee',
    transactionDate: '2024-01-20T00:00:00Z',
    effectiveDate: '2024-01-20T00:00:00Z',
    principalDelta: '0',
    feeDelta: '50.00',
    totalDelta: '50.00',
    principalAfter: '1000.00',
    feeAfter: '75.00',
    totalAfter: '1075.00',
    description: 'Dishonoured payment',
    referenceType: '',
    referenceId: 'REF-002',
    createdBy: 'system',
    createdAt: '2024-01-20T00:00:00Z',
  },
  {
    transactionId: 'TX-003',
    loanAccountId: 'LA-001',
    type: 'REPAYMENT',
    typeLabel: 'Repayment',
    transactionDate: '2024-01-25T00:00:00Z',
    effectiveDate: '2024-01-25T00:00:00Z',
    principalDelta: '-100.00',
    feeDelta: '0',
    totalDelta: '-100.00',
    principalAfter: '900.00',
    feeAfter: '75.00',
    totalAfter: '975.00',
    description: 'Customer payment',
    referenceType: '',
    referenceId: 'REF-003',
    createdBy: 'customer',
    createdAt: '2024-01-25T00:00:00Z',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('FeeList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('should show placeholder when no account selected', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId={null} />, { wrapper: createWrapper() })

      expect(screen.getByText('Select a loan account to view fees')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isFetching: true,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      expect(screen.getByText('Loading fees...')).toBeInTheDocument()
    })

    it('should show empty state when no waivable fees', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: [mockTransactions[2]], // Only repayment, no fees
          totalCount: 1,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      expect(screen.getByText('No outstanding fees')).toBeInTheDocument()
    })

    it('should display waivable fees only', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      // Should show 2 fees (LATE_FEE and DISHONOUR_FEE), not repayment
      expect(screen.getByText('Outstanding Fees (2)')).toBeInTheDocument()
      expect(screen.getByText('Late Fee')).toBeInTheDocument()
      expect(screen.getByText('Dishonour Fee')).toBeInTheDocument()
    })

    it('should show Select button when fees available', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      expect(screen.getByTestId('selection-mode-toggle')).toHaveTextContent('Select')
    })
  })

  describe('selection mode', () => {
    it('should enter selection mode when Select clicked', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      const selectBtn = screen.getByTestId('selection-mode-toggle')
      fireEvent.click(selectBtn)

      // Button should now say Cancel
      expect(selectBtn).toHaveTextContent('Cancel')

      // Toolbar should appear
      expect(screen.getByText('Select All')).toBeInTheDocument()
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })

    it('should show checkboxes in selection mode', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      // Enter selection mode
      fireEvent.click(screen.getByTestId('selection-mode-toggle'))

      // Should have checkboxes for each fee
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(2)
    })

    it('should select fee when checkbox clicked', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      // Enter selection mode
      fireEvent.click(screen.getByTestId('selection-mode-toggle'))

      // Click first checkbox
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])

      // Summary should update - check for the combined text in toolbar summary
      expect(screen.getByText(/1 selected • \$25\.00/)).toBeInTheDocument()
    })

    it('should select all fees when Select All clicked', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      // Enter selection mode
      fireEvent.click(screen.getByTestId('selection-mode-toggle'))

      // Click Select All
      fireEvent.click(screen.getByText('Select All'))

      // Summary should show all fees
      expect(screen.getByText(/2 selected/)).toBeInTheDocument()
      expect(screen.getByText(/\$75\.00/)).toBeInTheDocument()
    })

    it('should clear selection when Clear clicked', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      // Enter selection mode and select all
      fireEvent.click(screen.getByTestId('selection-mode-toggle'))
      fireEvent.click(screen.getByText('Select All'))

      // Clear
      fireEvent.click(screen.getByText('Clear'))

      // Summary should show 0 selected
      expect(screen.getByText(/0 selected/)).toBeInTheDocument()
      expect(screen.getByText(/\$0\.00/)).toBeInTheDocument()
    })

    it('should exit selection mode and clear when Cancel clicked', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      // Enter selection mode and select all
      fireEvent.click(screen.getByTestId('selection-mode-toggle'))
      fireEvent.click(screen.getByText('Select All'))

      // Cancel
      fireEvent.click(screen.getByTestId('selection-mode-toggle'))

      // Should be back to Select button
      expect(screen.getByTestId('selection-mode-toggle')).toHaveTextContent('Select')

      // Toolbar should be gone
      expect(screen.queryByText('Select All')).not.toBeInTheDocument()
    })
  })

  describe('bulk waive', () => {
    it('should disable Waive Selected when nothing selected', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      // Enter selection mode
      fireEvent.click(screen.getByTestId('selection-mode-toggle'))

      const waiveBtn = screen.getByTestId('waive-selected-button')
      expect(waiveBtn).toBeDisabled()
    })

    it('should enable Waive Selected when fees selected', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      render(<FeeList loanAccountId="LA-001" />, { wrapper: createWrapper() })

      // Enter selection mode and select
      fireEvent.click(screen.getByTestId('selection-mode-toggle'))
      fireEvent.click(screen.getByText('Select All'))

      const waiveBtn = screen.getByTestId('waive-selected-button')
      expect(waiveBtn).not.toBeDisabled()
    })

    it('should call onBulkWaive with selected fees', () => {
      vi.mocked(useTransactions).mockReturnValue({
        data: {
          loanAccountId: 'LA-001',
          transactions: mockTransactions,
          totalCount: 3,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      } as ReturnType<typeof useTransactions>)

      const handleBulkWaive = vi.fn()
      render(<FeeList loanAccountId="LA-001" onBulkWaive={handleBulkWaive} />, {
        wrapper: createWrapper(),
      })

      // Enter selection mode and select all
      fireEvent.click(screen.getByTestId('selection-mode-toggle'))
      fireEvent.click(screen.getByText('Select All'))

      // Click Waive Selected
      fireEvent.click(screen.getByTestId('waive-selected-button'))

      expect(handleBulkWaive).toHaveBeenCalledTimes(1)
      expect(handleBulkWaive).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ transactionId: 'TX-001', amount: 25 }),
          expect.objectContaining({ transactionId: 'TX-002', amount: 50 }),
        ])
      )
    })
  })
})
