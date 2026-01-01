'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import styles from './styles.module.css'

/**
 * Navigation link to the Dashboard home page.
 * Registered in Payload's beforeNavLinks to appear at the top of the sidebar.
 * 
 * Uses <a> tag instead of Next.js Link to force full page load,
 * ensuring Payload's admin template renders correctly with sidebar.
 */
export function NavDashboardLink() {
  const pathname = usePathname()
  const isActive = pathname === '/admin/dashboard' || pathname === '/admin'

  return (
    <a
      href="/admin/dashboard"
      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={styles.icon} aria-hidden="true">
        🏠
      </span>
      <span className={styles.label}>Dashboard</span>
    </a>
  )
}

// Default export for Payload component registration
export default NavDashboardLink
