import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { AccountTabs, type TabId } from '@/components/ServicingView/AccountPanel/AccountTabs'

describe('AccountTabs', () => {
  afterEach(() => {
    cleanup()
  })

  const defaultProps = {
    activeTab: 'overview' as TabId,
    onTabChange: vi.fn(),
  }

  describe('Rendering', () => {
    test('renders all four tabs', () => {
      render(<AccountTabs {...defaultProps} />)

      expect(screen.getByTestId('tab-overview')).toBeInTheDocument()
      expect(screen.getByTestId('tab-transactions')).toBeInTheDocument()
      expect(screen.getByTestId('tab-fees')).toBeInTheDocument()
      expect(screen.getByTestId('tab-actions')).toBeInTheDocument()
    })

    test('renders tab labels', () => {
      render(<AccountTabs {...defaultProps} />)

      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Transactions')).toBeInTheDocument()
      expect(screen.getByText('Fees')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    test('shows keyboard hints when showKeyboardHints is true', () => {
      render(<AccountTabs {...defaultProps} showKeyboardHints />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    test('does not show keyboard hints when showKeyboardHints is false', () => {
      render(<AccountTabs {...defaultProps} showKeyboardHints={false} />)

      // Keyboard hints should not be visible
      expect(screen.queryByText('1')).not.toBeInTheDocument()
      expect(screen.queryByText('2')).not.toBeInTheDocument()
      expect(screen.queryByText('3')).not.toBeInTheDocument()
      expect(screen.queryByText('4')).not.toBeInTheDocument()
    })
  })

  describe('Active tab state', () => {
    test('overview tab is active by default', () => {
      render(<AccountTabs {...defaultProps} activeTab="overview" />)

      const overviewTab = screen.getByTestId('tab-overview')
      expect(overviewTab).toHaveAttribute('aria-selected', 'true')
      expect(overviewTab).toHaveAttribute('tabindex', '0')
    })

    test('transactions tab can be active', () => {
      render(<AccountTabs {...defaultProps} activeTab="transactions" />)

      const transactionsTab = screen.getByTestId('tab-transactions')
      expect(transactionsTab).toHaveAttribute('aria-selected', 'true')
    })

    test('fees tab can be active', () => {
      render(<AccountTabs {...defaultProps} activeTab="fees" />)

      const feesTab = screen.getByTestId('tab-fees')
      expect(feesTab).toHaveAttribute('aria-selected', 'true')
    })

    test('actions tab can be active', () => {
      render(<AccountTabs {...defaultProps} activeTab="actions" />)

      const actionsTab = screen.getByTestId('tab-actions')
      expect(actionsTab).toHaveAttribute('aria-selected', 'true')
    })

    test('inactive tabs have tabindex -1', () => {
      render(<AccountTabs {...defaultProps} activeTab="overview" />)

      expect(screen.getByTestId('tab-transactions')).toHaveAttribute('tabindex', '-1')
      expect(screen.getByTestId('tab-fees')).toHaveAttribute('tabindex', '-1')
      expect(screen.getByTestId('tab-actions')).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('Tab clicking', () => {
    test('clicking overview tab calls onTabChange with overview', () => {
      const onTabChange = vi.fn()
      render(<AccountTabs {...defaultProps} onTabChange={onTabChange} />)

      fireEvent.click(screen.getByTestId('tab-overview'))
      expect(onTabChange).toHaveBeenCalledWith('overview')
    })

    test('clicking transactions tab calls onTabChange with transactions', () => {
      const onTabChange = vi.fn()
      render(<AccountTabs {...defaultProps} onTabChange={onTabChange} />)

      fireEvent.click(screen.getByTestId('tab-transactions'))
      expect(onTabChange).toHaveBeenCalledWith('transactions')
    })

    test('clicking fees tab calls onTabChange with fees', () => {
      const onTabChange = vi.fn()
      render(<AccountTabs {...defaultProps} onTabChange={onTabChange} />)

      fireEvent.click(screen.getByTestId('tab-fees'))
      expect(onTabChange).toHaveBeenCalledWith('fees')
    })

    test('clicking actions tab calls onTabChange with actions', () => {
      const onTabChange = vi.fn()
      render(<AccountTabs {...defaultProps} onTabChange={onTabChange} />)

      fireEvent.click(screen.getByTestId('tab-actions'))
      expect(onTabChange).toHaveBeenCalledWith('actions')
    })
  })

  describe('Keyboard navigation', () => {
    test('ArrowRight moves to next tab', () => {
      const onTabChange = vi.fn()
      render(<AccountTabs {...defaultProps} activeTab="overview" onTabChange={onTabChange} />)

      const overviewTab = screen.getByTestId('tab-overview')
      fireEvent.keyDown(overviewTab, { key: 'ArrowRight' })

      expect(onTabChange).toHaveBeenCalledWith('transactions')
    })

    test('ArrowLeft moves to previous tab', () => {
      const onTabChange = vi.fn()
      render(<AccountTabs {...defaultProps} activeTab="transactions" onTabChange={onTabChange} />)

      const transactionsTab = screen.getByTestId('tab-transactions')
      fireEvent.keyDown(transactionsTab, { key: 'ArrowLeft' })

      expect(onTabChange).toHaveBeenCalledWith('overview')
    })

    test('ArrowRight wraps from last to first tab', () => {
      const onTabChange = vi.fn()
      render(<AccountTabs {...defaultProps} activeTab="actions" onTabChange={onTabChange} />)

      const actionsTab = screen.getByTestId('tab-actions')
      fireEvent.keyDown(actionsTab, { key: 'ArrowRight' })

      expect(onTabChange).toHaveBeenCalledWith('overview')
    })

    test('ArrowLeft wraps from first to last tab', () => {
      const onTabChange = vi.fn()
      render(<AccountTabs {...defaultProps} activeTab="overview" onTabChange={onTabChange} />)

      const overviewTab = screen.getByTestId('tab-overview')
      fireEvent.keyDown(overviewTab, { key: 'ArrowLeft' })

      expect(onTabChange).toHaveBeenCalledWith('actions')
    })
  })

  describe('Fees badge', () => {
    test('shows fees badge when feesCount is provided', () => {
      render(<AccountTabs {...defaultProps} feesCount={5} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    test('does not show fees badge when feesCount is 0', () => {
      render(<AccountTabs {...defaultProps} feesCount={0} />)

      // There should be no badge with 0
      const feesTab = screen.getByTestId('tab-fees')
      expect(feesTab).not.toHaveTextContent('0')
    })

    test('does not show fees badge when feesCount is undefined', () => {
      render(<AccountTabs {...defaultProps} />)

      // No badge should be present
      const feesTab = screen.getByTestId('tab-fees')
      // The tab should only contain the label and possibly keyboard hint
      expect(feesTab.textContent).toContain('Fees')
    })

    test('shows high fees count correctly', () => {
      render(<AccountTabs {...defaultProps} feesCount={99} />)

      expect(screen.getByText('99')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has tablist role', () => {
      render(<AccountTabs {...defaultProps} />)

      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    test('has aria-label on tablist', () => {
      render(<AccountTabs {...defaultProps} />)

      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Account sections')
    })

    test('tabs have tab role', () => {
      render(<AccountTabs {...defaultProps} />)

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(4)
    })

    test('tabs have aria-controls attribute', () => {
      render(<AccountTabs {...defaultProps} />)

      expect(screen.getByTestId('tab-overview')).toHaveAttribute('aria-controls', 'tabpanel-overview')
      expect(screen.getByTestId('tab-transactions')).toHaveAttribute('aria-controls', 'tabpanel-transactions')
      expect(screen.getByTestId('tab-fees')).toHaveAttribute('aria-controls', 'tabpanel-fees')
      expect(screen.getByTestId('tab-actions')).toHaveAttribute('aria-controls', 'tabpanel-actions')
    })
  })
})
