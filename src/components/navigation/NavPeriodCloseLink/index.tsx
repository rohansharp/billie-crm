'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './styles.module.css'

/**
 * Navigation link for Period Close view.
 * Shown in the FINANCE section of the sidebar.
 */
export const NavPeriodCloseLink: React.FC = () => {
  const pathname = usePathname()
  const isActive = pathname?.startsWith('/admin/period-close')

  return (
    <Link
      href="/admin/period-close"
      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
      data-testid="nav-period-close-link"
    >
      <span className={styles.icon}>📅</span>
      <span className={styles.label}>Period Close</span>
    </Link>
  )
}

export default NavPeriodCloseLink
