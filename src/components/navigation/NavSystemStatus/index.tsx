'use client'

import React from 'react'
import { useLedgerHealth } from '@/hooks/queries/useLedgerHealth'
import styles from './styles.module.css'

/**
 * System status indicator showing Ledger health.
 * Registered in Payload's afterNavLinks to appear at the bottom of the sidebar.
 */
export function NavSystemStatus() {
  const { status, latencyMs, isLoading } = useLedgerHealth()

  // Status display configuration
  const statusConfig = {
    connected: { icon: '🟢', label: 'Online', className: styles.online },
    degraded: { icon: '🟡', label: 'Degraded', className: styles.degraded },
    offline: { icon: '🔴', label: 'Offline', className: styles.offline },
  }

  const config = statusConfig[status] ?? statusConfig.offline

  if (isLoading) {
    return (
      <div className={styles.status}>
        <span className={styles.icon} aria-hidden="true">
          ⏳
        </span>
        <span className={styles.label}>Checking...</span>
      </div>
    )
  }

  const tooltipText = status === 'connected'
    ? `Ledger Service: Online (${latencyMs}ms latency)`
    : status === 'degraded'
      ? 'Ledger Service: Degraded - Responses may be slow'
      : 'Ledger Service: Offline - Financial actions unavailable'

  return (
    <div className={`${styles.status} ${config.className}`} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        {config.icon}
      </span>
      <span className={styles.label}>{config.label}</span>
      {status === 'connected' && latencyMs > 0 && (
        <span className={styles.latency}>({latencyMs}ms)</span>
      )}
      {/* Tooltip appears to the right on hover */}
      <span className={styles.tooltip}>{tooltipText}</span>
    </div>
  )
}

// Default export for Payload component registration
export default NavSystemStatus
