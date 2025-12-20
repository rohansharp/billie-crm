'use client'

import type { LoanAccountData } from '@/hooks/queries/useCustomer'
import { getStatusConfig } from '../account-status'
import styles from './styles.module.css'

export interface AccountHeaderProps {
  account: LoanAccountData
  onClose?: () => void
  showClose?: boolean
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
        <span className={styles.accountHeaderNumber}>{account.accountNumber}</span>
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
