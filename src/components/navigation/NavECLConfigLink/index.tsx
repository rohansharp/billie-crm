'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './styles.module.css'

/**
 * Navigation link for ECL Configuration view.
 * Shown in the FINANCE section of the sidebar.
 */
export const NavECLConfigLink: React.FC = () => {
  const pathname = usePathname()
  const isActive = pathname?.startsWith('/admin/ecl-config')

  return (
    <Link
      href="/admin/ecl-config"
      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
      data-testid="nav-ecl-config-link"
    >
      <span className={styles.icon}>⚙️</span>
      <span className={styles.label}>ECL Config</span>
    </Link>
  )
}

export default NavECLConfigLink
