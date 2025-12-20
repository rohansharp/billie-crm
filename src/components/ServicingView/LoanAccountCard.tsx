'use client'

import type { LoanAccountData } from '@/hooks/queries/useCustomer'
import { getStatusConfig } from './account-status'
import styles from './styles.module.css'

export interface LoanAccountCardProps {
  account: LoanAccountData
  isSelected?: boolean
  onSelect: (account: LoanAccountData) => void
}

// Hoisted for performance - reused across all renders
const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
})

/**
 * LoanAccountCard - Displays a loan account summary with balance info.
 * Clickable to open details panel. Shows selected state.
 */
export const LoanAccountCard: React.FC<LoanAccountCardProps> = ({
  account,
  isSelected = false,
  onSelect,
}) => {
  const statusConfig = getStatusConfig(account.accountStatus)
  const hasLiveBalance = account.liveBalance !== null

  // Use live balance if available, otherwise fall back to cached
  const principal = hasLiveBalance
    ? account.liveBalance!.principalBalance
    : account.balances?.currentBalance ?? 0

  const fees = hasLiveBalance
    ? account.liveBalance!.feeBalance
    : 0 // Cached doesn't have separate fee balance

  const totalOutstanding = hasLiveBalance
    ? account.liveBalance!.totalOutstanding
    : account.balances?.totalOutstanding ?? 0

  return (
    <button
      type="button"
      className={`${styles.accountCard} ${isSelected ? styles.accountCardSelected : ''}`}
      onClick={() => onSelect(account)}
      aria-pressed={isSelected}
      data-testid={`loan-account-card-${account.loanAccountId}`}
    >
      <div className={styles.accountCardHeader}>
        <div className={styles.accountCardTitle}>
          <span className={styles.accountNumber}>{account.accountNumber}</span>
          <span className={`${styles.accountStatus} ${styles[statusConfig.colorClass]}`}>
            {statusConfig.label}
          </span>
        </div>
        <div className={styles.accountCardIndicator}>
          {hasLiveBalance ? (
            <span className={styles.liveIndicator} title="Live balance from ledger">
              <span className={styles.liveIndicatorDot} />
              Live
            </span>
          ) : (
            <span className={styles.cachedIndicator} title="Cached balance - ledger offline">
              <span className={styles.cachedIndicatorDot} />
              Cached
            </span>
          )}
        </div>
      </div>

      <div className={styles.accountCardBalances}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceLabel}>Principal</span>
          <span className={styles.balanceValue}>{currencyFormatter.format(principal)}</span>
        </div>
        {hasLiveBalance && fees > 0 && (
          <div className={styles.balanceRow}>
            <span className={styles.balanceLabel}>Fees</span>
            <span className={styles.balanceValue}>{currencyFormatter.format(fees)}</span>
          </div>
        )}
        <div className={`${styles.balanceRow} ${styles.balanceRowTotal}`}>
          <span className={styles.balanceLabel}>Total Outstanding</span>
          <span className={styles.balanceValueTotal}>{currencyFormatter.format(totalOutstanding)}</span>
        </div>
      </div>

      <div className={styles.accountCardFooter}>
        <span className={styles.accountCardHint}>
          {isSelected ? '✓ Selected' : 'Click for details →'}
        </span>
      </div>
    </button>
  )
}
