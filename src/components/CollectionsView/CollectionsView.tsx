'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useOverdueAccounts, type OverdueAccount } from '@/hooks/queries/useOverdueAccounts'
import styles from './styles.module.css'

/**
 * Bucket display configuration
 */
const BUCKET_CONFIG: Record<string, { label: string; className: string }> = {
  current: { label: 'Current', className: styles.bucketCurrent },
  bucket_1: { label: 'Bucket 1', className: styles.bucket1 },
  bucket_2: { label: 'Bucket 2', className: styles.bucket2 },
  bucket_3: { label: 'Bucket 3', className: styles.bucket3 },
  bucket_4: { label: 'Bucket 4', className: styles.bucket4 },
}

/**
 * Format currency for display
 */
function formatCurrency(amount: string): string {
  const num = parseFloat(amount)
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(num)
}

/**
 * Get DPD badge class based on days past due
 */
function getDpdClass(dpd: number): string {
  if (dpd >= 60) return styles.dpdHigh
  if (dpd >= 30) return styles.dpdMedium
  return styles.dpdLow
}

/**
 * Collections Queue View
 *
 * Displays a filterable, paginated list of overdue accounts for collections team.
 * Allows navigation to individual account servicing views.
 *
 * Story E1-S1: Collections Queue View Shell
 */
export function CollectionsView() {
  const router = useRouter()

  // Filter state
  const [bucket, setBucket] = useState<string>('')
  const [minDpd, setMinDpd] = useState<string>('')
  const [maxDpd, setMaxDpd] = useState<string>('')
  const [pageToken, setPageToken] = useState<string | undefined>(undefined)

  // Build filters object
  const filters = useMemo(
    () => ({
      bucket: bucket || undefined,
      minDpd: minDpd ? parseInt(minDpd, 10) : undefined,
      maxDpd: maxDpd ? parseInt(maxDpd, 10) : undefined,
      pageSize: 50,
      pageToken,
    }),
    [bucket, minDpd, maxDpd, pageToken],
  )

  // Fetch overdue accounts
  const { accounts, totalCount, nextPageToken, isFallback, isLoading } =
    useOverdueAccounts(filters)

  // Calculate total overdue amount
  const totalAmount = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + parseFloat(acc.totalOverdueAmount || '0'), 0)
  }, [accounts])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setBucket('')
    setMinDpd('')
    setMaxDpd('')
    setPageToken(undefined)
  }, [])

  // Navigate to account servicing
  const handleRowClick = useCallback(
    (account: OverdueAccount) => {
      // Navigate to servicing view - we'll need to look up the customer ID
      // For now, navigate to loan accounts collection with the account ID
      router.push(`/admin/collections/loan-accounts/${account.accountId}`)
    },
    [router],
  )

  // Handle pagination
  const handleNextPage = useCallback(() => {
    if (nextPageToken) {
      setPageToken(nextPageToken)
    }
  }, [nextPageToken])

  const handlePrevPage = useCallback(() => {
    // Note: This is a simplified implementation
    // Full implementation would track page history
    setPageToken(undefined)
  }, [])

  // Export to CSV
  const handleExport = useCallback(() => {
    const headers = ['Account ID', 'DPD', 'Bucket', 'Amount', 'Last Updated']
    const rows = accounts.map((acc) => [
      acc.accountId,
      acc.dpd.toString(),
      acc.bucket,
      acc.totalOverdueAmount,
      acc.lastUpdated,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collections-queue-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [accounts])

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Collections Queue</h1>
        <div className={styles.headerActions}>
          <button className={styles.exportButton} onClick={handleExport} disabled={accounts.length === 0}>
            <span>📤</span>
            Export
          </button>
        </div>
      </div>

      {/* Fallback Banner */}
      {isFallback && (
        <div className={styles.fallbackBanner}>
          <span className={styles.fallbackIcon}>⚠️</span>
          <span className={styles.fallbackText}>
            Ledger service unavailable. Showing cached data.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Bucket</label>
            <select
              className={styles.filterSelect}
              value={bucket}
              onChange={(e) => {
                setBucket(e.target.value)
                setPageToken(undefined)
              }}
            >
              <option value="">All Buckets</option>
              <option value="bucket_1">Bucket 1 (1-30 DPD)</option>
              <option value="bucket_2">Bucket 2 (31-60 DPD)</option>
              <option value="bucket_3">Bucket 3 (61-90 DPD)</option>
              <option value="bucket_4">Bucket 4 (90+ DPD)</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Min DPD</label>
            <input
              type="number"
              className={styles.filterInput}
              value={minDpd}
              onChange={(e) => {
                setMinDpd(e.target.value)
                setPageToken(undefined)
              }}
              placeholder="1"
              min="1"
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Max DPD</label>
            <input
              type="number"
              className={styles.filterInput}
              value={maxDpd}
              onChange={(e) => {
                setMaxDpd(e.target.value)
                setPageToken(undefined)
              }}
              placeholder="∞"
              min="1"
            />
          </div>

          <button className={styles.clearFilters} onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <span className={styles.summaryText}>
          <span className={styles.summaryCount}>{totalCount}</span> Overdue Accounts
        </span>
        <span className={styles.summaryText}>
          Total: <span className={styles.summaryAmount}>{formatCurrency(totalAmount.toString())}</span>
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>Loading accounts...</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>✅</span>
            <h3 className={styles.emptyTitle}>No Overdue Accounts</h3>
            <p className={styles.emptyText}>
              {bucket || minDpd || maxDpd
                ? 'No accounts match the current filters.'
                : 'All accounts are current. Great work!'}
            </p>
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Customer</th>
                  <th>DPD</th>
                  <th>Bucket</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const bucketInfo = BUCKET_CONFIG[account.bucket] || {
                    label: account.bucket,
                    className: '',
                  }

                  return (
                    <tr key={account.accountId} onClick={() => handleRowClick(account)}>
                      <td>
                        <span className={styles.accountLink}>{account.accountId}</span>
                      </td>
                      <td>—</td>
                      <td>
                        <span className={`${styles.dpdBadge} ${getDpdClass(account.dpd)}`}>
                          {account.dpd}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.bucketBadge} ${bucketInfo.className}`}>
                          {bucketInfo.label}
                        </span>
                      </td>
                      <td>
                        <span className={styles.amount}>
                          {formatCurrency(account.totalOverdueAmount)}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.arrowButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(account)
                          }}
                        >
                          →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={handlePrevPage}
                disabled={!pageToken}
              >
                ← Previous
              </button>
              <span className={styles.pageInfo}>
                Showing {accounts.length} of {totalCount}
              </span>
              <button
                className={styles.pageButton}
                onClick={handleNextPage}
                disabled={!nextPageToken}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
