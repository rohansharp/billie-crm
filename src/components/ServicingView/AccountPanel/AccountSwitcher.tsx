'use client'

import type { LoanAccountData } from '@/hooks/queries/useCustomer'
import { getStatusConfig } from '../account-status'
import styles from './styles.module.css'

export interface AccountSwitcherProps {
  accounts: LoanAccountData[]
  onSelect: (accountId: string) => void
}

// Hoisted for performance
const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
})

/**
 * AccountSwitcher - Mini-cards for quick account switching.
 * Displayed at bottom of AccountPanel when multiple accounts exist.
 */
export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ accounts, onSelect }) => {
  if (accounts.length === 0) {
    return null
  }

  return (
    <div className={styles.accountSwitcher} data-testid="account-switcher">
      <span className={styles.accountSwitcherTitle}>Other Accounts:</span>
      <div className={styles.accountSwitcherList}>
        {accounts.map((account) => {
          const statusConfig = getStatusConfig(account.accountStatus)
          const hasLiveBalance = account.liveBalance !== null
          const totalOutstanding = hasLiveBalance
            ? account.liveBalance!.totalOutstanding
            : account.balances?.totalOutstanding ?? 0

          return (
            <button
              key={account.loanAccountId}
              type="button"
              className={styles.accountSwitcherCard}
              onClick={() => onSelect(account.loanAccountId)}
              data-testid={`switch-to-${account.loanAccountId}`}
            >
              <span className={styles.accountSwitcherNumber}>{account.accountNumber}</span>
              <span className={`${styles.accountSwitcherStatus} ${styles[statusConfig.colorClass]}`}>
                {statusConfig.label}
              </span>
              <span className={styles.accountSwitcherBalance}>
                {currencyFormatter.format(totalOutstanding)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
