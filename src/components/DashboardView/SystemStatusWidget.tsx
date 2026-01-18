'use client'

import React from 'react'
import Link from 'next/link'
import { useEventProcessingStatus } from '@/hooks/queries/useEventProcessingStatus'
import styles from './widgets.module.css'

/**
 * Get status display configuration
 */
function getStatusConfig(status: string): { icon: string; label: string; className: string } {
  switch (status) {
    case 'healthy':
      return { icon: '●', label: 'All Healthy', className: styles.statusHealthy }
    case 'degraded':
      return { icon: '●', label: 'Degraded', className: styles.statusDegraded }
    case 'critical':
      return { icon: '●', label: 'Critical', className: styles.statusCritical }
    default:
      return { icon: '●', label: 'Unknown', className: styles.statusUnknown }
  }
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: string | undefined): string {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  const now = new Date()
  const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
  return `${Math.floor(diffSecs / 3600)}h ago`
}

/**
 * System Status Widget
 *
 * Displays event processing health:
 * - Overall status indicator
 * - Pending message count
 * - Last sync time
 *
 * Story E1-S9: Add System Status Widget to Dashboard
 */
export function SystemStatusWidget() {
  const { overallStatus, totalPending, queriedAt, isLoading } = useEventProcessingStatus()

  if (isLoading) {
    return (
      <div className={styles.widget}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetIcon}>📈</span>
          <h3 className={styles.widgetTitle}>System Status</h3>
        </div>
        <div className={styles.widgetSkeleton} />
      </div>
    )
  }

  const statusConfig = getStatusConfig(overallStatus)
  const pendingCount = parseInt(totalPending, 10)

  return (
    <div className={styles.widget}>
      <div className={styles.widgetHeader}>
        <span className={styles.widgetIcon}>📈</span>
        <h3 className={styles.widgetTitle}>System Status</h3>
      </div>
      <div className={styles.widgetContent}>
        <div className={styles.statusRow}>
          <span className={`${styles.statusDot} ${statusConfig.className}`}>
            {statusConfig.icon}
          </span>
          <span className={styles.statusLabel}>{statusConfig.label}</span>
        </div>
        <div className={styles.metricRow}>
          <span className={styles.metricLabel}>Pending msgs</span>
          <span className={`${styles.metricValue} ${pendingCount > 1000 ? styles.metricWarning : ''}`}>
            {pendingCount.toLocaleString()}
          </span>
        </div>
        <div className={styles.metricRow}>
          <span className={styles.metricLabel}>Last sync</span>
          <span className={styles.metricValue}>{formatRelativeTime(queriedAt)}</span>
        </div>
        <Link href="/admin/system-status" className={styles.widgetLink}>
          View Details →
        </Link>
      </div>
    </div>
  )
}
