import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { HistoryFilters } from '@/components/ApprovalsView'
import type { ApprovalHistoryFilters } from '@/hooks/queries/useApprovalHistory'

describe('HistoryFilters', () => {
  const defaultProps = {
    filters: {} as ApprovalHistoryFilters,
    onFiltersChange: vi.fn(),
    onReset: vi.fn(),
  }

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render filter container', () => {
      render(<HistoryFilters {...defaultProps} />)
      expect(screen.getByTestId('history-filters')).toBeInTheDocument()
    })

    it('should render status filter select', () => {
      render(<HistoryFilters {...defaultProps} />)
      expect(screen.getByTestId('status-filter')).toBeInTheDocument()
    })

    it('should render start date filter', () => {
      render(<HistoryFilters {...defaultProps} />)
      expect(screen.getByTestId('start-date-filter')).toBeInTheDocument()
    })

    it('should render end date filter', () => {
      render(<HistoryFilters {...defaultProps} />)
      expect(screen.getByTestId('end-date-filter')).toBeInTheDocument()
    })

    it('should have proper labels', () => {
      render(<HistoryFilters {...defaultProps} />)
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('From')).toBeInTheDocument()
      expect(screen.getByText('To')).toBeInTheDocument()
    })
  })

  describe('Status Filter', () => {
    it('should have correct options', () => {
      render(<HistoryFilters {...defaultProps} />)
      const select = screen.getByTestId('status-filter')
      
      expect(select).toHaveTextContent('All Completed')
      expect(select).toHaveTextContent('Approved')
      expect(select).toHaveTextContent('Rejected')
    })

    it('should call onFiltersChange with approved status', () => {
      const onFiltersChange = vi.fn()
      render(<HistoryFilters {...defaultProps} onFiltersChange={onFiltersChange} />)
      
      fireEvent.change(screen.getByTestId('status-filter'), {
        target: { value: 'approved' },
      })

      expect(onFiltersChange).toHaveBeenCalledWith({ status: 'approved' })
    })

    it('should call onFiltersChange with rejected status', () => {
      const onFiltersChange = vi.fn()
      render(<HistoryFilters {...defaultProps} onFiltersChange={onFiltersChange} />)
      
      fireEvent.change(screen.getByTestId('status-filter'), {
        target: { value: 'rejected' },
      })

      expect(onFiltersChange).toHaveBeenCalledWith({ status: 'rejected' })
    })

    it('should call onFiltersChange with undefined status when all selected', () => {
      const onFiltersChange = vi.fn()
      render(
        <HistoryFilters
          {...defaultProps}
          filters={{ status: 'approved' }}
          onFiltersChange={onFiltersChange}
        />
      )
      
      fireEvent.change(screen.getByTestId('status-filter'), {
        target: { value: 'all' },
      })

      expect(onFiltersChange).toHaveBeenCalledWith({ status: undefined })
    })

    it('should reflect current status filter value', () => {
      render(
        <HistoryFilters {...defaultProps} filters={{ status: 'rejected' }} />
      )
      
      expect(screen.getByTestId('status-filter')).toHaveValue('rejected')
    })
  })

  describe('Date Filters', () => {
    it('should call onFiltersChange with start date', () => {
      const onFiltersChange = vi.fn()
      render(<HistoryFilters {...defaultProps} onFiltersChange={onFiltersChange} />)
      
      fireEvent.change(screen.getByTestId('start-date-filter'), {
        target: { value: '2025-01-15' },
      })

      expect(onFiltersChange).toHaveBeenCalledWith({ startDate: '2025-01-15' })
    })

    it('should call onFiltersChange with end date', () => {
      const onFiltersChange = vi.fn()
      render(<HistoryFilters {...defaultProps} onFiltersChange={onFiltersChange} />)
      
      fireEvent.change(screen.getByTestId('end-date-filter'), {
        target: { value: '2025-12-31' },
      })

      expect(onFiltersChange).toHaveBeenCalledWith({ endDate: '2025-12-31' })
    })

    it('should clear start date when emptied', () => {
      const onFiltersChange = vi.fn()
      render(
        <HistoryFilters
          {...defaultProps}
          filters={{ startDate: '2025-01-01' }}
          onFiltersChange={onFiltersChange}
        />
      )
      
      fireEvent.change(screen.getByTestId('start-date-filter'), {
        target: { value: '' },
      })

      expect(onFiltersChange).toHaveBeenCalledWith({ startDate: undefined })
    })

    it('should clear end date when emptied', () => {
      const onFiltersChange = vi.fn()
      render(
        <HistoryFilters
          {...defaultProps}
          filters={{ endDate: '2025-12-31' }}
          onFiltersChange={onFiltersChange}
        />
      )
      
      fireEvent.change(screen.getByTestId('end-date-filter'), {
        target: { value: '' },
      })

      expect(onFiltersChange).toHaveBeenCalledWith({ endDate: undefined })
    })

    it('should reflect current date filter values', () => {
      render(
        <HistoryFilters
          {...defaultProps}
          filters={{ startDate: '2025-01-01', endDate: '2025-06-30' }}
        />
      )
      
      expect(screen.getByTestId('start-date-filter')).toHaveValue('2025-01-01')
      expect(screen.getByTestId('end-date-filter')).toHaveValue('2025-06-30')
    })

    it('should preserve existing filters when changing date', () => {
      const onFiltersChange = vi.fn()
      render(
        <HistoryFilters
          {...defaultProps}
          filters={{ status: 'approved' }}
          onFiltersChange={onFiltersChange}
        />
      )
      
      fireEvent.change(screen.getByTestId('start-date-filter'), {
        target: { value: '2025-03-01' },
      })

      expect(onFiltersChange).toHaveBeenCalledWith({
        status: 'approved',
        startDate: '2025-03-01',
      })
    })
  })

  describe('Reset Button', () => {
    it('should not show reset button when no filters active', () => {
      render(<HistoryFilters {...defaultProps} filters={{}} />)
      expect(screen.queryByTestId('reset-filters')).not.toBeInTheDocument()
    })

    it('should show reset button when status filter is active', () => {
      render(
        <HistoryFilters {...defaultProps} filters={{ status: 'approved' }} />
      )
      expect(screen.getByTestId('reset-filters')).toBeInTheDocument()
    })

    it('should show reset button when start date is set', () => {
      render(
        <HistoryFilters {...defaultProps} filters={{ startDate: '2025-01-01' }} />
      )
      expect(screen.getByTestId('reset-filters')).toBeInTheDocument()
    })

    it('should show reset button when end date is set', () => {
      render(
        <HistoryFilters {...defaultProps} filters={{ endDate: '2025-12-31' }} />
      )
      expect(screen.getByTestId('reset-filters')).toBeInTheDocument()
    })

    it('should show reset button when approver is set', () => {
      render(
        <HistoryFilters {...defaultProps} filters={{ approver: 'user-123' }} />
      )
      expect(screen.getByTestId('reset-filters')).toBeInTheDocument()
    })

    it('should call onReset when clicked', () => {
      const onReset = vi.fn()
      render(
        <HistoryFilters
          {...defaultProps}
          filters={{ status: 'approved' }}
          onReset={onReset}
        />
      )
      
      fireEvent.click(screen.getByTestId('reset-filters'))
      expect(onReset).toHaveBeenCalledTimes(1)
    })
  })
})
