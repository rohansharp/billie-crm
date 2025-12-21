'use client'

import React from 'react'
import type { ApprovalHistoryFilters } from '@/hooks/queries/useApprovalHistory'
import styles from './styles.module.css'

export interface HistoryFiltersProps {
  filters: ApprovalHistoryFilters
  onFiltersChange: (filters: ApprovalHistoryFilters) => void
  onReset: () => void
}

/**
 * Filter controls for the approval history view.
 * Supports status, date range, and approver filtering.
 */
export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'approved' | 'rejected' | 'all'
    onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : e.target.value
    onFiltersChange({ ...filters, startDate: value })
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : e.target.value
    onFiltersChange({ ...filters, endDate: value })
  }

  const hasActiveFilters = !!(filters.status || filters.startDate || filters.endDate || filters.approver)

  return (
    <div className={styles.historyFilters} data-testid="history-filters">
      {/* Status Filter */}
      <div className={styles.filterGroup}>
        <label htmlFor="status-filter" className={styles.filterLabel}>
          Status
        </label>
        <select
          id="status-filter"
          className={styles.filterSelect}
          value={filters.status || 'all'}
          onChange={handleStatusChange}
          data-testid="status-filter"
        >
          <option value="all">All Completed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Start Date Filter */}
      <div className={styles.filterGroup}>
        <label htmlFor="start-date-filter" className={styles.filterLabel}>
          From
        </label>
        <input
          type="date"
          id="start-date-filter"
          className={styles.filterInput}
          value={filters.startDate || ''}
          onChange={handleStartDateChange}
          data-testid="start-date-filter"
        />
      </div>

      {/* End Date Filter */}
      <div className={styles.filterGroup}>
        <label htmlFor="end-date-filter" className={styles.filterLabel}>
          To
        </label>
        <input
          type="date"
          id="end-date-filter"
          className={styles.filterInput}
          value={filters.endDate || ''}
          onChange={handleEndDateChange}
          data-testid="end-date-filter"
        />
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          type="button"
          className={styles.filterResetBtn}
          onClick={onReset}
          data-testid="reset-filters"
        >
          Reset Filters
        </button>
      )}
    </div>
  )
}

export default HistoryFilters
