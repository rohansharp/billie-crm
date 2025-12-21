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

  return (
    <div className={`${styles.status} ${config.className}`} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        {config.icon}
      </span>
      <span className={styles.label}>Ledger {config.label}</span>
      {status === 'connected' && latencyMs > 0 && (
        <span className={styles.latency}>{latencyMs}ms</span>
      )}
    </div>
  )
}

// Default export for Payload component registration
export default NavSystemStatus
