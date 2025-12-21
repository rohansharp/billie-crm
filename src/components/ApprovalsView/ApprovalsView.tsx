'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { stringify } from 'qs-esm'
import { ApprovalsList } from './ApprovalsList'
import styles from './styles.module.css'

export interface ApprovalsViewProps {
  /** Current user's role (for access control) */
  userRole?: 'admin' | 'supervisor' | 'operations' | 'readonly'
  /** Current user's ID (for segregation of duties) */
  userId?: string
  /** Current user's display name (for audit trail) */
  userName?: string
}

/**
 * Main view for the approvals queue.
 * Displays pending write-off requests for approvers to review.
 *
 * Access Control:
 * - Allowed: admin, supervisor
 * - Denied: operations, readonly
 */
export const ApprovalsView: React.FC<ApprovalsViewProps> = ({ userRole, userId, userName }) => {
  // Check access - only admin and supervisor can access
  const allowedRoles = ['admin', 'supervisor']
  const hasAccess = userRole && allowedRoles.includes(userRole)

  // Get pending count for header - use qs-esm for consistent query format
  const { data: pendingCount } = useQuery({
    queryKey: ['write-off-requests', 'pending', 'count'],
    queryFn: async () => {
      const queryString = stringify(
        { where: { status: { equals: 'pending' } }, limit: 0 },
        { addQueryPrefix: true }
      )
      const res = await fetch(`/api/write-off-requests${queryString}`)
      if (!res.ok) return 0
      const data = await res.json()
      return data.totalDocs ?? 0
    },
    staleTime: 30_000,
  })

  // Access denied
  if (!hasAccess) {
    return (
      <div className={styles.approvalsContainer}>
        <div className={styles.accessDenied} data-testid="access-denied">
          <span className={styles.accessDeniedIcon}>🔒</span>
          <h2 className={styles.accessDeniedTitle}>Access Denied</h2>
          <p className={styles.accessDeniedText}>
            You don&apos;t have permission to view the approvals queue.
            This area is restricted to supervisors and administrators.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.approvalsContainer} data-testid="approvals-view">
      {/* Header */}
      <div className={styles.approvalsHeader}>
        <h1 className={styles.approvalsTitle}>
          Pending Approvals
          {typeof pendingCount === 'number' && (
            <span className={styles.approvalsCount}>({pendingCount})</span>
          )}
        </h1>
      </div>

      {/* Approvals List */}
      <ApprovalsList currentUserId={userId} currentUserName={userName} />
    </div>
  )
}

export default ApprovalsView
