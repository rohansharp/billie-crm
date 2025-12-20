import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WriteOffRequestDrawer } from '@/components/ServicingView/WriteOffRequestDrawer'

// Mock the mutation hook - with controllable state
const mockSubmitRequestAsync = vi.fn().mockResolvedValue({ doc: { requestNumber: 'WO-TEST' } })
let mockIsPending = false
let mockIsReadOnlyMode = false

vi.mock('@/hooks/mutations/useWriteOffRequest', () => ({
  useWriteOffRequest: () => ({
    submitRequest: vi.fn(),
    submitRequestAsync: mockSubmitRequestAsync,
    isPending: mockIsPending,
    isSuccess: false,
    isError: false,
    error: null,
    isReadOnlyMode: mockIsReadOnlyMode,
  }),
  SENIOR_APPROVAL_THRESHOLD: 10000,
}))

// Mock UI store
vi.mock('@/stores/ui', () => ({
  useUIStore: () => false,
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('WriteOffRequestDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    loanAccountId: 'loan-123',
    customerId: 'cust-456',
    customerName: 'John Smith',
    accountNumber: 'ACC-789',
    totalOutstanding: 5000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPending = false
    mockIsReadOnlyMode = false
    mockSubmitRequestAsync.mockResolvedValue({ doc: { requestNumber: 'WO-TEST' } })
  })

  afterEach(() => {
    cleanup()
  })

  describe('Rendering', () => {
    it('should render the drawer when open', () => {
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      expect(screen.getByText('Request Write-Off')).toBeInTheDocument()
    })

    it('should display account summary', () => {
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      expect(screen.getByText('Account Summary')).toBeInTheDocument()
      expect(screen.getByText('ACC-789')).toBeInTheDocument()
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    })

    it('should default amount to full outstanding balance', () => {
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      const amountInput = screen.getByTestId('writeoff-amount-input')
      expect(amountInput).toHaveValue(5000)
    })

    it('should display reason dropdown with options', () => {
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      const reasonSelect = screen.getByTestId('writeoff-reason-select')
      expect(reasonSelect).toBeInTheDocument()
      expect(screen.getByText('Select a reason...')).toBeInTheDocument()
    })

    it('should display notes textarea', () => {
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      const notesTextarea = screen.getByTestId('writeoff-notes-textarea')
      expect(notesTextarea).toBeInTheDocument()
    })

    it('should display submit button', () => {
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      const submitButton = screen.getByTestId('writeoff-submit-button')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveTextContent('Submit Request')
    })
  })

  describe('Senior Approval Warning', () => {
    it('should show senior approval warning when amount >= $10,000', () => {
      renderWithProviders(
        <WriteOffRequestDrawer {...defaultProps} totalOutstanding={15000} />
      )

      expect(screen.getByText(/requires senior approval/i)).toBeInTheDocument()
    })

    it('should not show senior approval warning when amount < $10,000', () => {
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      expect(screen.queryByText(/requires senior approval/i)).not.toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should disable submit button when no reason selected', () => {
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      const submitButton = screen.getByTestId('writeoff-submit-button')
      // No reason selected, should be disabled
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when form is valid', () => {
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      // Select a reason
      const reasonSelect = screen.getByTestId('writeoff-reason-select')
      fireEvent.change(reasonSelect, { target: { value: 'hardship' } })

      const submitButton = screen.getByTestId('writeoff-submit-button')
      expect(submitButton).not.toBeDisabled()
    })

    it('should have reason select default to empty', () => {
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      const reasonSelect = screen.getByTestId('writeoff-reason-select') as HTMLSelectElement
      expect(reasonSelect.value).toBe('')
    })
  })

  describe('Submission', () => {
    it('should call submitRequestAsync with correct params on submit', async () => {
      const onClose = vi.fn()
      renderWithProviders(
        <WriteOffRequestDrawer {...defaultProps} onClose={onClose} />
      )

      // Select a reason
      const reasonSelect = screen.getByTestId('writeoff-reason-select')
      fireEvent.change(reasonSelect, { target: { value: 'hardship' } })

      // Add notes
      const notesTextarea = screen.getByTestId('writeoff-notes-textarea')
      fireEvent.change(notesTextarea, { target: { value: 'Customer facing financial difficulties' } })

      // Submit
      const submitButton = screen.getByTestId('writeoff-submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSubmitRequestAsync).toHaveBeenCalledWith({
          loanAccountId: 'loan-123',
          customerId: 'cust-456',
          customerName: 'John Smith',
          accountNumber: 'ACC-789',
          amount: 5000,
          originalBalance: 5000,
          reason: 'hardship',
          notes: 'Customer facing financial difficulties',
        })
      })

      expect(onClose).toHaveBeenCalled()
    })

    it('should close drawer after successful submission', async () => {
      const onClose = vi.fn()
      renderWithProviders(
        <WriteOffRequestDrawer {...defaultProps} onClose={onClose} />
      )

      // Select a reason
      const reasonSelect = screen.getByTestId('writeoff-reason-select')
      fireEvent.change(reasonSelect, { target: { value: 'bankruptcy' } })

      // Submit
      const submitButton = screen.getByTestId('writeoff-submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should NOT close drawer when submission fails', async () => {
      const onClose = vi.fn()
      mockSubmitRequestAsync.mockRejectedValue(new Error('API Error'))

      renderWithProviders(
        <WriteOffRequestDrawer {...defaultProps} onClose={onClose} />
      )

      // Select a reason
      const reasonSelect = screen.getByTestId('writeoff-reason-select')
      fireEvent.change(reasonSelect, { target: { value: 'hardship' } })

      // Submit
      const submitButton = screen.getByTestId('writeoff-submit-button')
      fireEvent.click(submitButton)

      // Wait a tick for the async to complete
      await waitFor(() => {
        expect(mockSubmitRequestAsync).toHaveBeenCalled()
      })

      // Drawer should NOT be closed on error
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Cancel', () => {
    it('should call onClose when cancel button clicked', () => {
      const onClose = vi.fn()
      renderWithProviders(
        <WriteOffRequestDrawer {...defaultProps} onClose={onClose} />
      )

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Amount Validation', () => {
    it('should not submit when amount exceeds balance', async () => {
      const onClose = vi.fn()
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} onClose={onClose} />)

      // Change amount to exceed balance
      const amountInput = screen.getByTestId('writeoff-amount-input')
      fireEvent.change(amountInput, { target: { value: '10000' } })

      // Select a reason
      const reasonSelect = screen.getByTestId('writeoff-reason-select')
      fireEvent.change(reasonSelect, { target: { value: 'hardship' } })

      // Submit
      const submitButton = screen.getByTestId('writeoff-submit-button')
      fireEvent.click(submitButton)

      // The submit should be prevented due to validation
      // Since there's a validation error, submitRequestAsync should not be called
      await waitFor(() => {
        expect(mockSubmitRequestAsync).not.toHaveBeenCalled()
      })
    })

    it('should accept amount less than or equal to balance', async () => {
      const onClose = vi.fn()
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} onClose={onClose} />)

      // Keep default amount (equals balance)
      // Select a reason
      const reasonSelect = screen.getByTestId('writeoff-reason-select')
      fireEvent.change(reasonSelect, { target: { value: 'hardship' } })

      // Submit
      const submitButton = screen.getByTestId('writeoff-submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSubmitRequestAsync).toHaveBeenCalled()
      })
    })
  })

  describe('Read-Only Mode', () => {
    it('should show read-only warning when isReadOnlyMode is true', () => {
      mockIsReadOnlyMode = true
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      expect(screen.getByText(/System is in read-only mode/i)).toBeInTheDocument()
    })

    it('should disable form fields in read-only mode', () => {
      mockIsReadOnlyMode = true
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      const amountInput = screen.getByTestId('writeoff-amount-input')
      const reasonSelect = screen.getByTestId('writeoff-reason-select')
      const notesTextarea = screen.getByTestId('writeoff-notes-textarea')

      expect(amountInput).toBeDisabled()
      expect(reasonSelect).toBeDisabled()
      expect(notesTextarea).toBeDisabled()
    })

    it('should disable submit button in read-only mode', () => {
      mockIsReadOnlyMode = true
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      // Even with a valid form, button should be disabled
      const reasonSelect = screen.getByTestId('writeoff-reason-select')
      fireEvent.change(reasonSelect, { target: { value: 'hardship' } })

      const submitButton = screen.getByTestId('writeoff-submit-button')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Pending State', () => {
    it('should show "Submitting..." text when isPending is true', () => {
      mockIsPending = true
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      const submitButton = screen.getByTestId('writeoff-submit-button')
      expect(submitButton).toHaveTextContent('Submitting...')
    })

    it('should disable submit button when isPending is true', () => {
      mockIsPending = true
      renderWithProviders(<WriteOffRequestDrawer {...defaultProps} />)

      // Select a reason to make form valid
      const reasonSelect = screen.getByTestId('writeoff-reason-select')
      fireEvent.change(reasonSelect, { target: { value: 'hardship' } })

      const submitButton = screen.getByTestId('writeoff-submit-button')
      expect(submitButton).toBeDisabled()
    })
  })
})
