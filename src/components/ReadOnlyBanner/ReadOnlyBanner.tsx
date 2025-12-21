'use client'

import React, { useState, useEffect } from 'react'
import { useUIStore } from '@/stores/ui'
import styles from './styles.module.css'

export interface ReadOnlyBannerProps {
  /** Custom message (default: "System in read-only mode") */
  message?: string
  /** Custom subtext (default: "Write operations temporarily unavailable") */
  subtext?: string
}

/**
 * Persistent banner displayed when the system is in read-only mode.
 *
 * Appears at the top of the viewport when `readOnlyMode` is true.
 * Automatically hides when the system recovers.
 */
export const ReadOnlyBanner: React.FC<ReadOnlyBannerProps> = ({
  message = 'System in read-only mode',
  subtext = 'Write operations temporarily unavailable.',
}) => {
  const readOnlyMode = useUIStore((state) => state.readOnlyMode)
  const [mounted, setMounted] = useState(false)

  // Only render on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render on server or when not in read-only mode
  if (!mounted || !readOnlyMode) {
    return null
  }

  return (
    <div
      className={styles.banner}
      role="alert"
      aria-live="assertive"
      data-testid="read-only-banner"
    >
      <span className={styles.bannerIcon} aria-hidden="true">
        🔒
      </span>
      <div className={styles.bannerText}>
        <span className={styles.bannerMessage}>{message}</span>
        {subtext && <span className={styles.bannerSubtext}>{subtext}</span>}
      </div>
    </div>
  )
}

export default ReadOnlyBanner
