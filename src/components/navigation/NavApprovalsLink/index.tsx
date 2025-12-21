'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@payloadcms/ui'
import { usePendingApprovals } from '@/hooks/queries/usePendingApprovals'
import styles from './styles.module.css'

/**
 * Navigation link to the Approvals queue with pending count badge.
 * Only visible to users with 'approver' or 'admin' roles.
 * Registered in Payload's beforeNavLinks to appear at the top of the sidebar.
 */
export function NavApprovalsLink() {
  const { user } = useAuth()
  const pathname = usePathname()

  // RBAC check - only show to approvers and admins
  const userRoles = (user?.roles as string[] | undefined) ?? []
  const isApprover = useMemo(
    () => userRoles.includes('approver') || userRoles.includes('admin'),
    [userRoles],
  )

  // Only fetch pending count if user is an approver (performance optimization)
  const { data } = usePendingApprovals({ limit: 1, enabled: isApprover })

  // Don't render if user is not an approver
  if (!isApprover) {
    return null
  }

  const isActive = pathname === '/admin/approvals'
  const pendingCount = data?.totalDocs ?? 0

  return (
    <Link
      href="/admin/approvals"
      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={styles.icon} aria-hidden="true">
        ✅
      </span>
      <span className={styles.label}>Approvals</span>
      {pendingCount > 0 && (
        <span className={styles.badge} aria-label={`${pendingCount} pending approvals`}>
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </Link>
  )
}

// Default export for Payload component registration
export default NavApprovalsLink
