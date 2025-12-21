'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './styles.module.css'

/**
 * Navigation link to the Dashboard home page.
 * Registered in Payload's beforeNavLinks to appear at the top of the sidebar.
 */
export function NavDashboardLink() {
  const pathname = usePathname()
  const isActive = pathname === '/admin/dashboard'

  return (
    <Link
      href="/admin/dashboard"
      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={styles.icon} aria-hidden="true">
        🏠
      </span>
      <span className={styles.label}>Dashboard</span>
    </Link>
  )
}

// Default export for Payload component registration
export default NavDashboardLink
