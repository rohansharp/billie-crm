'use client'

import React, { useState, useEffect } from 'react'
import { NotificationBadge } from './NotificationBadge'
import styles from './styles.module.css'

export interface NotificationIndicatorProps {
  /** User role - badge only shown for admin/supervisor */
  userRole?: 'admin' | 'supervisor' | 'operations' | 'readonly'
}

/**
 * Fixed-position notification indicator for the Payload admin.
 * Rendered as a floating element in the top-right corner.
 * 
 * Only visible for admin and supervisor roles who can approve requests.
 */
export const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({
  userRole,
}) => {
  const [mounted, setMounted] = useState(false)

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Only show for roles that can approve
  const canApprove = userRole === 'admin' || userRole === 'supervisor'

  if (!canApprove) return null

  return (
    <div className={styles.indicatorContainer} data-testid="notification-indicator">
      <NotificationBadge />
    </div>
  )
}

export default NotificationIndicator
