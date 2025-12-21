'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDashboard } from '@/hooks/queries/useDashboard'
import { useRecentCustomersStore } from '@/stores/recentCustomers'
import { useFailedActionsStore } from '@/stores/failed-actions'
import styles from './styles.module.css'

/**
 * Get time-based greeting.
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Format relative time for "last viewed" timestamps.
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

/**
 * Get platform-aware keyboard shortcut text.
 */
function getShortcutLabel(): string {
  if (typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')) {
    return '⌘K'
  }
  return 'Ctrl+K'
}

/**
 * Dashboard home page view.
 *
 * Displays:
 * - Personalized time-based greeting
 * - Action items (pending approvals, failed actions)
 * - Recently viewed customers
 * - System status
 * - Keyboard shortcut tip
 *
 * Story 6.2: Dashboard Home Page
 */
export function DashboardView() {
  const { data, isLoading, error } = useDashboard()
  const recentCustomers = useRecentCustomersStore((s) => s.customers)
  const failedActionsCount = useFailedActionsStore((s) => s.getActiveCount())
  const [shortcutLabel, setShortcutLabel] = useState('⌘K')

  // Detect platform for keyboard shortcut display
  useEffect(() => {
    setShortcutLabel(getShortcutLabel())
  }, [])

  // Load failed actions from localStorage on mount
  useEffect(() => {
    useFailedActionsStore.getState().loadFromStorage()
  }, [])

  const greeting = getGreeting()
  const firstName = data?.user?.firstName ?? 'there'
  const pendingApprovals = data?.actionItems?.pendingApprovalsCount ?? 0
  const canSeeApprovals = data?.user?.role === 'admin' || data?.user?.role === 'supervisor'
  const ledgerStatus = data?.systemStatus?.ledger ?? 'offline'
  const ledgerLatency = data?.systemStatus?.latencyMs ?? 0

  // Map customer IDs to summaries from API response
  const customerSummaryMap = new Map(
    data?.recentCustomersSummary?.map((c) => [c.customerId, c]) ?? [],
  )

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className={styles.container} data-testid="dashboard-loading">
        <div className={styles.header}>
          <div className={styles.skeletonTitle} />
        </div>
        <div className={styles.grid}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCardLarge} />
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.container} data-testid="dashboard-error">
        <div className={styles.errorCard}>
          <span className={styles.errorIcon}>⚠️</span>
          <h2>Unable to load dashboard</h2>
          <p>{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} data-testid="dashboard-view">
      {/* Greeting */}
      <div className={styles.header}>
        <h1 className={styles.greeting} data-testid="dashboard-greeting">
          {greeting}, {firstName}!
        </h1>
      </div>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* Action Items Card */}
        {(canSeeApprovals || failedActionsCount > 0) && (
          <div className={styles.card} data-testid="action-items-card">
            <h2 className={styles.cardTitle}>Action Items</h2>
            <div className={styles.actionList}>
              {canSeeApprovals && pendingApprovals > 0 && (
                <Link
                  href="/admin/approvals"
                  className={styles.actionItem}
                  data-testid="pending-approvals-link"
                >
                  <span className={styles.actionIcon}>✅</span>
                  <span className={styles.actionText}>
                    {pendingApprovals} Pending Approval{pendingApprovals !== 1 ? 's' : ''}
                  </span>
                  <span className={styles.actionArrow}>→</span>
                </Link>
              )}
              {canSeeApprovals && pendingApprovals === 0 && (
                <div className={styles.actionItemEmpty}>
                  <span className={styles.actionIcon}>✅</span>
                  <span className={styles.actionText}>No pending approvals</span>
                </div>
              )}
              {failedActionsCount > 0 && (
                <button
                  type="button"
                  className={styles.actionItem}
                  data-testid="failed-actions-link"
                  onClick={() => {
                    // TODO: Open failed actions panel
                  }}
                >
                  <span className={styles.actionIcon}>⚠️</span>
                  <span className={styles.actionText}>
                    {failedActionsCount} Failed Action{failedActionsCount !== 1 ? 's' : ''}
                  </span>
                  <span className={styles.actionArrow}>→</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* System Status Card */}
        <div className={styles.card} data-testid="system-status-card">
          <h2 className={styles.cardTitle}>System Status</h2>
          <div className={styles.statusList}>
            <div className={styles.statusItem}>
              <span
                className={styles.statusDot}
                data-status={ledgerStatus}
                aria-label={`Ledger service ${ledgerStatus}`}
              />
              <span className={styles.statusLabel}>Ledger Service</span>
              <span className={styles.statusValue}>
                {ledgerStatus === 'online' ? `Online (${ledgerLatency}ms)` : ledgerStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Customers Card */}
        <div className={`${styles.card} ${styles.cardWide}`} data-testid="recent-customers-card">
          <h2 className={styles.cardTitle}>Recent Customers</h2>
          {recentCustomers.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No recently viewed customers.</p>
              <p className={styles.emptyHint}>
                Use {shortcutLabel} to search for a customer to get started.
              </p>
            </div>
          ) : (
            <div className={styles.customerList}>
              <div className={styles.customerHeader}>
                <span>Customer</span>
                <span>Accounts</span>
                <span>Outstanding</span>
                <span>Last Viewed</span>
              </div>
              {recentCustomers.slice(0, 5).map((recent) => {
                const summary = customerSummaryMap.get(recent.customerId)
                return (
                  <Link
                    key={recent.customerId}
                    href={`/admin/servicing/${recent.customerId}`}
                    className={styles.customerRow}
                    data-testid={`customer-row-${recent.customerId}`}
                  >
                    <span className={styles.customerName}>
                      <span className={styles.customerId}>{recent.customerId}</span>
                      <span className={styles.customerFullName}>
                        {summary?.name ?? 'Loading...'}
                      </span>
                    </span>
                    <span className={styles.customerAccounts}>
                      {summary?.accountCount ?? '—'}
                    </span>
                    <span className={styles.customerOutstanding}>
                      {summary?.totalOutstanding ?? '—'}
                    </span>
                    <span className={styles.customerLastViewed}>
                      {formatRelativeTime(recent.viewedAt)}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Tip */}
      <div className={styles.tipFooter} data-testid="keyboard-tip">
        <span className={styles.tipIcon}>💡</span>
        <span className={styles.tipText}>
          Press <kbd className={styles.kbd}>{shortcutLabel}</kbd> to quickly search for any customer
        </span>
      </div>
    </div>
  )
}

// Default export for Payload component registration
export default DashboardView
