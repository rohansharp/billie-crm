'use client'

import React, { useState, useEffect } from 'react'
import { useFailedActionsStore } from '@/stores/failed-actions'
import { FailedActionsPanel } from './FailedActionsPanel'
import styles from './styles.module.css'

/**
 * Badge component showing the count of failed actions.
 * Clicking opens the FailedActionsPanel slide-over.
 */
export const FailedActionsBadge: React.FC = () => {
  const [panelOpen, setPanelOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const actions = useFailedActionsStore((state) => state.actions)
  const loadFromStorage = useFailedActionsStore((state) => state.loadFromStorage)

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    loadFromStorage()
  }, [loadFromStorage])

  // Close panel on Escape key
  useEffect(() => {
    if (!panelOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanelOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen])

  // Don't render on server or when no failed actions
  if (!mounted || actions.length === 0) {
    return null
  }

  const count = actions.length

  return (
    <div className={styles.indicatorContainer}>
      <div className={styles.badgeContainer}>
        <button
          type="button"
          className={styles.badgeButton}
          onClick={() => setPanelOpen(!panelOpen)}
          aria-label={`${count} failed action${count !== 1 ? 's' : ''}. Click to view.`}
          aria-expanded={panelOpen}
          data-testid="failed-actions-badge"
        >
          <span className={styles.badgeIcon} aria-hidden="true">
            ⚠️
          </span>
          <span className={styles.badgeCount} data-testid="failed-actions-count">
            {count > 99 ? '99+' : count}
          </span>
        </button>

        {panelOpen && <FailedActionsPanel onClose={() => setPanelOpen(false)} />}
      </div>
    </div>
  )
}

export default FailedActionsBadge
