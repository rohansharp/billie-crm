'use client'

import React from 'react'
import Link from 'next/link'
import styles from './styles.module.css'

/**
 * A single breadcrumb item.
 */
export interface BreadcrumbItem {
  /** Display label for this breadcrumb */
  label: string
  /** Link href. If undefined, this is the current page (not a link) */
  href?: string
}

/**
 * Props for the Breadcrumb component.
 */
export interface BreadcrumbProps {
  /** Array of breadcrumb items. Empty array = no breadcrumbs rendered. */
  items: BreadcrumbItem[]
  /** Optional class name for additional styling */
  className?: string
}

/**
 * Breadcrumb navigation component.
 *
 * Displays a hierarchical navigation path with:
 * - Home icon (🏠) linking to dashboard
 * - Separator (›) between items
 * - Current page (last item) styled bold and not a link
 *
 * @example
 * ```tsx
 * // On Dashboard - no breadcrumbs
 * <Breadcrumb items={[]} />
 *
 * // On Approvals
 * <Breadcrumb items={[{ label: 'Approvals' }]} />
 *
 * // On ServicingView
 * <Breadcrumb items={[
 *   { label: 'Customer CUST-001', href: '/admin/servicing/CUST-001' },
 *   { label: 'John Smith' }
 * ]} />
 * ```
 *
 * Story 6.3: Breadcrumb Navigation
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  // Don't render if no items (root page)
  if (items.length === 0) {
    return null
  }

  return (
    <nav
      className={`${styles.breadcrumb} ${className ?? ''}`}
      aria-label="Breadcrumb navigation"
      data-testid="breadcrumb"
    >
      <ol className={styles.list}>
        {/* Home link - always present when there are items */}
        <li className={styles.item}>
          <Link
            href="/admin/dashboard"
            className={styles.link}
            aria-label="Go to dashboard"
            data-testid="breadcrumb-home"
          >
            <span className={styles.homeIcon} aria-hidden="true">
              🏠
            </span>
          </Link>
        </li>

        {/* Breadcrumb items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isCurrentPage = !item.href

          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              <span className={styles.separator} aria-hidden="true">
                ›
              </span>
              {isCurrentPage || isLast ? (
                <span
                  className={styles.current}
                  aria-current={isLast ? 'page' : undefined}
                  data-testid={`breadcrumb-item-${index}`}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href!}
                  className={styles.link}
                  data-testid={`breadcrumb-item-${index}`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
