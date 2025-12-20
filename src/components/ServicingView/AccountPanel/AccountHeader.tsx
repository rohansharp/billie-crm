'use client'

import type { LoanAccountData } from '@/hooks/queries/useCustomer'
import { CopyButton } from '@/components/ui'
import { getStatusConfig } from '../account-status'
import styles from './styles.module.css'

export interface AccountHeaderProps {
  account: LoanAccountData
  onClose?: () => void
  showClose?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
}

// Hoisted for performance
const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
})

/**
 * AccountHeader - Displays account info bar with status and optional close button.
 * Shows account number, status badge, live/cached indicator, and total balance.
 */
export const AccountHeader: React.FC<AccountHeaderProps> = ({
  account,
  onClose,
  showClose = true,
  onRefresh,
  isRefreshing = false,
}) => {
  const statusConfig = getStatusConfig(account.accountStatus)
  const hasLiveBalance = account.liveBalance !== null

  const totalOutstanding = hasLiveBalance
    ? account.liveBalance!.totalOutstanding
    : account.balances?.totalOutstanding ?? 0

  return (
    <div className={styles.accountHeader} data-testid="account-header">
      <div className={styles.accountHeaderInfo}>
        <span className={styles.accountHeaderIcon}>📍</span>
        <span className={styles.copyable}>
          <span className={styles.accountHeaderNumber}>{account.accountNumber}</span>
          <CopyButton value={account.accountNumber} label="Copy account number" />
        </span>
        <span className={`${styles.accountHeaderStatus} ${styles[statusConfig.colorClass]}`}>
          {statusConfig.label}
        </span>
        {hasLiveBalance ? (
          <span className={styles.accountHeaderLive}>
            <span className={styles.accountHeaderLiveDot} />
            Live
          </span>
        ) : (
          <span className={styles.accountHeaderCached}>
            <span className={styles.accountHeaderCachedDot} />
            Cached
          </span>
        )}
      </div>
      <div className={styles.accountHeaderRight}>
        <span className={styles.accountHeaderBalance}>
          {currencyFormatter.format(totalOutstanding)}
        </span>
        {onRefresh && (
          <button
            type="button"
            className={styles.accountHeaderRefresh}
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh data"
            title="Refresh data from ledger"
            data-testid="refresh-account-data"
          >
            <svg
              className={`${styles.accountHeaderRefreshIcon} ${isRefreshing ? styles.accountHeaderRefreshIconSpinning : ''}`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 8A6 6 0 1 1 8 2" />
              <path d="M14 2v6h-6" />
            </svg>
          </button>
        )}
        {showClose && onClose && (
          <button
            type="button"
            className={styles.accountHeaderClose}
            onClick={onClose}
            aria-label="Close account panel"
            data-testid="close-account-panel"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
