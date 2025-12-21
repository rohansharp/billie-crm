'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useApprovalHistory, type ApprovalHistoryFilters, type ApprovalHistoryItem, type ApprovalHistoryOptions } from '@/hooks/queries/useApprovalHistory'
import { SENIOR_APPROVAL_THRESHOLD } from '@/hooks/mutations/useWriteOffRequest'
import { formatCurrency, formatDateShort } from '@/lib/formatters'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import { HistoryFilters } from './HistoryFilters'
import { HistoryDetailDrawer } from './HistoryDetailDrawer'
import styles from './styles.module.css'

export interface HistoryTabProps {
  /** Initial sort option */
  initialSort?: ApprovalHistoryOptions['sort']
}

/**
 * History tab content for the ApprovalsView.
 * Shows completed write-off requests with filtering and detail view.
 */
export const HistoryTab: React.FC<HistoryTabProps> = ({
  initialSort = 'newest',
}) => {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ApprovalHistoryOptions['sort']>(initialSort)
  const [filters, setFilters] = useState<ApprovalHistoryFilters>({})
  const [selectedItem, setSelectedItem] = useState<ApprovalHistoryItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const { data, isLoading, isError, refetch } = useApprovalHistory({
    page,
    limit: DEFAULT_PAGE_SIZE,
    sort,
    filters,
  })

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as ApprovalHistoryOptions['sort'])
    setPage(1) // Reset to first page on sort change
  }, [])

  const handleFiltersChange = useCallback((newFilters: ApprovalHistoryFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page on filter change
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilters({})
    setPage(1)
  }, [])

  const handleRowClick = useCallback((item: ApprovalHistoryItem) => {
    setSelectedItem(item)
    setDrawerOpen(true)
  }, [])

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent, item: ApprovalHistoryItem) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleRowClick(item)
      }
    },
    [handleRowClick]
  )

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    closeTimeoutRef.current = setTimeout(() => {
      setSelectedItem(null)
    }, 300)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingState} data-testid="history-loading">
        <div className={styles.loadingSpinner} />
        <p>Loading history...</p>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className={styles.errorState} data-testid="history-error">
        <p>Failed to load approval history.</p>
        <button type="button" className={styles.refreshBtn} onClick={() => refetch()}>
          Try Again
        </button>
      </div>
    )
  }

  const items = data?.docs ?? []
  const totalPages = data?.totalPages ?? 1
  const totalDocs = data?.totalDocs ?? 0

  return (
    <div className={styles.historyContainer} data-testid="history-tab">
      {/* Controls Bar */}
      <div className={styles.historyControls}>
        <HistoryFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />
        <div className={styles.historySort}>
          <label htmlFor="history-sort" className={styles.filterLabel}>
            Sort
          </label>
          <select
            id="history-sort"
            className={styles.sortSelect}
            value={sort}
            onChange={handleSortChange}
            data-testid="history-sort"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Highest Amount</option>
            <option value="amount-low">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className={styles.historyResultsInfo}>
        {totalDocs} record{totalDocs !== 1 ? 's' : ''} found
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className={styles.emptyState} data-testid="history-empty">
          <div className={styles.emptyIcon}>📋</div>
          <h3 className={styles.emptyTitle}>No History Records</h3>
          <p className={styles.emptyText}>
            {filters.status || filters.startDate || filters.endDate
              ? 'No records match your filters. Try adjusting your criteria.'
              : 'No write-off requests have been completed yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* History Table */}
          <div className={styles.tableContainer}>
            <table className={styles.approvalsTable} aria-label="Approval history">
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Decided By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isApproved = item.status === 'approved'
                  const isHighAmount = item.amount >= SENIOR_APPROVAL_THRESHOLD
                  const decisionDate = item.approvalDetails?.decidedAt || item.updatedAt

                  return (
                    <tr
                      key={item.id}
                      className={styles.tableRow}
                      onClick={() => handleRowClick(item)}
                      onKeyDown={(e) => handleRowKeyDown(e, item)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for ${item.requestNumber}`}
                      data-testid={`history-row-${item.id}`}
                    >
                      <td className={styles.cellMono}>{item.requestNumber}</td>
                      <td>{item.customerName || item.customerId}</td>
                      <td className={styles.cellAmount}>
                        {formatCurrency(item.amount)}
                        {isHighAmount && (
                          <span className={styles.priorityBadgeUrgent} title="Senior approval required">
                            ⚠️
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.historyStatusBadge} ${isApproved ? styles.historyStatusApproved : styles.historyStatusRejected}`}
                        >
                          {isApproved ? '✓ Approved' : '✕ Rejected'}
                        </span>
                      </td>
                      <td>{item.approvalDetails?.decidedByName || '—'}</td>
                      <td className={styles.cellDate}>
                        {formatDateShort(decisionDate)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination} data-testid="history-pagination">
              <span className={styles.paginationInfo}>
                Page {page} of {totalPages}
              </span>
              <div className={styles.paginationButtons}>
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Drawer */}
      <HistoryDetailDrawer
        item={selectedItem}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  )
}

export default HistoryTab
