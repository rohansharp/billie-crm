'use client'

import { useMemo } from 'react'
import type { LoanAccountData } from '@/hooks/queries/useCustomer'
import type { SelectedFee } from '../FeeList'
import { AccountHeader } from './AccountHeader'
import { AccountTabs, type TabId } from './AccountTabs'
import { AccountSwitcher } from './AccountSwitcher'
import { OverviewTab } from './OverviewTab'
import { TransactionsTab } from './TransactionsTab'
import { FeesTab } from './FeesTab'
import { ActionsTab } from './ActionsTab'
import { useAccountPanelHotkeys } from './useAccountPanelHotkeys'
import styles from './styles.module.css'

export interface AccountPanelProps {
  account: LoanAccountData
  allAccounts: LoanAccountData[]
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onClose: () => void
  onSwitchAccount: (accountId: string) => void
  onWaiveFee: () => void
  onRecordRepayment: () => void
  onBulkWaive: (fees: SelectedFee[]) => void
  /** Number of outstanding fees (for tab badge) */
  feesCount?: number
}

/**
 * AccountPanel - Main container for account details with tabbed navigation.
 * Replaces the drawer-based approach with an inline panel.
 *
 * Keyboard shortcuts:
 * - 1-4: Switch tabs (Overview, Transactions, Fees, Actions)
 * - ↑/↓: Navigate between accounts
 * - Escape: Close panel
 */
export const AccountPanel: React.FC<AccountPanelProps> = ({
  account,
  allAccounts,
  activeTab,
  onTabChange,
  onClose,
  onSwitchAccount,
  onWaiveFee,
  onRecordRepayment,
  onBulkWaive,
  feesCount,
}) => {
  // Other accounts for switcher (exclude current)
  const otherAccounts = useMemo(
    () => allAccounts.filter((a) => a.loanAccountId !== account.loanAccountId),
    [allAccounts, account.loanAccountId]
  )

  // Account IDs for keyboard navigation
  const accountIds = useMemo(
    () => allAccounts.map((a) => a.loanAccountId),
    [allAccounts]
  )

  // Show close button only if there are multiple accounts
  const showClose = allAccounts.length > 1

  // Keyboard shortcuts
  useAccountPanelHotkeys({
    activeTab,
    onTabChange,
    accountIds,
    selectedAccountId: account.loanAccountId,
    onSwitchAccount,
    onClose,
    isActive: true,
  })

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab account={account} />
      case 'transactions':
        return <TransactionsTab loanAccountId={account.loanAccountId} />
      case 'fees':
        return <FeesTab loanAccountId={account.loanAccountId} onBulkWaive={onBulkWaive} />
      case 'actions':
        return (
          <ActionsTab
            account={account}
            onRecordRepayment={onRecordRepayment}
            onWaiveFee={onWaiveFee}
          />
        )
      default:
        return <OverviewTab account={account} />
    }
  }

  return (
    <div className={styles.accountPanel} data-testid="account-panel">
      <AccountHeader account={account} onClose={onClose} showClose={showClose} />
      <AccountTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        feesCount={feesCount}
        showKeyboardHints={allAccounts.length > 0}
      />
      <div className={styles.accountPanelContent}>{renderTabContent()}</div>
      {otherAccounts.length > 0 && (
        <AccountSwitcher accounts={otherAccounts} onSelect={onSwitchAccount} />
      )}
    </div>
  )
}
