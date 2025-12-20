'use client'

import { useCallback } from 'react'
import styles from './styles.module.css'

export type TabId = 'overview' | 'transactions' | 'fees' | 'actions'

export interface TabConfig {
  id: TabId
  label: string
  badge?: number
}

export interface AccountTabsProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  feesCount?: number
}

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'fees', label: 'Fees' },
  { id: 'actions', label: 'Actions' },
]

/**
 * AccountTabs - Tab navigation for account panel.
 * Supports keyboard navigation with arrow keys.
 */
export const AccountTabs: React.FC<AccountTabsProps> = ({
  activeTab,
  onTabChange,
  feesCount,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab)
      let newIndex = currentIndex

      if (e.key === 'ArrowRight') {
        newIndex = (currentIndex + 1) % TABS.length
        e.preventDefault()
      } else if (e.key === 'ArrowLeft') {
        newIndex = (currentIndex - 1 + TABS.length) % TABS.length
        e.preventDefault()
      }

      if (newIndex !== currentIndex) {
        onTabChange(TABS[newIndex].id)
      }
    },
    [activeTab, onTabChange]
  )

  return (
    <div className={styles.tabNav} role="tablist" aria-label="Account sections">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        const badge = tab.id === 'fees' && feesCount && feesCount > 0 ? feesCount : undefined

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            className={`${styles.tabNavItem} ${isActive ? styles.tabNavItemActive : ''}`}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={handleKeyDown}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
            {badge !== undefined && (
              <span className={styles.tabNavBadge}>{badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
