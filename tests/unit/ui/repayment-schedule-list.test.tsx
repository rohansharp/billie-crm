import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { RepaymentScheduleList } from '@/components/ServicingView/AccountPanel/RepaymentScheduleList'
import type { ScheduledPayment } from '@/hooks/queries/useCustomer'

describe('RepaymentScheduleList', () => {
  afterEach(() => {
    cleanup()
  })

  // Sample payment data for tests
  const samplePayments: ScheduledPayment[] = [
    { paymentNumber: 1, dueDate: '2025-11-15', amount: 125.0, status: 'paid', id: 'p1' },
    { paymentNumber: 2, dueDate: '2025-11-29', amount: 125.0, status: 'paid', id: 'p2' },
    { paymentNumber: 3, dueDate: '2025-12-13', amount: 125.0, status: 'paid', id: 'p3' },
    { paymentNumber: 4, dueDate: '2025-12-27', amount: 125.0, status: 'scheduled', id: 'p4' },
    { paymentNumber: 5, dueDate: '2026-01-10', amount: 125.0, status: 'scheduled', id: 'p5' },
    { paymentNumber: 6, dueDate: '2026-01-24', amount: 125.0, status: 'scheduled', id: 'p6' },
  ]

  const defaultProps = {
    payments: samplePayments,
    numberOfPayments: 6,
    paymentFrequency: 'fortnightly' as const,
  }

  describe('Summary display', () => {
    test('renders frequency correctly', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      expect(screen.getByText('Fortnightly')).toBeInTheDocument()
    })

    test('renders weekly frequency', () => {
      render(<RepaymentScheduleList {...defaultProps} paymentFrequency="weekly" />)

      expect(screen.getByText('Weekly')).toBeInTheDocument()
    })

    test('renders monthly frequency', () => {
      render(<RepaymentScheduleList {...defaultProps} paymentFrequency="monthly" />)

      expect(screen.getByText('Monthly')).toBeInTheDocument()
    })

    test('shows paid count out of total', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      expect(screen.getByText('3 of 6 paid')).toBeInTheDocument()
    })

    test('shows total payments when none are paid', () => {
      const unpaidPayments = samplePayments.map((p) => ({ ...p, status: 'scheduled' as const }))
      render(<RepaymentScheduleList {...defaultProps} payments={unpaidPayments} />)

      expect(screen.getByText('6')).toBeInTheDocument()
    })

    test('handles null frequency gracefully', () => {
      render(<RepaymentScheduleList {...defaultProps} paymentFrequency={null} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    test('handles empty payments array', () => {
      render(<RepaymentScheduleList {...defaultProps} payments={[]} numberOfPayments={0} />)

      expect(screen.getByTestId('repayment-schedule-list')).toBeInTheDocument()
      // Toggle should not appear when no payments
      expect(screen.queryByTestId('schedule-toggle')).not.toBeInTheDocument()
    })

    test('handles null payments', () => {
      render(<RepaymentScheduleList {...defaultProps} payments={null} />)

      expect(screen.getByTestId('repayment-schedule-list')).toBeInTheDocument()
      expect(screen.queryByTestId('schedule-toggle')).not.toBeInTheDocument()
    })
  })

  describe('Expand/collapse toggle', () => {
    test('renders toggle button when payments exist', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      expect(screen.getByTestId('schedule-toggle')).toBeInTheDocument()
      expect(screen.getByText('View all 6 payments')).toBeInTheDocument()
    })

    test('payment list is collapsed by default', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      expect(screen.queryByTestId('payment-list')).not.toBeInTheDocument()
    })

    test('clicking toggle expands payment list', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByTestId('payment-list')).toBeInTheDocument()
      expect(screen.getByText('Hide payments')).toBeInTheDocument()
    })

    test('clicking toggle again collapses payment list', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      // Expand
      fireEvent.click(screen.getByTestId('schedule-toggle'))
      expect(screen.getByTestId('payment-list')).toBeInTheDocument()

      // Collapse
      fireEvent.click(screen.getByTestId('schedule-toggle'))
      expect(screen.queryByTestId('payment-list')).not.toBeInTheDocument()
    })

    test('toggle has correct aria-expanded attribute', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      const toggle = screen.getByTestId('schedule-toggle')
      expect(toggle).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
    })

    test('toggle has aria-controls attribute', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      const toggle = screen.getByTestId('schedule-toggle')
      expect(toggle).toHaveAttribute('aria-controls', 'payment-list')
    })
  })

  describe('Keyboard accessibility', () => {
    test('Enter key toggles expansion', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      const toggle = screen.getByTestId('schedule-toggle')
      fireEvent.keyDown(toggle, { key: 'Enter' })

      expect(screen.getByTestId('payment-list')).toBeInTheDocument()
    })

    test('Space key toggles expansion', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      const toggle = screen.getByTestId('schedule-toggle')
      fireEvent.keyDown(toggle, { key: ' ' })

      expect(screen.getByTestId('payment-list')).toBeInTheDocument()
    })
  })

  describe('Payment list display', () => {
    test('renders all payments when expanded', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      // Check each payment row
      for (let i = 1; i <= 6; i++) {
        expect(screen.getByTestId(`payment-row-${i}`)).toBeInTheDocument()
      }
    })

    test('displays payment numbers correctly', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#6')).toBeInTheDocument()
    })

    test('displays payment amounts correctly', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      // All payments are $125.00
      const amounts = screen.getAllByText('$125.00')
      expect(amounts).toHaveLength(6)
    })

    test('displays payment dates correctly', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByText('15 Nov 2025')).toBeInTheDocument()
      expect(screen.getByText('29 Nov 2025')).toBeInTheDocument()
    })

    test('payment list has list role', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByTestId('payment-list')).toHaveAttribute('role', 'list')
    })

    test('payment rows have listitem role', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(6)
    })
  })

  describe('Payment status display', () => {
    test('displays Paid status for paid payments', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      const paidLabels = screen.getAllByText('Paid')
      expect(paidLabels).toHaveLength(3) // 3 paid payments
    })

    test('displays Scheduled status for future payments', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      // Payment 5 and 6 are scheduled (payment 4 is "Due (next)")
      const scheduledLabels = screen.getAllByText('Scheduled')
      expect(scheduledLabels.length).toBeGreaterThanOrEqual(2)
    })

    test('highlights next due payment', () => {
      render(<RepaymentScheduleList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      // Payment 4 is the first scheduled payment, so it should be marked as next
      expect(screen.getByText('Due (next)')).toBeInTheDocument()
    })

    test('displays Missed status for missed payments', () => {
      const paymentsWithMissed: ScheduledPayment[] = [
        { paymentNumber: 1, dueDate: '2025-11-15', amount: 125.0, status: 'paid', id: 'p1' },
        { paymentNumber: 2, dueDate: '2025-11-29', amount: 125.0, status: 'missed', id: 'p2' },
        { paymentNumber: 3, dueDate: '2025-12-13', amount: 125.0, status: 'scheduled', id: 'p3' },
      ]

      render(
        <RepaymentScheduleList
          payments={paymentsWithMissed}
          numberOfPayments={3}
          paymentFrequency="fortnightly"
        />
      )

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByText('Missed')).toBeInTheDocument()
    })

    test('displays Partial status for partial payments', () => {
      const paymentsWithPartial: ScheduledPayment[] = [
        { paymentNumber: 1, dueDate: '2025-11-15', amount: 125.0, status: 'paid', id: 'p1' },
        { paymentNumber: 2, dueDate: '2025-11-29', amount: 125.0, status: 'partial', id: 'p2' },
        { paymentNumber: 3, dueDate: '2025-12-13', amount: 125.0, status: 'scheduled', id: 'p3' },
      ]

      render(
        <RepaymentScheduleList
          payments={paymentsWithPartial}
          numberOfPayments={3}
          paymentFrequency="fortnightly"
        />
      )

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByText('Partial')).toBeInTheDocument()
    })

    test('displays correct status icons', () => {
      const paymentsWithAllStatuses: ScheduledPayment[] = [
        { paymentNumber: 1, dueDate: '2025-11-15', amount: 125.0, status: 'paid', id: 'p1' },
        { paymentNumber: 2, dueDate: '2025-11-29', amount: 125.0, status: 'missed', id: 'p2' },
        { paymentNumber: 3, dueDate: '2025-12-13', amount: 125.0, status: 'partial', id: 'p3' },
        { paymentNumber: 4, dueDate: '2025-12-27', amount: 125.0, status: 'scheduled', id: 'p4' },
      ]

      render(
        <RepaymentScheduleList
          payments={paymentsWithAllStatuses}
          numberOfPayments={4}
          paymentFrequency="fortnightly"
        />
      )

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      // Check for status icons
      expect(screen.getByText('✓')).toBeInTheDocument() // Paid
      expect(screen.getByText('✗')).toBeInTheDocument() // Missed
      expect(screen.getByText('◐')).toBeInTheDocument() // Partial
      expect(screen.getByText('●')).toBeInTheDocument() // Next due
    })
  })

  describe('Edge cases', () => {
    test('handles all payments paid', () => {
      const allPaidPayments = samplePayments.map((p) => ({ ...p, status: 'paid' as const }))

      render(
        <RepaymentScheduleList
          payments={allPaidPayments}
          numberOfPayments={6}
          paymentFrequency="fortnightly"
        />
      )

      expect(screen.getByText('6 of 6 paid')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      // No "Due (next)" should appear when all are paid
      expect(screen.queryByText('Due (next)')).not.toBeInTheDocument()
    })

    test('handles single payment', () => {
      const singlePayment: ScheduledPayment[] = [
        { paymentNumber: 1, dueDate: '2025-11-15', amount: 500.0, status: 'scheduled', id: 'p1' },
      ]

      render(
        <RepaymentScheduleList payments={singlePayment} numberOfPayments={1} paymentFrequency="monthly" />
      )

      expect(screen.getByText('View all 1 payments')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByTestId('payment-row-1')).toBeInTheDocument()
    })

    test('handles payment without id', () => {
      const paymentsNoId: ScheduledPayment[] = [
        { paymentNumber: 1, dueDate: '2025-11-15', amount: 125.0, status: 'scheduled' },
        { paymentNumber: 2, dueDate: '2025-11-29', amount: 125.0, status: 'scheduled' },
      ]

      render(
        <RepaymentScheduleList
          payments={paymentsNoId}
          numberOfPayments={2}
          paymentFrequency="fortnightly"
        />
      )

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      expect(screen.getByTestId('payment-row-1')).toBeInTheDocument()
      expect(screen.getByTestId('payment-row-2')).toBeInTheDocument()
    })

    test('handles null status', () => {
      const paymentsNullStatus: ScheduledPayment[] = [
        { paymentNumber: 1, dueDate: '2025-11-15', amount: 125.0, status: null, id: 'p1' },
      ]

      render(
        <RepaymentScheduleList
          payments={paymentsNullStatus}
          numberOfPayments={1}
          paymentFrequency="fortnightly"
        />
      )

      fireEvent.click(screen.getByTestId('schedule-toggle'))

      // Should default to scheduled appearance
      expect(screen.getByText('Scheduled')).toBeInTheDocument()
    })
  })
})
