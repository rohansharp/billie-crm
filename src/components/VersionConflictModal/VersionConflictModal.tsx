'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { ERROR_MESSAGES } from '@/lib/errors/messages'
import styles from './styles.module.css'

/**
 * Preserved changes to display in the modal.
 */
export interface PreservedChanges {
  /** User-friendly labels and values */
  items: Array<{ label: string; value: string }>
}

export interface VersionConflictModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal is closed without action */
  onClose: () => void
  /** Callback when user clicks "Refresh & Retry" */
  onRefresh: () => void
  /** Whether refresh is in progress */
  isRefreshing?: boolean
  /** The user's changes to preserve for reference */
  preservedChanges?: PreservedChanges
}

/**
 * Modal displayed when a version conflict is detected.
 *
 * Shows an error message explaining that the data was modified by another user,
 * optionally displays the user's unsaved changes for reference, and provides
 * buttons to cancel or refresh & retry.
 *
 * @example
 * ```tsx
 * <VersionConflictModal
 *   isOpen={showConflictModal}
 *   onClose={() => setShowConflictModal(false)}
 *   onRefresh={handleRefreshAndRetry}
 *   preservedChanges={{
 *     items: [
 *       { label: 'Amount', value: '$150.00' },
 *       { label: 'Reason', value: 'Customer goodwill' },
 *     ],
 *   }}
 * />
 * ```
 */
export const VersionConflictModal: React.FC<VersionConflictModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  isRefreshing = false,
  preservedChanges,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const refreshBtnRef = useRef<HTMLButtonElement>(null)

  // Focus refresh button when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => refreshBtnRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!isOpen) return

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !isRefreshing) {
        onClose()
      }
    },
    [isRefreshing, onClose]
  )

  if (!isOpen) return null

  return (
    <div
      className={styles.modalOverlay}
      onClick={isRefreshing ? undefined : onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-conflict-title"
      data-testid="version-conflict-modal"
    >
      <div
        ref={modalRef}
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className={styles.modalHeader}>
          <h2 id="version-conflict-title" className={styles.modalTitle}>
            <span className={styles.warningIcon}>⚠️</span>
            Data Changed
          </h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={isRefreshing}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalMessage}>{ERROR_MESSAGES.VERSION_CONFLICT}</p>

          {preservedChanges && preservedChanges.items.length > 0 && (
            <div className={styles.changesSection}>
              <p className={styles.changesSectionTitle}>Your Changes (for reference):</p>
              <ul className={styles.changesList}>
                {preservedChanges.items.map((item) => (
                  <li key={`${item.label}-${item.value}`}>
                    <strong>{item.label}:</strong> {item.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isRefreshing}
          >
            Cancel
          </button>
          <button
            ref={refreshBtnRef}
            type="button"
            className={styles.refreshBtn}
            onClick={onRefresh}
            disabled={isRefreshing}
            data-testid="refresh-button"
          >
            {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh & Retry'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VersionConflictModal
