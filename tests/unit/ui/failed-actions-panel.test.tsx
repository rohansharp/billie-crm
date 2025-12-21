import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import React from 'react'
import { FailedActionsPanel } from '@/components/FailedActions'
import { useFailedActionsStore } from '@/stores/failed-actions'
import { useUIStore } from '@/stores/ui'

describe('FailedActionsPanel', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store states
    useFailedActionsStore.setState({ actions: [] })
    useUIStore.setState({ readOnlyMode: false })
  })

  afterEach(() => {
    cleanup()
  })

  describe('Rendering', () => {
    it('should render the panel with title', () => {
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByText('Failed Actions (0)')).toBeInTheDocument()
    })

    it('should show empty state when no actions', () => {
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByText('No failed actions')).toBeInTheDocument()
      expect(screen.getByText('✅')).toBeInTheDocument()
    })

    it('should show action count in title', () => {
      useFailedActionsStore.setState({
        actions: [
          { id: '1', type: 'waive-fee', accountId: 'A', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
          { id: '2', type: 'record-repayment', accountId: 'B', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByText('Failed Actions (2)')).toBeInTheDocument()
    })
  })

  describe('Action Items', () => {
    it('should display action type and account', () => {
      useFailedActionsStore.setState({
        actions: [
          {
            id: '1',
            type: 'waive-fee',
            accountId: 'ACC-123',
            accountLabel: 'LOAN-456',
            params: {},
            errorMessage: 'Network timeout',
            timestamp: new Date().toISOString(),
            retryCount: 0,
          },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByText('Waive Fee')).toBeInTheDocument()
      expect(screen.getByText('LOAN-456')).toBeInTheDocument()
      expect(screen.getByText('Network timeout')).toBeInTheDocument()
    })

    it('should show account ID if no label', () => {
      useFailedActionsStore.setState({
        actions: [
          {
            id: '1',
            type: 'waive-fee',
            accountId: 'ACC-123',
            params: {},
            errorMessage: 'Error',
            timestamp: new Date().toISOString(),
            retryCount: 0,
          },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByText('ACC-123')).toBeInTheDocument()
    })

    it('should show retry count when > 0', () => {
      useFailedActionsStore.setState({
        actions: [
          {
            id: '1',
            type: 'waive-fee',
            accountId: 'ACC-123',
            params: {},
            errorMessage: 'Error',
            timestamp: new Date().toISOString(),
            retryCount: 3,
          },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByText('3 retries')).toBeInTheDocument()
    })

    it('should show singular "retry" for count of 1', () => {
      useFailedActionsStore.setState({
        actions: [
          {
            id: '1',
            type: 'waive-fee',
            accountId: 'ACC-123',
            params: {},
            errorMessage: 'Error',
            timestamp: new Date().toISOString(),
            retryCount: 1,
          },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByText('1 retry')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should have Retry button for each action', () => {
      useFailedActionsStore.setState({
        actions: [
          { id: '1', type: 'waive-fee', accountId: 'A', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByTestId('retry-action-1')).toBeInTheDocument()
    })

    it('should have Dismiss button for each action', () => {
      useFailedActionsStore.setState({
        actions: [
          { id: '1', type: 'waive-fee', accountId: 'A', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByTestId('dismiss-action-1')).toBeInTheDocument()
    })

    it('should dismiss action when Dismiss is clicked', () => {
      useFailedActionsStore.setState({
        actions: [
          { id: '1', type: 'waive-fee', accountId: 'A', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      fireEvent.click(screen.getByTestId('dismiss-action-1'))

      expect(useFailedActionsStore.getState().actions).toHaveLength(0)
    })

    it('should disable Retry button when in read-only mode', () => {
      useUIStore.setState({ readOnlyMode: true })
      useFailedActionsStore.setState({
        actions: [
          { id: '1', type: 'waive-fee', accountId: 'A', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByTestId('retry-action-1')).toBeDisabled()
    })
  })

  describe('Panel Controls', () => {
    it('should call onClose when close button is clicked', () => {
      render(<FailedActionsPanel onClose={mockOnClose} />)

      fireEvent.click(screen.getByTestId('close-failed-actions-panel'))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when overlay is clicked', () => {
      render(<FailedActionsPanel onClose={mockOnClose} />)

      // The overlay is aria-hidden, so we need to find it another way
      const panel = screen.getByTestId('failed-actions-panel')
      const overlay = panel.previousElementSibling

      if (overlay) {
        fireEvent.click(overlay)
        expect(mockOnClose).toHaveBeenCalled()
      }
    })

    it('should show Clear All button when there are actions', () => {
      useFailedActionsStore.setState({
        actions: [
          { id: '1', type: 'waive-fee', accountId: 'A', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByTestId('clear-all-failed-actions')).toBeInTheDocument()
    })

    it('should clear all and close when Clear All is clicked', () => {
      useFailedActionsStore.setState({
        actions: [
          { id: '1', type: 'waive-fee', accountId: 'A', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
          { id: '2', type: 'waive-fee', accountId: 'B', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      fireEvent.click(screen.getByTestId('clear-all-failed-actions'))

      expect(useFailedActionsStore.getState().actions).toHaveLength(0)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have aria-modal="true"', () => {
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByTestId('failed-actions-panel')).toHaveAttribute('aria-modal', 'true')
    })

    it('should have aria-labelledby pointing to title', () => {
      render(<FailedActionsPanel onClose={mockOnClose} />)

      const panel = screen.getByTestId('failed-actions-panel')
      expect(panel).toHaveAttribute('aria-labelledby', 'failed-actions-title')
    })
  })

  describe('Action Type Icons', () => {
    it('should show correct icon for waive-fee', () => {
      useFailedActionsStore.setState({
        actions: [
          { id: '1', type: 'waive-fee', accountId: 'A', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByText('🎁')).toBeInTheDocument()
    })

    it('should show correct icon for record-repayment', () => {
      useFailedActionsStore.setState({
        actions: [
          { id: '1', type: 'record-repayment', accountId: 'A', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByText('💳')).toBeInTheDocument()
    })

    it('should show correct icon for write-off-request', () => {
      useFailedActionsStore.setState({
        actions: [
          { id: '1', type: 'write-off-request', accountId: 'A', params: {}, errorMessage: 'E', timestamp: new Date().toISOString(), retryCount: 0 },
        ],
      })
      render(<FailedActionsPanel onClose={mockOnClose} />)

      expect(screen.getByText('❌')).toBeInTheDocument()
    })
  })
})
