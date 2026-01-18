'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './styles.module.css'

/**
 * Navigation link for Export Center view.
 * Shown in the FINANCE section of the sidebar.
 */
export const NavExportsLink: React.FC = () => {
  const pathname = usePathname()
  const isActive = pathname?.startsWith('/admin/exports')

  return (
    <Link
      href="/admin/exports"
      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
      data-testid="nav-exports-link"
    >
      <span className={styles.icon}>📤</span>
      <span className={styles.label}>Export Center</span>
    </Link>
  )
}

export default NavExportsLink
