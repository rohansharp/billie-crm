'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { ApprovalNotification } from '@/hooks/queries/useApprovalNotifications'
import { formatCurrency } from '@/lib/formatters'
import styles from './styles.module.css'

export interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  notifications: ApprovalNotification[]
  unreadCount: number
  isLoading: boolean
  onMarkAllAsRead: () => void
  onMarkAsRead: (id: string) => void
}

/**
 * Format relative time (e.g., "2h ago", "3d ago")
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

/**
 * Slide-over panel showing notification list.
 */
export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  onMarkAllAsRead,
  onMarkAsRead,
}) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  // Focus trap and focus management
  useEffect(() => {
    if (!isOpen) return

    // Store currently focused element to restore on close
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus the panel on open
    const timer = setTimeout(() => {
      panelRef.current?.focus()
    }, 0)

    // Handle Tab key for focus trap
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return

      const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
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

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleTabKey)
      // Restore focus on close
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Handle click outside
  const handleOverlayClick = useCallback(() => {
    onClose()
  }, [onClose])

  // Prevent panel click from closing
  const handlePanelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Handle notification click
  const handleNotificationClick = useCallback(
    (id: string) => {
      onMarkAsRead(id)
      // Small delay before closing to allow navigation
      closeTimeoutRef.current = setTimeout(() => {
        onClose()
      }, 100)
    },
    [onMarkAsRead, onClose]
  )

  if (!isOpen) return null

  // Track which notifications are unread (simplified - we'll use unreadCount > 0 as indicator)
  // In a real app, we'd track individual read states
  const hasUnread = unreadCount > 0

  return (
    <>
      {/* Overlay */}
      <div
        className={styles.panelOverlay}
        onClick={handleOverlayClick}
        data-testid="notification-panel-overlay"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={styles.panel}
        onClick={handlePanelClick}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        tabIndex={-1}
        data-testid="notification-panel"
      >
        {/* Header */}
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            Pending Approvals
            {notifications.length > 0 && (
              <span style={{ fontWeight: 400, opacity: 0.6 }}>
                {' '}({notifications.length})
              </span>
            )}
          </h2>
          <div className={styles.panelActions}>
            {hasUnread && (
              <button
                type="button"
                className={styles.markAllReadBtn}
                onClick={onMarkAllAsRead}
                disabled={!hasUnread}
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              className={styles.panelCloseBtn}
              onClick={onClose}
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.panelContent}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✓</div>
              <h3 className={styles.emptyTitle}>All caught up!</h3>
              <p className={styles.emptyDescription}>
                No pending write-off requests require your attention.
              </p>
            </div>
          ) : (
            <ul className={styles.notificationList}>
              {notifications.map((notification, index) => {
                // For simplicity, treat first N as unread based on unreadCount
                const isUnread = index < unreadCount

                return (
                  <li key={notification.id}>
                    <Link
                      href="/admin/approvals"
                      className={styles.notificationItem}
                      data-unread={isUnread}
                      onClick={() => handleNotificationClick(notification.id)}
                      data-testid={`notification-item-${notification.id}`}
                    >
                      <div className={styles.notificationHeader}>
                        <span className={styles.notificationTitle}>
                          {isUnread && <span className={styles.unreadDot} />}
                          {notification.requestNumber}
                        </span>
                        <span className={styles.notificationTime}>
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <div className={styles.notificationBody}>
                        <strong>{notification.customerName}</strong> &mdash;{' '}
                        <span className={styles.notificationAmount}>
                          {formatCurrency(notification.amount)}
                        </span>
                      </div>
                      <div className={styles.notificationMeta}>
                        <span className={styles.notificationTag}>
                          {notification.reason.replace(/_/g, ' ')}
                        </span>
                        {notification.requiresSeniorApproval && (
                          <span className={`${styles.notificationTag} ${styles.notificationTagSenior}`}>
                            Senior Approval
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className={styles.panelFooter}>
            <Link
              href="/admin/approvals"
              className={styles.viewAllLink}
              onClick={onClose}
            >
              View All Pending Approvals →
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

export default NotificationPanel
