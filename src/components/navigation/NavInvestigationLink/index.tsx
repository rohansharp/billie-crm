'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './styles.module.css'

/**
 * Navigation link for Investigation view.
 * Shown in the ADMIN section of the sidebar.
 */
export const NavInvestigationLink: React.FC = () => {
  const pathname = usePathname()
  const isActive = pathname?.startsWith('/admin/investigation')

  return (
    <Link
      href="/admin/investigation"
      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
      data-testid="nav-investigation-link"
    >
      <span className={styles.icon}>🔬</span>
      <span className={styles.label}>Investigation</span>
    </Link>
  )
}

export default NavInvestigationLink
